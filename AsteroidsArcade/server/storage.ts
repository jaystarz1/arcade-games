import { users, highScores, type User, type InsertUser, type HighScore, type InsertHighScore } from "@shared/schema";
import { db } from "./db";
import { desc, eq } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getHighScores(limit?: number): Promise<HighScore[]>;
  createHighScore(highScore: InsertHighScore): Promise<HighScore>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private highScores: HighScore[];
  currentId: number;
  currentHighScoreId: number;

  constructor() {
    this.users = new Map();
    this.highScores = [];
    this.currentId = 1;
    this.currentHighScoreId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getHighScores(limit: number = 10): Promise<HighScore[]> {
    return this.highScores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async createHighScore(insertHighScore: InsertHighScore): Promise<HighScore> {
    const highScore: HighScore = {
      id: this.currentHighScoreId++,
      initials: insertHighScore.initials,
      score: insertHighScore.score,
      createdAt: new Date(),
    };
    this.highScores.push(highScore);
    return highScore;
  }
}

export class PostgresStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getHighScores(limit: number = 10): Promise<HighScore[]> {
    if (!db) throw new Error("Database not initialized");
    const result = await db
      .select()
      .from(highScores)
      .orderBy(desc(highScores.score))
      .limit(limit);
    return result;
  }

  async createHighScore(insertHighScore: InsertHighScore): Promise<HighScore> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.insert(highScores).values(insertHighScore).returning();
    return result[0];
  }
}

// Use PostgresStorage if DATABASE_URL is set, otherwise use MemStorage for local development
export const storage: IStorage = db ? new PostgresStorage() : new MemStorage();

// Log which storage is being used
console.log(`[Storage] Using ${db ? 'PostgreSQL' : 'in-memory'} storage`);
