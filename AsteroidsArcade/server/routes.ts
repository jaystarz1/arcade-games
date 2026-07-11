import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertHighScoreSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // High Scores API
  app.get("/api/high-scores", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const highScores = await storage.getHighScores(limit);
      res.json(highScores);
    } catch (error) {
      console.error("Error fetching high scores:", error);
      res.status(500).json({ error: "Failed to fetch high scores" });
    }
  });

  app.post("/api/high-scores", async (req, res) => {
    try {
      const validated = insertHighScoreSchema.parse(req.body);
      const highScore = await storage.createHighScore(validated);
      res.status(201).json(highScore);
    } catch (error) {
      console.error("Error creating high score:", error);
      res.status(400).json({ error: "Invalid high score data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
