import { Express, Request } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { storage } from "./storage";
import { User } from "@shared/schema";

// Add User type to Express Request
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
  
  namespace NodeJS {
    interface ProcessEnv {
      SESSION_SECRET?: string;
    }
  }
}

// Add userId to session
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  
  // Configure session middleware
  app.use(
    session({
      secret: "GLRS-airdrop-token-secret", // In a real app, use env variable
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      }),
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
      }
    })
  );
  
  // Add login endpoint
  app.post("/api/login", async (req: Request, res) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Store user ID in session
      req.session.userId = user.id;
      
      return res.json({
        message: "Login successful",
        user: {
          id: user.id,
          username: user.username,
          referralCode: user.referralCode,
          totalTokens: user.totalTokens
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Login failed" });
    }
  });
  
  // Add logout endpoint
  app.post("/api/logout", (req: Request, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      
      res.clearCookie("connect.sid");
      return res.json({ message: "Logged out successfully" });
    });
  });
}