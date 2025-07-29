import { ethers } from "ethers";

declare global {
  interface Window {
    bip39: typeof import("bip39");
    CryptoJS: typeof import("crypto-js");
    ethereum: any;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const bip39 = window.bip39;
  const CryptoJS = window.CryptoJS;

  const createWalletBtn = document.getElementById(
    "createWallet"
  ) as HTMLButtonElement;
  const importWalletBtn = document.getElementById(
    "importWallet"
  ) as HTMLButtonElement;
  const addressSpan = document.getElementById("address") as HTMLSpanElement;

  // Check if wallet exists
  chrome.storage.local.get(["vault", "address"], (data) => {
    if (data["address"]) {
      showWallet(data["address"]);
    } else {
      const setup = document.getElementById("setup");
      if (setup) setup.style.display = "block";
    }
  });

  // Create wallet
  createWalletBtn.addEventListener("click", () => {
    const mnemonic = bip39.generateMnemonic();
    const password = prompt(
      "Enter a strong password (at least 12 characters):"
    );
    if (!password || password.length < 12) {
      alert("Password must be at least 12 characters!");
      return;
    }

    const salt = CryptoJS.lib.WordArray.random(16).toString();
    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 100000,
    }).toString();

    const vault = CryptoJS.AES.encrypt(mnemonic, key).toString();
    const address = deriveAddress(mnemonic);

    chrome.storage.local.set({ vault, salt, address }, () => {
      chrome.runtime.sendMessage({ type: "STORE_MNEMONIC", mnemonic }, () => {
        showWallet(address);
      });
    });
  });

  // Import wallet
  importWalletBtn.addEventListener("click", () => {
    const mnemonic = prompt("Enter your mnemonic phrase:");
    if (!mnemonic || !bip39.validateMnemonic(mnemonic)) {
      alert("Invalid mnemonic phrase!");
      return;
    }

    const password = prompt(
      "Enter a strong password (at least 12 characters):"
    );
    if (!password || password.length < 12) {
      alert("Password must be at least 12 characters!");
      return;
    }

    const salt = CryptoJS.lib.WordArray.random(16).toString();
    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 100000,
    }).toString();

    const vault = CryptoJS.AES.encrypt(mnemonic, key).toString();
    const address = deriveAddress(mnemonic);

    chrome.storage.local.set({ vault, salt, address }, () => {
      chrome.runtime.sendMessage({ type: "STORE_MNEMONIC", mnemonic }, () => {
        showWallet(address);
      });
    });
  });

  function showWallet(address: string) {
    addressSpan.textContent = address;
    const setup = document.getElementById("setup");
    const wallet = document.getElementById("wallet");
    if (setup) setup.style.display = "none";
    if (wallet) wallet.style.display = "block";
  }

  function deriveAddress(mnemonic: string): string {
    const wallet = ethers.Wallet.fromPhrase(mnemonic);
    return wallet.address;
  }

  const openSidePanelBtn = document.getElementById("openSidePanel");
  if (openSidePanelBtn) {
    openSidePanelBtn.addEventListener("click", async () => {
      try {
        if ("sidePanel" in chrome) {
          await chrome.sidePanel.setPanelBehavior({
            openPanelOnActionClick: false,
          });
          await chrome.sidePanel.open({
            windowId: chrome.windows.WINDOW_ID_CURRENT,
          });
          console.log("Side panel opened");
        } else {
          alert("Side panel not supported in this browser version");
        }
      } catch (error: any) {
        console.error("Error opening side panel:", error);
        alert("Failed to open side panel: " + error.message);
      }
    });
  }
});
