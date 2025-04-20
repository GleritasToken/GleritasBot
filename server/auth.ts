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
}