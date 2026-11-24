#!/usr/bin/env node
// Dev-only file server that lets the browser build read and write project files
// (scene JSON for the editor). It binds to loopback, only serves allowed origins,
// and refuses any path outside the project root.
import http from "http";
import fs from "fs";
import path from "node:path";


const projectRoot = path.resolve(process.env.INIT_CWD ?? process.cwd());

const configPath = path.join(projectRoot, "trellis.config.json");
const config = fs.existsSync(configPath)
    ? JSON.parse(fs.readFileSync(configPath, "utf8"))
    : {};

const HOST = "127.0.0.1";
const PORT = config.fileServer?.port ?? 3000;
const MAX_BODY_BYTES = 10 * 1024 * 1024;

// Browser origins allowed to call this server. Defaults to Vite's dev server.
const allowedOrigins = new Set(
    config.fileServer?.allowedOrigins ?? [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
);
// Guard against DNS rebinding: only accept requests addressed to loopback.
const allowedHosts = new Set([
    `localhost:${PORT}`,
    `127.0.0.1:${PORT}`,
]);

function resolveInsideProject(filePath) {
    if (typeof filePath !== "string" || filePath.length === 0) return null;
    const fullPath = path.resolve(projectRoot, filePath);
    const relative = path.relative(projectRoot, fullPath);
    if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) {
        return null;
    }
    return fullPath;
}

function readJsonBody(req, res, onBody) {
    let body = "";
    let size = 0;
    let aborted = false;
    req.on("data", chunk => {
        if (aborted) return;
        size += chunk.length;
        if (size > MAX_BODY_BYTES) {
            aborted = true;
            send(res, 413, { error: "Body too large" });
            req.destroy();
            return;
        }
        body += chunk;
    });
    req.on("end", () => {
        if (aborted) return;
        let parsed;
        try {
            parsed = JSON.parse(body);
        } catch {
            send(res, 400, { error: "Invalid JSON" });
            return;
        }
        onBody(parsed);
    });
}

function send(res, status, payload) {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(payload === undefined ? "" : JSON.stringify(payload));
}

const server = http.createServer((req, res) => {
    if (!allowedHosts.has(req.headers.host ?? "")) {
        send(res, 403, { error: "Host not allowed" });
        return;
    }

    // Browsers always send Origin on cross-origin requests. Requests with no
    // Origin come from local non-browser tools, which are already trusted.
    const origin = req.headers.origin;
    if (origin !== undefined) {
        if (!allowedOrigins.has(origin)) {
            send(res, 403, { error: `Origin ${origin} not allowed` });
            return;
        }
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
        res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

    // Requiring JSON forces a CORS preflight for any cross-origin caller.
    const contentType = (req.headers["content-type"] ?? "").split(";")[0].trim();
    if (req.method === "POST" && contentType !== "application/json") {
        send(res, 415, { error: "Content-Type must be application/json" });
        return;
    }

    if (req.method === "POST" && req.url === "/write") {
        readJsonBody(req, res, ({ path: filePath, content }) => {
            const fullPath = resolveInsideProject(filePath);
            if (!fullPath) {
                send(res, 403, { error: "Path outside project" });
                return;
            }
            if (typeof content !== "string") {
                send(res, 400, { error: "content must be a string" });
                return;
            }
            try {
                fs.writeFileSync(fullPath, content);
            } catch (err) {
                send(res, 500, { error: String(err.message ?? err) });
                return;
            }
            send(res, 200);
        });
        return;
    }

    if (req.method === "POST" && req.url === "/read") {
        readJsonBody(req, res, ({ path: filePath }) => {
            const fullPath = resolveInsideProject(filePath);
            if (!fullPath) {
                send(res, 403, { error: "Path outside project" });
                return;
            }
            if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
                send(res, 404, { error: "File not found" });
                return;
            }
            const content = fs.readFileSync(fullPath, "utf8");
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(content);
        });
        return;
    }

    send(res, 404, { error: "Not found" });
});

server.listen(PORT, HOST, () => {
    console.log(`Trellis file server listening on http://${HOST}:${PORT}`);
    console.log(`Allowed origins: ${[...allowedOrigins].join(", ")}`);
});
