import { WebApp } from 'telegram-web-app';

// Function to check if the page is running inside a Telegram WebApp
export function isTelegramWebApp(): boolean {
  const isTelegram = typeof window !== 'undefined' && window.Telegram?.WebApp !== undefined;
  console.log('isTelegramWebApp check:', isTelegram, 'window.Telegram exists:', typeof window !== 'undefined' && window.Telegram !== undefined);
  
  // Debug what's available in window
  if (typeof window !== 'undefined') {
    console.log('Available global objects:', Object.keys(window).filter(key => key.startsWith('Tele')));
  }
  
  return isTelegram;
}

// Get the Telegram WebApp instance if available
export function getTelegramWebApp(): WebApp | null {
  if (isTelegramWebApp() && window.Telegram) {
    console.log('Successfully retrieved Telegram WebApp instance');
    return window.Telegram.WebApp;
  }
  console.log('Failed to get Telegram WebApp instance');
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
    console.log('validateTelegramUser called');
    const initData = getTelegramInitData();
    
    if (!initData) {
      console.error('No Telegram init data available');
      
      // For testing: If there's a mock parameter, create a test user
      if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('telegram_mock') === 'true') {
        console.log('Creating mock Telegram user for testing');
        return {
          id: 1,
          username: 'mock_telegram_user',
          telegramId: 12345,
          walletAddress: null,
          referralCode: 'MOCK123',
          totalTokens: 0,
          referralTokens: 0,
          referralCount: 0
        };
      }
      
      return null;
    }
    
    console.log('Sending init data to server for validation:', initData.substring(0, 50) + '...');
    
    try {
      const response = await fetch('/api/telegram/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initData }),
      });
      
      console.log('Server response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Server validation response:', data.success ? 'Success' : 'Failed');
      
      if (data.success) {
        console.log('User data received from server:', data.user.username);
        return data.user;
      } else {
        console.error('Validation failed:', data.message);
        return null;
      }
    } catch (fetchError) {
      console.error('Network error during validation:', fetchError);
      throw fetchError;
    }
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