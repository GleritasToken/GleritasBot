import { WebApp } from 'telegram-web-app';

// Function to check if the page is running inside a Telegram WebApp
export function isTelegramWebApp(): boolean {
  return typeof window !== 'undefined' && window.Telegram?.WebApp !== undefined;
}

// Get the Telegram WebApp instance if available
export function getTelegramWebApp(): WebApp | null {
  if (isTelegramWebApp() && window.Telegram) {
    return window.Telegram.WebApp;
  }
  return null;
}

// Get initialization data from Telegram if running as a WebApp
export function getTelegramInitData(): string | null {
  const webApp = getTelegramWebApp();
  return webApp ? webApp.initData : null;
}

// Function to validate the user from Telegram data
export async function validateTelegramUser() {
  try {
    const initData = getTelegramInitData();
    
    if (!initData) {
      console.error('No Telegram init data available');
      return null;
    }
    
    const response = await fetch('/api/telegram/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ initData }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      return data.user;
    }
    
    return null;
  } catch (error) {
    console.error('Error validating Telegram user:', error);
    return null;
  }
}

// Function to close the Telegram web app
export function closeTelegramWebApp(): void {
  const webApp = getTelegramWebApp();
  if (webApp) {
    webApp.close();
  }
}

// Function to expand the Telegram web app to full screen
export function expandTelegramWebApp(): void {
  const webApp = getTelegramWebApp();
  if (webApp) {
    webApp.expand();
  }
}

// Function to let the Telegram web app know the page has loaded
export function telegramWebAppReady(): void {
  const webApp = getTelegramWebApp();
  if (webApp) {
    webApp.ready();
  }
}

// Function to handle back button functionality
export function enableTelegramBackButton(callback: () => void): void {
  const webApp = getTelegramWebApp();
  if (webApp) {
    webApp.BackButton.show();
    webApp.BackButton.onClick(callback);
  }
}

// Function to disable the back button
export function disableTelegramBackButton(): void {
  const webApp = getTelegramWebApp();
  if (webApp) {
    webApp.BackButton.hide();
    webApp.BackButton.offClick();
  }
}

// Extend the Window interface to include Telegram object
declare global {
  interface Window {
    Telegram?: {
      WebApp: WebApp;
    };
  }
}