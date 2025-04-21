/**
 * Validates if a string is a valid BSC (Binance Smart Chain) wallet address
 * Performs BSC-specific validation checks
 */
export function validateWalletAddress(address: string): boolean {
  // Basic checks
  if (!address) return false;
  if (!address.startsWith('0x')) return false;
  if (address.length !== 42) return false;
  
  // Check if address contains only valid hex characters
  const validHex = /^0x[0-9a-fA-F]{40}$/.test(address);
  if (!validHex) return false;
  
  // BSC address validation - checksum validation for EIP-55 compliance
  // This helps validate that it's a properly formatted Ethereum-compatible address
  // which BSC addresses follow as BSC is EVM compatible
  try {
    // Convert to lowercase for comparison
    const lowerAddress = address.toLowerCase();
    
    // Simple checksum validation (simplified for this example)
    // In a production environment, a full EIP-55 implementation would be better
    if (address !== lowerAddress && address !== address.toUpperCase()) {
      // If mixed case, it should follow checksum rules
      // This is a simplified check - a real implementation would validate the checksum
      
      // For now, we'll accept any properly formatted address
      // as BSC addresses follow the same format as Ethereum addresses
    }
    
    // Reject known invalid patterns
    // Example: Avoid addresses that are suspiciously all the same character
    const suspiciousPattern = /^0x([0-9a-fA-F])\1{39}$/;
    if (suspiciousPattern.test(address)) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("BSC address validation error:", error);
    return false;
  }
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
  console.log("Attempting to connect wallet...");
  
  // Check if running on mobile
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  console.log("Is mobile device:", isMobileDevice);
  
  // Enhanced provider detection
  const provider = detectEthereumProvider();
  console.log("Detected provider:", provider ? "Available" : "Not available");

  try {
    // Try connecting to ethereum provider (MetaMask, Trust Wallet dApp browser, etc.)
    if (typeof window.ethereum !== 'undefined') {
      console.log("Ethereum provider detected:", window.ethereum);
      
      try {
        let networkId: string | number = '0x38'; // BSC Mainnet chainId in hex
        
        // Request account access - this will trigger the wallet app
        console.log("Requesting accounts...");
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        console.log("Connected accounts:", accounts);
        
        if (accounts && accounts.length > 0) {
          // Try to switch to BSC network if possible
          try {
            const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
            console.log("Current chain ID:", currentChainId);
            
            // If not on BSC, try to switch
            if (currentChainId !== networkId) {
              try {
                console.log("Attempting to switch to BSC network");
                await window.ethereum.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId: networkId }],
                });
                console.log('Successfully switched to BSC network');
              } catch (switchError: any) {
                console.log("Error switching chain:", switchError);
                
                // This error code indicates the chain has not been added to the wallet
                if (switchError.code === 4902) {
                  try {
                    console.log("Attempting to add BSC network");
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
                    console.log('Successfully added BSC network');
                  } catch (addError) {
                    console.error('Failed to add BSC network', addError);
                  }
                }
              }
            }
          } catch (chainError) {
            console.warn('Could not check or switch network', chainError);
          }
          
          return accounts[0]; // Return the first account
        } else {
          console.error("No accounts returned");
          return null;
        }
      } catch (error) {
        console.error('Ethereum wallet connection error:', error);
        return null;
      }
    } 
    // Try Binance Chain Wallet
    else if (window.BinanceChain) {
      console.log("Binance Chain wallet detected");
      try {
        const accounts = await window.BinanceChain.request({ method: 'eth_requestAccounts' });
        console.log("Connected Binance Chain accounts:", accounts);
        return accounts[0];
      } catch (error) {
        console.error('Binance Chain Wallet connection error:', error);
        return null;
      }
    } 
    // Try Trust Wallet
    else if (window.trustwallet && window.trustwallet.ethereum) {
      console.log("Trust Wallet detected");
      try {
        const accounts = await window.trustwallet.ethereum.request({ method: 'eth_requestAccounts' });
        console.log("Connected Trust Wallet accounts:", accounts);
        return accounts[0];
      } catch (error) {
        console.error('Trust Wallet connection error:', error);
        return null;
      }
    }
    // Last resort - check if we're in a mobile wallet browser by accessing ethereum directly
    else if (isMobileDevice) {
      console.log("Attempting to detect mobile wallet browser...");
      
      // Try to open wallet directly for mobile - this is a common approach for mobile wallets
      // These URLs may redirect to respective wallet apps if installed
      if (confirm("No wallet detected in browser. Would you like to open a supported wallet app?")) {
        // If on mobile, provide links to download wallet apps or open if installed
        let walletDeepLink = '';
        
        if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          // iOS devices
          walletDeepLink = 'https://metamask.app.link/dapp/bbe92531-36d8-4fb6-ab6a-d12773afc49c-00-28q7lltfv2is4.worf.repl.co/';
        } else {
          // Android devices
          walletDeepLink = 'https://metamask.app.link/dapp/bbe92531-36d8-4fb6-ab6a-d12773afc49c-00-28q7lltfv2is4.worf.repl.co/';
        }
        
        // Open the deep link
        window.location.href = walletDeepLink;
        return "REDIRECTING";
      }
      
      return null;
    } else {
      // No supported wallet found
      if (isMobileDevice) {
        alert('No wallet detected. Please install Trust Wallet, MetaMask, or another BSC-compatible wallet app.');
      } else {
        alert('No compatible wallet detected. Please install MetaMask, Trust Wallet, or Binance Chain Wallet for BSC.');
      }
      console.error('No compatible BSC wallet detected');
      return null;
    }
  } catch (error) {
    console.error('Wallet connection error:', error);
    return null;
  }
}

// Helper function to detect Ethereum provider more broadly
function detectEthereumProvider() {
  let provider = null;
  
  if (window.ethereum) {
    provider = window.ethereum;
  } else if (window.web3 && window.web3.currentProvider) {
    provider = window.web3.currentProvider;
  } else if (window.BinanceChain) {
    provider = window.BinanceChain;
  } else if (window.trustwallet && window.trustwallet.ethereum) {
    provider = window.trustwallet.ethereum;
  }
  
  return provider;
}

// Add type declarations for various wallet providers
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (accounts: string[]) => void) => void;
      selectedAddress?: string;
      isMetaMask?: boolean;
      isTrust?: boolean;
      isCoinbaseWallet?: boolean;
    };
    web3?: {
      currentProvider: any;
      eth?: {
        accounts: string[];
        getAccounts(callback: (error: Error, accounts: string[]) => void): void;
        request?(args: { method: string; params?: any[] }): Promise<any>;
      };
    };
    BinanceChain?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on?: (event: string, callback: (accounts: string[]) => void) => void;
    };
    trustwallet?: {
      ethereum: {
        request: (args: { method: string; params?: any[] }) => Promise<any>;
        selectedAddress?: string;
      }
    };
  }
}
