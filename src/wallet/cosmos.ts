import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { getFromStorageAndDecrypt, isUnlocked } from "../storage";
import { write } from "../utils";
import { loadChains } from "./chains";

const cosmos = {
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

if (!window.only) {
  window.only = { cosmos };
} else if (!window.only.cosmos) {
  window.only.cosmos = cosmos;
} else {
  console.warn("window.only.cosmos already exists. Overwriting is skipped.");
}
