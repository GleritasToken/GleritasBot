import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDeviceFingerprint(): string {
  // Create a simple fingerprint based on available browser properties
  // In a real application, you'd use a proper fingerprinting library
  const screen = window.screen;
  const nav = window.navigator;
  
  const fingerprint = [
    nav.userAgent,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    nav.language || nav.userLanguage,
    nav.hardwareConcurrency,
    !!nav.cookieEnabled
  ].join('###');
  
  return fingerprint;
}

export async function getClientIP(): Promise<string> {
  try {
    // Use a public API to get client IP
    // In a real application, this would be done server-side
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Failed to get IP:', error);
    return '';
  }
}

export function generateRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}
