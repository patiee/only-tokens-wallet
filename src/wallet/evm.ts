import { getFromStorageAndDecrypt, isUnlocked } from "../storage";
import { write } from "../utils";
import { loadChains } from "./chains";
import { ethers } from "ethers";

// EVM interface that mimics MetaMask's window.ethereum
const evmInterface = {
  async enable(chainId: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const chains = await loadChains();
        if (!chains[chainId]) {
          return reject(new Error("Unsupported chain"));
        }

        const unlocked = await isUnlocked();
        if (!unlocked) {
          return reject(new Error("You need to unlock wallet first"));
        }

        // Save active chain to chrome session
        await chrome.storage.session.set({ activeChainId: chainId });
        write(`Connected to ${chainId}`);

        // Update ethereum properties
        await ethereum.updateProperties();

        resolve();
      } catch (err) {
        reject(new Error("Failed to enable chain: " + err.message));
      }
    });
  },

  async sign(chainId: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const chains = await loadChains();
        const cnf = chains[chainId];
        if (!cnf) {
          return reject(new Error("Unsupported chain"));
        }
        const mnemonic = await getFromStorageAndDecrypt("mnemonic");
        resolve(mnemonic);
      } catch (err) {
        reject(new Error("Failed to create signer: " + err.message));
      }
    });
  },

  async getAccounts(): Promise<Array<{ address: string; pubkey: string }>> {
    return new Promise(async (resolve, reject) => {
      try {
        const unlocked = await isUnlocked();
        if (!unlocked) {
          return reject(new Error("You need to unlock wallet first"));
        }

        const mnemonic = await getFromStorageAndDecrypt("mnemonic");

        // Create wallet from mnemonic
        const wallet = ethers.Wallet.fromMnemonic(mnemonic);

        // Return account info
        const accounts = [{
          address: wallet.address,
          pubkey: wallet.publicKey,
        }];

        resolve(accounts);
      } catch (err) {
        reject(new Error("Failed to get accounts: " + err.message));
      }
    });
  },

  async signTransaction(transaction: any): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const unlocked = await isUnlocked();
        if (!unlocked) {
          return reject(new Error("You need to unlock wallet first"));
        }

        const mnemonic = await getFromStorageAndDecrypt("mnemonic");

        // Get active chain from session
        const sessionData = await chrome.storage.session.get(['activeChainId']);
        const activeChainId = sessionData['activeChainId'];

        if (!activeChainId) {
          return reject(new Error("No active chain. Please enable a chain first."));
        }

        // Load chains to get RPC URL
        const chains = await loadChains();
        const chainConfig = chains[activeChainId];

        if (!chainConfig || !chainConfig.rpc) {
          return reject(new Error("No RPC URL found for active chain"));
        }

        // Create wallet from mnemonic
        const wallet = ethers.Wallet.fromMnemonic(mnemonic);

        // Connect to Ethereum provider
        const provider = new ethers.providers.JsonRpcProvider(chainConfig.rpc);
        const connectedWallet = wallet.connect(provider);

        // Get current gas price and nonce
        const gasPrice = await provider.getGasPrice();
        const nonce = await provider.getTransactionCount(wallet.address, "latest");
        const network = await provider.getNetwork();

        // Construct transaction
        const tx = {
          to: transaction.to,
          value: transaction.value || ethers.utils.parseEther("0"),
          gasLimit: transaction.gasLimit || "21000",
          gasPrice: transaction.gasPrice || gasPrice,
          nonce: transaction.nonce || nonce,
          chainId: network.chainId
        };

        // Sign the transaction
        const signedTx = await wallet.signTransaction(tx);
        resolve(signedTx);
      } catch (err) {
        reject(new Error("Failed to sign transaction: " + err.message));
      }
    });
  },

  async signMessage(message: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const unlocked = await isUnlocked();
        if (!unlocked) {
          return reject(new Error("You need to unlock wallet first"));
        }

        const mnemonic = await getFromStorageAndDecrypt("mnemonic");

        // Create wallet from mnemonic
        const wallet = ethers.Wallet.fromMnemonic(mnemonic);

        // Sign the message
        const signature = await wallet.signMessage(message);
        resolve(signature);
      } catch (err) {
        reject(new Error("Failed to sign message: " + err.message));
      }
    });
  }
};

// Create the MetaMask-like interface
const ethereum: any = {
  // Request method that mimics MetaMask's request
  async request(request: { method: string; params?: any[] }): Promise<any> {
    switch (request.method) {
      case 'eth_requestAccounts':
      case 'eth_accounts':
        const accounts = await evmInterface.getAccounts();
        return accounts.map(acc => acc.address);

      case 'eth_chainId':
        // Get active chain from session
        const sessionData = await chrome.storage.session.get(['activeChainId']);
        const activeChainId = sessionData['activeChainId'];

        if (!activeChainId) {
          throw new Error("No active chain. Please enable a chain first.");
        }

        // Convert chainId to hex format
        const chainIdHex = '0x' + parseInt(activeChainId).toString(16);
        return chainIdHex;

      case 'eth_getBalance':
        try {
          // Get active chain from session
          const balanceSessionData = await chrome.storage.session.get(['activeChainId']);
          const balanceActiveChainId = balanceSessionData['activeChainId'];

          if (!balanceActiveChainId) {
            throw new Error("No active chain. Please enable a chain first.");
          }

          // Load chains to get RPC URL
          const balanceChains = await loadChains();
          const balanceChainConfig = balanceChains[balanceActiveChainId];

          if (!balanceChainConfig || !balanceChainConfig.rpc) {
            throw new Error("No RPC URL found for active chain");
          }

          // Get account 0
          const balanceAccounts = await evmInterface.getAccounts();
          const accountAddress = balanceAccounts[0].address;

          // Create provider and get balance
          const balanceProvider = new ethers.providers.JsonRpcProvider(balanceChainConfig.rpc);
          const balance = await balanceProvider.getBalance(accountAddress);

          // Return balance in hex format
          return '0x' + balance.toHexString().substring(2);
        } catch (error) {
          throw new Error(`Failed to get balance: ${error.message}`);
        }

      case 'eth_sendTransaction':
        try {
          if (!request.params || request.params.length < 1) {
            throw new Error('eth_sendTransaction requires transaction object');
          }

          const transaction = request.params[0];

          // Get active chain from session
          const txSessionData = await chrome.storage.session.get(['activeChainId']);
          const txActiveChainId = txSessionData['activeChainId'];

          if (!txActiveChainId) {
            throw new Error("No active chain. Please enable a chain first.");
          }

          // Load chains to get RPC URL
          const txChains = await loadChains();
          const txChainConfig = txChains[txActiveChainId];

          if (!txChainConfig || !txChainConfig.rpc) {
            throw new Error("No RPC URL found for active chain");
          }

          // Get account 0 for signing
          const txAccounts = await evmInterface.getAccounts();
          const txAccountAddress = txAccounts[0].address;

          // Create wallet and provider
          const mnemonic = await getFromStorageAndDecrypt("mnemonic");
          const wallet = ethers.Wallet.fromMnemonic(mnemonic);
          const provider = new ethers.providers.JsonRpcProvider(txChainConfig.rpc);
          const connectedWallet = wallet.connect(provider);

          // Get current gas price and nonce
          const gasPrice = await provider.getGasPrice();
          const nonce = await provider.getTransactionCount(txAccountAddress, "latest");
          const network = await provider.getNetwork();

          // Construct transaction
          const tx = {
            to: transaction.to,
            value: transaction.value || ethers.utils.parseEther("0"),
            gasLimit: transaction.gasLimit || "21000",
            gasPrice: transaction.gasPrice || gasPrice,
            nonce: transaction.nonce || nonce,
            chainId: network.chainId
          };

          // Sign and send the transaction
          const signedTx = await wallet.signTransaction(tx);
          const txResponse = await provider.sendTransaction(signedTx);

          // Return transaction hash
          return txResponse.hash;
        } catch (error) {
          throw new Error(`Failed to send transaction: ${error.message}`);
        }

      case 'personal_sign':
        if (!request.params || request.params.length < 2) {
          throw new Error('personal_sign requires message and address parameters');
        }
        try {
          const message = request.params[0];
          const address = request.params[1];

          // Get account 0 for signing
          const accounts = await evmInterface.getAccounts();
          const accountAddress = accounts[0].address;

          // Verify the address matches account 0
          if (address.toLowerCase() !== accountAddress.toLowerCase()) {
            throw new Error('Address does not match the active account');
          }

          // Create wallet and sign message
          const mnemonic = await getFromStorageAndDecrypt("mnemonic");
          const wallet = ethers.Wallet.fromMnemonic(mnemonic);
          const signature = await wallet.signMessage(message);

          return signature;
        } catch (error) {
          throw new Error(`Failed to sign message: ${error.message}`);
        }

      case 'eth_sign':
        if (!request.params || request.params.length < 2) {
          throw new Error('eth_sign requires message and address parameters');
        }
        try {
          const message = request.params[0];
          const address = request.params[1];

          // Get account 0 for signing
          const accounts = await evmInterface.getAccounts();
          const accountAddress = accounts[0].address;

          // Verify the address matches account 0
          if (address.toLowerCase() !== accountAddress.toLowerCase()) {
            throw new Error('Address does not match the active account');
          }

          // Create wallet and sign message
          const mnemonic = await getFromStorageAndDecrypt("mnemonic");
          const wallet = ethers.Wallet.fromMnemonic(mnemonic);

          // For eth_sign: hash the message first, then sign the hash
          const messageHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(message));
          const ethSignSignature = await wallet.signMessage(ethers.utils.arrayify(messageHash));

          return ethSignSignature;
        } catch (error) {
          throw new Error(`Failed to sign message: ${error.message}`);
        }

      default:
        throw new Error(`Method ${request.method} not supported`);
    }
  },

  // Event listeners for MetaMask compatibility
  on(eventName: string, listener: Function) {
    // Store event listeners for future use
    if (!this._listeners) this._listeners = {};
    if (!this._listeners[eventName]) this._listeners[eventName] = [];
    this._listeners[eventName].push(listener);
  },

  removeListener(eventName: string, listener: Function) {
    if (this._listeners && this._listeners[eventName]) {
      const index = this._listeners[eventName].indexOf(listener);
      if (index > -1) {
        this._listeners[eventName].splice(index, 1);
      }
    }
  },

  // Properties that ethers.js expects - these will be updated dynamically
  isMetaMask: true,
  isOnlyTokens: true,
  selectedAddress: null,
  networkVersion: '1',
  chainId: '0x1',

  // Method to get the current account
  async getSelectedAddress(): Promise<string | null> {
    try {
      const accounts = await this.request({ method: 'eth_accounts' });
      return accounts[0] || null;
    } catch {
      return null;
    }
  },

  // Method to update properties based on active chain
  async updateProperties() {
    try {
      // Get active chain from session
      const sessionData = await chrome.storage.session.get(['activeChainId']);
      const activeChainId = sessionData['activeChainId'];

      if (activeChainId) {
        // Update chainId
        this.chainId = '0x' + parseInt(activeChainId).toString(16);

        // Update networkVersion (decimal chain ID)
        this.networkVersion = activeChainId;

        // Update selectedAddress
        const accounts = await this.request({ method: 'eth_accounts' });
        this.selectedAddress = accounts[0] || null;
      }
    } catch (error) {
      console.error('Failed to update ethereum properties:', error);
    }
  }
};

// Inject the interface into the main world
const script = document.createElement('script');
script.src = chrome.runtime.getURL('js/evm-inject.js');

// Inject the script into the main world
(document.head || document.documentElement).appendChild(script);

// Store wallet instances for each chain
const walletInstances = new Map();

// Listen for messages from the main world
window.addEventListener('message', async (event) => {
  if (event.source !== window) return;

  if (event.data.type === 'ONLY_EVM_REQUEST') {
    try {
      const result = await ethereum.request(event.data.request);
      window.postMessage({
        type: 'ONLY_EVM_REQUEST_RESPONSE',
        id: event.data.id,
        result: result
      }, '*');
    } catch (error) {
      window.postMessage({
        type: 'ONLY_EVM_REQUEST_RESPONSE',
        id: event.data.id,
        error: error.message
      }, '*');
    }
  }

  if (event.data.type === 'ONLY_EVM_GET_SELECTED_ADDRESS') {
    try {
      const address = await ethereum.getSelectedAddress();
      window.postMessage({
        type: 'ONLY_EVM_GET_SELECTED_ADDRESS_RESPONSE',
        address: address
      }, '*');
    } catch (error) {
      window.postMessage({
        type: 'ONLY_EVM_GET_SELECTED_ADDRESS_RESPONSE',
        error: error.message
      }, '*');
    }
  }
});

// Legacy interface for backward compatibility
if (!window.only) {
  window.only = { evm: evmInterface };
} else if (!window.only.evm) {
  window.only.evm = evmInterface;
} else {
  console.warn("window.only.evm already exists. Overwriting is skipped.");
}
