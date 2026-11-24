#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import readline from "node:readline/promises";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sharedDir = path.join(packageRoot, "shared");
const templatesDir = path.join(packageRoot, "templates");

// npm strips dotfiles like .gitignore from published packages, so templates
// ship them with a leading underscore and they are renamed on copy.
const RENAME_ON_COPY = { _gitignore: ".gitignore" };

const HELP = `
Usage: npm create @wnuspl/trellis@latest [project-name] -- [options]

Options:
  -t, --template <name>  Template to use (see --list)
      --list             List available templates
  -f, --force            Scaffold into a non-empty directory
  -y, --yes              Use defaults instead of prompting
  -h, --help             Show this help
`;

// Every folder in templates/ is a template; its template.json is optional metadata.
function loadTemplates() {
    return fs.readdirSync(templatesDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => {
            const metaPath = path.join(templatesDir, entry.name, "template.json");
            const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, "utf8")) : {};
            return {
                name: entry.name,
                title: meta.title ?? entry.name,
                description: meta.description ?? "",
                order: meta.order ?? Infinity,
                nextSteps: meta.nextSteps ?? ["npm install"],
            };
        })
        .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

function fail(message) {
    console.error(`\n  ${message}\n`);
    process.exit(1);
}

function isEmptyDir(dir) {
    return !fs.existsSync(dir) || fs.readdirSync(dir).filter((f) => f !== ".git").length === 0;
}

function toPackageName(name) {
    return name.trim().toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/^[._]/, "")
        .replace(/[^a-z0-9-~._]+/g, "-") || "trellis-game";
}

function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        if (entry.name === "template.json") continue;
        const from = path.join(src, entry.name);
        const to = path.join(dest, RENAME_ON_COPY[entry.name] ?? entry.name);
        if (entry.isDirectory()) copyDir(from, to);
        else fs.copyFileSync(from, to);
    }
}

async function prompt(rl, question, fallback) {
    const answer = (await rl.question(`${question}${fallback ? ` (${fallback})` : ""}: `)).trim();
    return answer || fallback;
}

async function chooseTemplate(rl, templates) {
    console.log("\nTemplates:");
    templates.forEach((t, i) => console.log(`  ${i + 1}) ${t.title.padEnd(20)} ${t.description}`));
    while (true) {
        const answer = await prompt(rl, "Choose a template", "1");
        const byIndex = templates[Number(answer) - 1];
        const byName = templates.find((t) => t.name === answer);
        if (byIndex || byName) return byIndex ?? byName;
        console.log(`  '${answer}' is not a template.`);
    }
}

async function main() {
    let args;
    try {
        args = parseArgs({
            allowPositionals: true,
            options: {
                template: { type: "string", short: "t" },
                list: { type: "boolean" },
                force: { type: "boolean", short: "f" },
                yes: { type: "boolean", short: "y" },
                help: { type: "boolean", short: "h" },
            },
        });
    } catch (error) {
        fail(`${error.message}\n${HELP}`);
    }
    const { values, positionals } = args;
    const templates = loadTemplates();

    if (values.help) return console.log(HELP);
    if (values.list) {
        for (const t of templates) console.log(`  ${t.name.padEnd(12)} ${t.title} - ${t.description}`);
        return;
    }

    const interactive = process.stdin.isTTY && !values.yes;
    const rl = interactive ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null;

    try {
        let projectName = positionals[0];
        if (!projectName) projectName = rl ? await prompt(rl, "Project name", "trellis-game") : "trellis-game";

        let template;
        if (values.template) {
            template = templates.find((t) => t.name === values.template);
            if (!template) fail(`Unknown template '${values.template}'. Available: ${templates.map((t) => t.name).join(", ")}`);
        } else {
            template = rl ? await chooseTemplate(rl, templates) : templates[0];
        }

        // npm runs create-* packages from a temp dir; INIT_CWD is where the user ran npm.
        const cwd = process.env.INIT_CWD ?? process.cwd();
        const projectPath = path.resolve(cwd, projectName);

        if (!isEmptyDir(projectPath) && !values.force) {
            const overwrite = rl && /^y(es)?$/i.test(await prompt(rl, `${projectPath} is not empty. Scaffold into it anyway? [y/N]`, "N"));
            if (!overwrite) fail(`${projectPath} is not empty. Use --force to scaffold into it anyway.`);
        }

        copyDir(sharedDir, projectPath);
        copyDir(path.join(templatesDir, template.name), projectPath);

        const packageJsonPath = path.join(projectPath, "package.json");
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
        packageJson.name = toPackageName(path.basename(projectPath));
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");

        const relative = path.relative(cwd, projectPath) || ".";
        console.log(`\nCreated ${template.title} project in ${projectPath}\n\nNext steps:`);
        if (relative !== ".") console.log(`  cd ${relative.includes(" ") ? `"${relative}"` : relative}`);
        for (const step of template.nextSteps) console.log(`  ${step}`);
        console.log();
    } finally {
        rl?.close();
    }
}

await main();
