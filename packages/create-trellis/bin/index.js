#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatePath = path.join(__dirname, "../template");

const projectName = process.argv[2];
const root = process.env.INIT_CWD ?? process.cwd();

if (!projectName) {
    console.error("Please provide a project name.");
    process.exit(1);
}

const projectPath = path.resolve(root, projectName);

console.log("Project:", projectName);
console.log("Path:", projectPath);

if (!fs.existsSync(projectPath)) {
    fs.mkdirSync(projectPath, { recursive: true })
}

fs.cpSync(templatePath, projectPath, { recursive: true })


const packageJsonPath = path.join(projectPath, "package.json");
const packageJson = JSON.parse(
    fs.readFileSync(packageJsonPath, "utf8")
);

packageJson.name = projectName;

fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + "\n"
);