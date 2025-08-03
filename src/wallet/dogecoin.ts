import { getFromStorageAndDecrypt, isUnlocked } from "../storage";
import { write } from "../utils";
import { loadChains } from "./chains";
import * as bip39 from "bip39";
import * as bitcoin from "bitcoinjs-lib";

// Dogecoin network configuration
const DOGECOIN = {
  messagePrefix: '\x19Dogecoin Signed Message:\n',
  bech32: 'tdoge',
  bip32: {
    public: 0x043587cf,
    private: 0x04358394
  },
  pubKeyHash: 0x71,
  scriptHash: 0xc4,
  wif: 0xf1
};

const dogecoin = {
  async enable(chainId: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
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
      resolve();
    });
  },

  async sign_sha256(message: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const unlocked = await isUnlocked();
        if (!unlocked) {
          return reject(new Error("You need to unlock wallet first"));
        }

        const mnemonic = await getFromStorageAndDecrypt("mnemonic");

        // Convert mnemonic to seed
        const seed = await bip39.mnemonicToSeed(mnemonic);

        // For now, create a deterministic signature based on the message and mnemonic
        // In a real implementation, you'd use proper BIP-44 derivation and secp256k1 signing
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256');
        hash.update(message + mnemonic);
        const sha256Signature = '0x' + hash.digest('hex');

        resolve(sha256Signature);
      } catch (err) {
        reject(new Error("Failed to sign message: " + err.message));
      }
    });
  },

  async sign_tx(inputs: any[], outputs: any[]): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const unlocked = await isUnlocked();
        if (!unlocked) {
          return reject(new Error("You need to unlock wallet first"));
        }

        const mnemonic = await getFromStorageAndDecrypt("mnemonic");

        // For now, create a deterministic transaction signature
        // In a real implementation, you'd use proper PSBT creation and signing
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256');
        hash.update(JSON.stringify(inputs) + JSON.stringify(outputs) + mnemonic);
        const txSignature = '0x' + hash.digest('hex');

        resolve(txSignature);
      } catch (err) {
        reject(new Error("Failed to sign transaction: " + err.message));
      }
    });
  },

  // Legacy method for backward compatibility
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
};

if (!window.only) {
  window.only = { dogecoin };
} else if (!window.only.dogecoin) {
  window.only.dogecoin = dogecoin;
} else {
  console.warn("window.only.dogecoin already exists. Overwriting is skipped.");
}
