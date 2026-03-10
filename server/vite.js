import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
const viteLogger = {
    info: (msg) => console.log(msg),
    warn: (msg) => console.warn(msg),
    error: (msg) => console.error(msg),
    clearScreen: () => { },
    hasErrorLogged: () => false,
    warnOnce: () => { },
    hasWarned: false,
};
export async function setupVite(app, server) {
    const serverOptions = {
        middlewareMode: true,
        hmr: { server },
        allowedHosts: true,
    };
    const vite = await createViteServer({
        ...{},
        configFile: path.resolve(import.meta.dirname, "..", "vite.config.ts"),
        customLogger: viteLogger,
        server: serverOptions,
        appType: "custom",
    });
    app.use(vite.middlewares);
    app.use("/{*splat}", async (req, res, next) => {
        const url = req.originalUrl;
        try {
            const clientTemplate = path.resolve(import.meta.dirname, "..", "client", "index.html");
            let template = await fs.promises.readFile(clientTemplate, "utf-8");
            template = await vite.transformIndexHtml(url, template);
            res.status(200).set({ "Content-Type": "text/html" }).end(template);
        }
        catch (e) {
            vite.ssrFixStacktrace(e);
            next(e);
        }
    });
}
export function serveStatic(app) {
    const distPath = path.resolve(import.meta.dirname, "public");
    if (!fs.existsSync(distPath)) {
        throw new Error(`Could not find the build directory: ${distPath}, make sure to build the client first`);
    }
    app.use(express.static(distPath));
    app.use("/{*splat}", (_req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
    });
}
//# sourceMappingURL=vite.js.map