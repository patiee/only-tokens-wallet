import { getFromStorageAndDecrypt, isUnlocked } from "../storage";
import { write } from "../utils";
import { loadChains } from "./chains";

const dogecoin = {
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
