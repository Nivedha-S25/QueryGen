import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import Database from "better-sqlite3";
import { initializeDatabase } from "./db-setup.ts";

async function startServer() {
  // Initialize database on startup
  initializeDatabase();

  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API route to execute SQL query
  app.post("/api/query", (req, res) => {
    const { sql } = req.body;

    if (!sql) {
      return res.status(400).json({ error: "SQL query is required" });
    }

    try {
      const db = new Database("data_vault.db");
      const stmt = db.prepare(sql);
      
      let results;
      if (sql.trim().toUpperCase().startsWith("SELECT")) {
        results = stmt.all();
      } else {
        results = stmt.run();
      }
      
      db.close();
      res.json({ results });
    } catch (error: any) {
      console.error("SQL Execution Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
