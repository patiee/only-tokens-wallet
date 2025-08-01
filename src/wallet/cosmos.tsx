// Content script that injects the cosmos interface into the main world
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { getFromStorageAndDecrypt, isUnlocked } from "../storage";
import { write } from "../utils";
import { loadChains } from "./chains";

// Create the cosmos interface
const cosmosInterface = {
  async enable(chainId: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const chains = await loadChains();
      if (!chains[chainId]) {
        return reject(new Error("Unsupported chain"));
      }

      const unlocked = await isUnlocked();
      if (unlocked) {
        write(`Connected to ${chainId}`);
      } else {
        return reject(new Error("You need to unlock wallet first"));
      }
      resolve();
    });
  },

  async getOfflineSigner(chainId: string): Promise<DirectSecp256k1HdWallet> {
    return new Promise(async (resolve, reject) => {
      try {
        const chains = await loadChains();
        const cnf = chains[chainId];
        if (!cnf) {
          return reject(new Error("Unsupported chain"));
        }
        const mnemonic = await getFromStorageAndDecrypt("mnemonic");
        const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
          prefix: cnf.prefix,
        });
        resolve(wallet);
      } catch (err) {
        reject(new Error("Failed to create signer: " + err.message));
      }
    });
  },
};

// Inject the interface into the main world
const script = document.createElement('script');
script.src = chrome.runtime.getURL('js/cosmos-inject.js');

// Inject the script into the main world
(document.head || document.documentElement).appendChild(script);

// Store wallet instances for each chain
const walletInstances = new Map();

// Listen for messages from the main world
window.addEventListener('message', async (event) => {
  if (event.source !== window) return;

  if (event.data.type === 'ONLY_COSMOS_ENABLE') {
    try {
      await cosmosInterface.enable(event.data.chainId);
      window.postMessage({
        type: 'ONLY_COSMOS_ENABLE_RESPONSE',
        chainId: event.data.chainId,
        success: true
      }, '*');
    } catch (error) {
      window.postMessage({
        type: 'ONLY_COSMOS_ENABLE_RESPONSE',
        chainId: event.data.chainId,
        error: error.message
      }, '*');
    }
  }

  if (event.data.type === 'ONLY_COSMOS_GET_OFFLINE_SIGNER') {
    try {
      const wallet = await cosmosInterface.getOfflineSigner(event.data.chainId);
      walletInstances.set(event.data.chainId, wallet);

      window.postMessage({
        type: 'ONLY_COSMOS_GET_OFFLINE_SIGNER_RESPONSE',
        chainId: event.data.chainId,
        success: true
      }, '*');
    } catch (error) {
      window.postMessage({
        type: 'ONLY_COSMOS_GET_OFFLINE_SIGNER_RESPONSE',
        chainId: event.data.chainId,
        error: error.message
      }, '*');
    }
  }

  if (event.data.type === 'ONLY_COSMOS_GET_ACCOUNTS') {
    try {
      const wallet = walletInstances.get(event.data.chainId);
      if (!wallet) {
        throw new Error('Wallet not initialized for this chain');
      }
      const accounts = await wallet.getAccounts();

      window.postMessage({
        type: 'ONLY_COSMOS_GET_ACCOUNTS_RESPONSE',
        chainId: event.data.chainId,
        accounts: accounts
      }, '*');
    } catch (error) {
      window.postMessage({
        type: 'ONLY_COSMOS_GET_ACCOUNTS_RESPONSE',
        chainId: event.data.chainId,
        error: error.message
      }, '*');
    }
  }

  if (event.data.type === 'ONLY_COSMOS_SIGN_DIRECT') {
    try {
      const wallet = walletInstances.get(event.data.chainId);
      if (!wallet) {
        throw new Error('Wallet not initialized for this chain');
      }
      const result = await wallet.signDirect(event.data.signerAddress, event.data.signDoc);

      window.postMessage({
        type: 'ONLY_COSMOS_SIGN_DIRECT_RESPONSE',
        chainId: event.data.chainId,
        result: result
      }, '*');
    } catch (error) {
      window.postMessage({
        type: 'ONLY_COSMOS_SIGN_DIRECT_RESPONSE',
        chainId: event.data.chainId,
        error: error.message
      }, '*');
    }
  }

  if (event.data.type === 'ONLY_COSMOS_SIGN_AMINO') {
    try {
      const wallet = walletInstances.get(event.data.chainId);
      if (!wallet) {
        throw new Error('Wallet not initialized for this chain');
      }
      const result = await wallet.signAmino(event.data.signerAddress, event.data.signDoc);

      window.postMessage({
        type: 'ONLY_COSMOS_SIGN_AMINO_RESPONSE',
        chainId: event.data.chainId,
        result: result
      }, '*');
    } catch (error) {
      window.postMessage({
        type: 'ONLY_COSMOS_SIGN_AMINO_RESPONSE',
        chainId: event.data.chainId,
        error: error.message
      }, '*');
    }
  }
});

// Listen for chrome runtime messages
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  console.log("sender", sender, "msg", msg);
  sendResponse("hello");
});
