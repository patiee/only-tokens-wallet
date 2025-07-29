import CryptoJS from "crypto-js";
import { ethers } from "ethers";
import { sendEthTx } from "../ethereum/ethereum";

let inMemoryMnemonic: string | null = null;

// Chrome extension installed
chrome.runtime.onInstalled.addListener(() => {
  console.log("Only Tokens Wallet Installed");

  // Enable side panel on all open tabs
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.id !== undefined) {
        chrome.sidePanel
          .setOptions({
            tabId: tab.id,
            path: "src/sidepanel.html",
            enabled: true,
          })
          .catch(console.error);
      }
    });
  });
});

// Handle Chrome action (e.g., extension icon click)
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  await chrome.sidePanel.setOptions({
    tabId: tab.id,
    path: "src/sidepanel.html",
    enabled: true,
  });
  await chrome.sidePanel.open({ tabId: tab.id });
});

// Handle messages from other parts of the extension
chrome.runtime.onMessage.addListener(
  async (
    request: { type: string; mnemonic?: string; password?: string },
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<boolean | void> => {
    console.log("sender", sender);
    switch (request.type) {
      case "STORE_MNEMONIC":
        if (request.mnemonic) {
          inMemoryMnemonic = request.mnemonic;
          setTimeout(() => (inMemoryMnemonic = null), 5 * 60 * 1000); // Clear after 5 minutes
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: "Mnemonic missing" });
        }
        break;

      case "DECRYPT_VAULT":
        chrome.storage.local.get(["vault", "salt"], (data) => {
          try {
            const key = CryptoJS.PBKDF2(request.password!, data["salt"], {
              keySize: 256 / 32,
              iterations: 100000,
            }).toString();

            const decrypted = CryptoJS.AES.decrypt(data["vault"], key);
            const mnemonic = decrypted.toString(CryptoJS.enc.Utf8);

            if (!mnemonic) {
              sendResponse({ error: "Invalid password" });
            } else {
              inMemoryMnemonic = mnemonic;
              sendResponse({ mnemonic });
            }
          } catch (e) {
            sendResponse({ error: "Invalid password" });
          }
        });
        return true; // Keep the message channel open for async response

      case "CLEAR_MNEMONIC":
        inMemoryMnemonic = null;
        sendResponse({ success: true });
        break;

      case "GET_ADDRESS":
        chrome.storage.local.get(["address"], (data) => {
          sendResponse({ address: data["address"] || "" });
        });
        return true;

      default:
        sendResponse({ error: "Unknown message type" });
        break;
    }
  }
);

// Handle messages from other parts of the extension
chrome.runtime.onMessage.addListener(
  async (
    request: { to: string; amount: string; type: string },
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<boolean | void> => {
    console.log("sender", sender);
    switch (request.type) {
      case "SENT_ETH_TX":
        // 1. Request mnemonic from background script
        // const { mnemonic } = await new Promise<{ mnemonic: string }>(
        //   (resolve, reject) => {
        //     chrome.runtime.sendMessage({ type: "GET_MNEMONIC" }, (response) => {
        //       if (chrome.runtime.lastError || response?.error) {
        //         reject(response?.error || chrome.runtime.lastError?.message);
        //       } else {
        //         resolve(response);
        //       }
        //     });
        //   }
        // );

        if (!inMemoryMnemonic) throw new Error("Mnemonic not found");

        const mnemonicObj = ethers.Mnemonic.fromPhrase(inMemoryMnemonic);
        const wallet = ethers.HDNodeWallet.fromMnemonic(mnemonicObj);
        try {
          const txHash = await sendEthTx(request.to, request.amount, wallet);
          sendResponse({ success: true, response: txHash });
          return true;
        } catch (error) {
          sendResponse({ success: false, error: error });
          return true;
        }

      default:
        sendResponse({ error: "Unknown message type" });
        break;
    }
  }
);
