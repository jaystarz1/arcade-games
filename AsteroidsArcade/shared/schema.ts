import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const highScores = pgTable("high_scores", {
  id: serial("id").primaryKey(),
  initials: text("initials").notNull(),
  score: integer("score").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertHighScoreSchema = createInsertSchema(highScores)
  .pick({
    initials: true,
    score: true,
  })
  .refine(
    (data) => data.initials.length === 3,
    { message: "Initials must be exactly 3 characters" }
  )
  .refine(
    (data) => data.score >= 0,
    { message: "Score must be non-negative" }
  );

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type HighScore = typeof highScores.$inferSelect;
export type InsertHighScore = z.infer<typeof insertHighScoreSchema>;
