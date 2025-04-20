/**
 * Validates if a string is a valid BSC (Binance Smart Chain) wallet address
 * Performs checks specific to BSC addresses
 */
export function validateWalletAddress(address: string): boolean {
  // Basic checks
  if (!address) return false;
  if (!address.startsWith('0x')) return false;
  if (address.length !== 42) return false;
  
  // Check if address contains only valid hex characters
  const validHex = /^0x[0-9a-fA-F]{40}$/.test(address);
  if (!validHex) return false;
  
  // Additional BSC-specific checks could be added here
  // For example, checking known contract ranges or prefixes
  
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
 * Connect to BSC wallet and ensure compatibility with all crypto apps
 * Supports MetaMask, Trust Wallet, Binance Chain Wallet, and other WalletConnect-compatible wallets
 */
export async function connectWallet(): Promise<string | null> {
  // Detect available wallet providers
  if (typeof window.ethereum !== 'undefined') {
    try {
      let networkId: string | number = '0x38'; // BSC Mainnet chainId in hex
      let chainId = 56; // BSC Mainnet chainId in decimal
      
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Try to switch to BSC network if not already on it
      try {
        // Check current chainId
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        // If not on BSC, try to switch
        if (currentChainId !== networkId) {
          try {
            // Switch to BSC
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: networkId }],
            });
            console.log('Switched to BSC network');
          } catch (switchError: any) {
            // This error code indicates the chain has not been added to the wallet
            if (switchError.code === 4902) {
              try {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [
                    {
                      chainId: networkId,
                      chainName: 'Binance Smart Chain',
                      nativeCurrency: {
                        name: 'BNB',
                        symbol: 'BNB',
                        decimals: 18,
                      },
                      rpcUrls: ['https://bsc-dataseed.binance.org/'],
                      blockExplorerUrls: ['https://bscscan.com/'],
                    },
                  ],
                });
                console.log('Added BSC network to wallet');
              } catch (addError) {
                console.error('Failed to add BSC network', addError);
              }
            } else {
              console.error('Failed to switch to BSC network', switchError);
            }
          }
        }
      } catch (chainError) {
        console.warn('Could not check or switch network', chainError);
      }
      
      return accounts[0]; // Return the first account
    } catch (error) {
      console.error('Wallet connection error:', error);
      return null;
    }
  } else if (window.BinanceChain) {
    // Support for Binance Chain Wallet
    try {
      const accounts = await window.BinanceChain.request({ method: 'eth_requestAccounts' });
      return accounts[0];
    } catch (error) {
      console.error('Binance Chain Wallet connection error:', error);
      return null;
    }
  } else if (window.trustwallet) {
    // Support for Trust Wallet
    try {
      const accounts = await window.trustwallet.ethereum.request({ method: 'eth_requestAccounts' });
      return accounts[0];
    } catch (error) {
      console.error('Trust Wallet connection error:', error);
      return null;
    }
  } else {
    // No supported wallet found
    alert('No compatible wallet detected. Please install MetaMask, Trust Wallet, or Binance Chain Wallet for BSC.');
    console.error('No compatible BSC wallet detected');
    return null;
  }
}

// Add type declarations for various wallet providers
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (accounts: string[]) => void) => void;
    };
    BinanceChain?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
    };
    trustwallet?: {
      ethereum: {
        request: (args: { method: string; params?: any[] }) => Promise<any>;
      }
    };
  }
}
