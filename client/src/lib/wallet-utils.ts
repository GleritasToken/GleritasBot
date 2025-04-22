/**
 * GLRS Token Contract Address on BSC
 * https://bscscan.com/address/0x7c427B65ebA206026A055B04c6086AC9af40B1B4
 */
export const GLRS_CONTRACT_ADDRESS = '0x7c427B65ebA206026A055B04c6086AC9af40B1B4';

/**
 * GLRS Fees Address (where to send BNB fees)
 */
export const FEES_RECIPIENT_ADDRESS = '0x7c427B65ebA206026A055B04c6086AC9af40B1B4';

/**
 * Fee amounts in BNB (approximately $3 in BNB)
 */
export const FEE_AMOUNT_BNB = 0.01; // This should be adjusted based on current BNB price

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

// Alias for validateWalletAddress for compatibility with EnhancedWalletConnect component
export const isValidAddress = validateWalletAddress;

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
 * Connect to BSC wallet and ensure compatibility with crypto apps
 * Supports MetaMask and Trust Wallet
 */
export async function connectWallet(walletType?: string): Promise<string | null> {
  console.log("Attempting to connect wallet...", walletType ? `Type: ${walletType}` : "Auto-detect");
  
  // Check if running on mobile
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  console.log("Is mobile device:", isMobileDevice);
  
  // BSC Network ID
  const bscNetworkId = '0x38'; // BSC Mainnet chainId in hex

  // If specific wallet type is provided
  if (walletType) {
    switch (walletType) {
      case 'metamask':
        console.log("Attempting to connect to MetaMask...");
        if (window.ethereum?.isMetaMask) {
          try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            console.log("Connected MetaMask accounts:", accounts);
            if (accounts && accounts.length > 0) {
              return accounts[0];
            }
          } catch (error) {
            console.error('MetaMask connection error:', error);
          }
        } else if (isMobileDevice) {
          // Enhanced MetaMask mobile connection with multiple fallbacks
          console.log("Opening MetaMask for mobile with enhanced deep links...");
          
          // Extract host without protocol
          const hostWithPath = window.location.host.replace('https://', '') + window.location.pathname;
          
          // Add a parameter to help identify when returning from wallet
          const returnUrl = window.location.href.includes('?') 
            ? `${window.location.href}&wallet_return=true` 
            : `${window.location.href}?wallet_return=true`;
          
          // Create event listener for when app returns to browser
          const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
              console.log("App returned to browser, checking MetaMask connection");
              document.removeEventListener('visibilitychange', handleVisibilityChange);
              
              // Set timeout to allow wallet to reconnect
              setTimeout(async () => {
                try {
                  // Try to get wallet after return
                  const provider = detectEthereumProvider();
                  if (provider && (provider as any).selectedAddress) {
                    console.log("Wallet connected after return:", (provider as any).selectedAddress);
                    
                    // Dispatch a custom event to notify about the connection
                    const walletEvent = new CustomEvent('walletConnected', {
                      detail: { address: (provider as any).selectedAddress }
                    });
                    window.dispatchEvent(walletEvent);
                  }
                } catch (e) {
                  console.error("Error checking wallet after return:", e);
                }
              }, 1000);
            }
          };
          
          // Listen for app return
          document.addEventListener('visibilitychange', handleVisibilityChange);
          
          // Method 1: Standard MetaMask deep link 
          const metaMaskDeepLink = `https://metamask.app.link/dapp/${hostWithPath}`;
          
          // Method 2: Alternative format using ethereum protocol
          const metaMaskAltLink = `ethereum://https://${hostWithPath}`;
          
          // Method 3: Direct metamask:// protocol (works on some devices)
          const metaMaskDirectLink = `metamask://dapp/${hostWithPath}`;
          
          // Try standard link first
          console.log("Opening primary MetaMask deep link:", metaMaskDeepLink);
          window.location.href = metaMaskDeepLink;
          
          // Set fallbacks with timeouts
          setTimeout(() => {
            console.log("First deep link may have failed, trying alternative format");
            window.location.href = metaMaskAltLink;
            
            // Final fallback
            setTimeout(() => {
              console.log("Trying direct protocol as last resort");
              window.location.href = metaMaskDirectLink;
            }, 1000);
          }, 1500);
          
          return null;
        }
        break;
      
      case 'trustwallet':
        console.log("Attempting to connect to Trust Wallet...");
        const trustProvider = window.trustwallet?.ethereum || (window.ethereum?.isTrust ? window.ethereum : null);
        if (trustProvider) {
          try {
            const accounts = await trustProvider.request({ method: 'eth_requestAccounts' });
            console.log("Connected Trust Wallet accounts:", accounts);
            if (accounts && accounts.length > 0) {
              return accounts[0];
            }
          } catch (error) {
            console.error('Trust Wallet connection error:', error);
          }
        } else if (isMobileDevice) {
          // Enhanced Trust Wallet mobile connection with multiple fallbacks
          console.log("Opening Trust Wallet for mobile with enhanced deep links...");
          
          // Add a parameter to help identify when returning from wallet
          const returnUrl = window.location.href.includes('?') 
            ? `${window.location.href}&wallet_return=true` 
            : `${window.location.href}?wallet_return=true`;
          
          // Create event listener for when app returns to browser
          const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
              console.log("App returned to browser, checking wallet connection");
              document.removeEventListener('visibilitychange', handleVisibilityChange);
              
              // Set timeout to allow wallet to reconnect
              setTimeout(async () => {
                try {
                  // Try to get wallet after return
                  const provider = detectEthereumProvider();
                  if (provider && (provider as any).selectedAddress) {
                    console.log("Wallet connected after return:", (provider as any).selectedAddress);
                    // We can't directly update the state here since we've already returned null
                    // This is part of the workaround for the Trust Wallet connectivity
                    // The calling component should handle this case with polling or visibility change events
                    
                    // Dispatch a custom event to notify about the connection
                    const walletEvent = new CustomEvent('walletConnected', {
                      detail: { address: (provider as any).selectedAddress }
                    });
                    window.dispatchEvent(walletEvent);
                  }
                } catch (e) {
                  console.error("Error checking wallet after return:", e);
                }
              }, 1000);
            }
          };
          
          // Listen for app return
          document.addEventListener('visibilitychange', handleVisibilityChange);
          
          // Method 1: Direct Trust Wallet URL scheme
          const trustWalletDeepLink = `trust://open_url?url=${encodeURIComponent(returnUrl)}`;
          
          // Method 2: Fallback Universal Link format
          const trustUniversalLink = `https://link.trustwallet.com/open_url?url=${encodeURIComponent(returnUrl)}`;
          
          // Method 3: WalletConnect style link (alternate format)
          const wcDeepLink = `trust://wc?uri=${encodeURIComponent(returnUrl)}`;
          
          // Try direct scheme with timeout fallbacks
          console.log("Attempting Trust Wallet deep link: ", trustWalletDeepLink);
          window.location.href = trustWalletDeepLink;
          
          // Set fallbacks with timeouts
          setTimeout(() => {
            console.log("First deep link may have failed, trying universal link");
            window.location.href = trustUniversalLink;
            
            // Final fallback
            setTimeout(() => {
              console.log("Trying wallet connect style deep link as last resort");
              window.location.href = wcDeepLink;
            }, 1000);
          }, 1500);
          
          return null;
        }
        break;
      
      default:
        console.log("Unknown wallet type:", walletType);
        break;
    }
  }
  
  // If we didn't return yet (either no wallet type specified or connection failed)
  // Use the auto-detect approach
  
  // Enhanced provider detection
  const provider = detectEthereumProvider();
  console.log("Detected provider:", provider ? "Available" : "Not available");

  try {
    // Try connecting to ethereum provider (MetaMask, Trust Wallet dApp browser, etc.)
    if (typeof window.ethereum !== 'undefined') {
      console.log("Ethereum provider detected:", window.ethereum);
      
      try {
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
            if (currentChainId !== bscNetworkId) {
              try {
                console.log("Attempting to switch to BSC network");
                await window.ethereum.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId: bscNetworkId }],
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
                          chainId: bscNetworkId,
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
    // Removed Binance Chain Wallet code as per requirements
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
      const hostUrl = window.location.host;
      const currentUrl = window.location.href;
      
      // If on mobile, provide links to download wallet apps or open if installed
      let walletDeepLink = `https://metamask.app.link/dapp/${hostUrl}`;
      
      console.log("Opening wallet deep link:", walletDeepLink);
      window.open(walletDeepLink, '_blank');
      return null;
    } else {
      // No supported wallet found
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
