import { deriveKey, generateSaltFromString } from "./storage";

type Message =
  | { action: "console"; data: string }
  | { action: "unlock"; passphrase: string }
  | { action: "lock" }
  | { action: "isUnlocked" }
  | { action: "getSessionKey" };

let sessionKey: CryptoKey | null = null;
let lockTimer: NodeJS.Timeout | null = null;

async function storeSessionKey(key: CryptoKey, ttl: number) {
  const exportedKey = await crypto.subtle.exportKey("jwk", key);
  const expiry = Date.now() + ttl;
  await chrome.storage.session.set({
    sessionKey: { key: exportedKey, expiry },
  });
}

async function retrieveSessionKey(): Promise<CryptoKey | null> {
  const result = await chrome.storage.session.get("sessionKey");
  const stored = result["sessionKey"];
  if (!stored || stored.expiry < Date.now()) {
    await chrome.storage.session.remove("sessionKey");
    return null;
  }
  return crypto.subtle.importKey("jwk", stored.key, { name: "AES-GCM" }, true, [
    "encrypt",
    "decrypt",
  ]);
}

chrome.runtime.onMessage.addListener(
  (
    message: Message,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void
  ) => {
    console.log("Message received in background:", message, sender);
    if (message.action === "console") {
      writeOnConsole(message.data);
      sendResponse({ result: "ok" });
      return true; // Keeps the message channel open for async response
    } else if (message.action === "unlock") {
      (async () => {
        try {
          const salt = await generateSaltFromString(message.passphrase); // Assume this exists
          sessionKey = await deriveKey(message.passphrase, salt); // Assume this exists
          await storeSessionKey(sessionKey, 60 * 60 * 1000);
          lockTimer = setTimeout(() => {
            sessionKey = null;
            chrome.storage.session.remove("sessionKey");
          }, 60 * 60 * 1000);
          sendResponse({ success: true });
        } catch (error) {
          console.error("Unlock failed:", error);
          sendResponse({ success: false, error: (error as Error).message });
        }
      })();
      return true; // Keep message channel open for async
    } else if (message.action === "lock") {
      if (lockTimer) clearTimeout(lockTimer);
      sessionKey = null;
      chrome.storage.session.remove("sessionKey");
      sendResponse({ success: true });
    } else if (message.action === "isUnlocked") {
      (async () => {
        if (!sessionKey) {
          sessionKey = await retrieveSessionKey();
        }
        console.log(`isUnlocked: ${sessionKey !== null}`); // Replaced writeOnConsole
        sendResponse({ unlocked: sessionKey !== null });
      })();
      return true;
    } else if (message.action === "getSessionKey") {
      (async () => {
        if (!sessionKey) {
          sessionKey = await retrieveSessionKey();
        }
        sendResponse({
          key: sessionKey
            ? await crypto.subtle.exportKey("jwk", sessionKey)
            : null,
        });
      })();
      return true;
    }
    return true; // Default return for async responses
  }
);

export function writeOnConsole(text: any) {
  console.log(text);
}
