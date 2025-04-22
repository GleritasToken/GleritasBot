import { Express, Request } from "express";
import session from "express-session";
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
  // Configure session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "GLRS-airdrop-token-secret", // Better to use env variable
      resave: true, // Changed to true to ensure session is saved on every request
      saveUninitialized: true, // Changed to true to save uninitialized sessions
      store: storage.sessionStore,
      proxy: true, // Add trust proxy
      cookie: {
        secure: false, // Not forcing secure to allow testing in all environments
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days for longer sessions
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
      
      // Store user ID in session and save session immediately
      req.session.userId = user.id;
      
      // Explicitly save the session
      req.session.save((err) => {
        if (err) {
          console.error("Error saving session:", err);
          return res.status(500).json({ message: "Login successful but session saving failed. Please try again." });
        }
        
        res.json({
          message: "Login successful",
          user: {
            id: user.id,
            username: user.username,
            referralCode: user.referralCode,
            totalPoints: user.totalPoints // Updated to totalPoints
          }
        });
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