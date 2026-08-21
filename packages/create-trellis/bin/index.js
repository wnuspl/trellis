#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import readline from 'readline/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const sharedTemplatePath = path.join(__dirname, "../shared");

const projectName = process.argv[2];
const root = process.env.INIT_CWD ?? process.cwd();

if (!projectName) {
    console.error("Please provide a project name.");
    process.exit(1);
}



let target = "vite-web";
const targetTemplatePath = path.join(__dirname, `../templates/${target}`);

const projectPath = path.resolve(root, projectName);

if (!fs.existsSync(projectPath)) {
    fs.mkdirSync(projectPath, { recursive: true })
}

fs.cpSync(sharedTemplatePath, projectPath, { recursive: true })
fs.cpSync(targetTemplatePath, projectPath, { recursive: true })


// write to package.json

const packageJsonPath = path.join(projectPath, "package.json");
const packageJson = JSON.parse(
    fs.readFileSync(packageJsonPath, "utf8")
);

packageJson.name = projectName;

fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + "\n"
);