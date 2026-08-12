#!/usr/bin/env node
import http from "http";
import fs from "fs";
import path from "node:path";


const projectRoot = process.env.INIT_CWD ?? process.cwd();

const config = JSON.parse(
    fs.readFileSync(
        path.join(projectRoot, "trellis.config.json"), "utf8"
    ) ?? ""
);

const PORT = config.fileServer?.port ?? 3000;


const server = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }
    if (req.method === "POST" && req.url === "/write") {
        let body = "";

        req.on("data", chunk => {
            body += chunk;
        });

        req.on("end", () => {
            const { path: filePath, content } = JSON.parse(body);

            fs.writeFileSync(
                path.resolve(projectRoot, filePath),
                content
            );

            res.statusCode = 200;
            res.end();
        });
        return;
    }

    if (req.method === "POST" && req.url === "/read") {
        let body = "";

        req.on("data", chunk => {
            body += chunk;
        });

        req.on("end", () => {
            const { path: filePath } = JSON.parse(body);

            const fullPath = path.resolve(projectRoot, filePath);

            if (!fs.existsSync(fullPath)) {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: "File not found" }));
                return;
            }

            const content = fs.readFileSync(fullPath, "utf8");

            res.writeHead(200, {
                "Content-Type": "application/json",
            });

            res.end(content);
        });

        return;

    }


    res.writeHead(404);
    res.end();
});

// 4. Start listening on the designated port
server.listen(PORT, () => {
    console.log(`Server successfully listening on port ${PORT}`);
});