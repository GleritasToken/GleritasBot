/**
 * Validates if a string is a valid BEP-20 wallet address
 * This is a simple validation - in a production app, you'd want more robust checks
 */
export function validateWalletAddress(address: string): boolean {
  // Basic checks
  if (!address) return false;
  if (!address.startsWith('0x')) return false;
  if (address.length !== 42) return false;
  
  // Check if address contains only valid hex characters
  const validHex = /^0x[0-9a-fA-F]{40}$/.test(address);
  if (!validHex) return false;
  
  return true;
}

/**
 * Shortens a wallet address for display 
 * e.g. 0x1234...abcd
 */
export function shortenAddress(address: string): string {
  if (!address) return '';
  if (address.length < 10) return address;
  
  return address.substring(0, 6) + '...' + address.substring(address.length - 4);
}

/**
 * Mock function to simulate wallet connection
 * In a real app, this would use a library like ethers.js or web3.js
 */
export async function connectWallet(): Promise<string | null> {
  // Check if MetaMask or similar wallet is available
  if (typeof window.ethereum !== 'undefined') {
    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      return accounts[0]; // Return the first account
    } catch (error) {
      console.error('User denied account access');
      return null;
    }
  } else {
    throw new Error('No Ethereum wallet detected. Please install MetaMask.');
  }
}

// Add type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string }) => Promise<string[]>;
      on: (event: string, callback: (accounts: string[]) => void) => void;
    };
  }
}
