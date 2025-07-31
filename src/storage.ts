import { write } from "./utils";

let sessionKey: CryptoKey | null = null;
let lockTimer: NodeJS.Timeout | null = null;

export async function unlockExtension(passphrase: string) {
  const salt = await generateSaltFromString(passphrase);
  write(`unlockExtension ${passphrase} ${salt}`);
  sessionKey = await deriveKey(passphrase, salt);
  write(`sessionKey ${sessionKey}`);
  lockTimer = setTimeout(() => {
    sessionKey = null;
  }, 60 * 60 * 1000); // 1 hour
}

export function lockExtension() {
  if (lockTimer) clearTimeout(lockTimer);
  sessionKey = null;
}

export function isUnlocked(): boolean {
  return sessionKey !== null;
}

export async function saveToStorageEncrypted(
  key: string,
  value: string,
  passphrase?: string
) {
  try {
    let derivedKey: CryptoKey;
    if (sessionKey && !passphrase) {
      derivedKey = sessionKey;
    } else if (passphrase) {
      const salt = await generateSaltFromString(passphrase);
      derivedKey = await deriveKey(passphrase, salt);
    } else {
      throw new Error("Extension is locked and no passphrase provided");
    }

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const data = encoder.encode(value);
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      derivedKey,
      data
    );
    const encryptedString = btoa(
      String.fromCharCode(...new Uint8Array(encrypted))
    );
    const ivString = btoa(String.fromCharCode(...Array.from(iv)));

    write(
      `saveToStorageEncrypted key: ${key} value: ${value} passphrase: ${passphrase} encryptedString: ${encryptedString} iv: ${iv}`
    );
    chrome.storage.local.set(
      {
        [key]: {
          encrypted: encryptedString,
          iv: ivString,
        },
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error("Error saving to storage:", chrome.runtime.lastError);
        } else {
          console.log(`Successfully saved ${key} to storage`);
        }
      }
    );
  } catch (error) {
    console.error("Encryption or storage error:", error);
    throw error;
  }
}

async function deriveKey(
  passphrase: string,
  salt: ArrayBuffer
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  const saltArray = new Uint8Array(salt);
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltArray,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function getFromStorageAndDecrypt(
  key: string
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    console.log("Checking sessionKey");
    if (sessionKey == null) {
      reject("locked");
      return;
    }
    console.log("SessionKey exists");
    chrome.storage.local.get([key], async (result) => {
      if (chrome.runtime.lastError) {
        console.error(
          "Error retrieving from storage:",
          chrome.runtime.lastError
        );
        console.log(
          `Error retrieving from storage: ${chrome.runtime.lastError}`
        );
        reject(chrome.runtime.lastError);
        return;
      }

      const storedData = result[key];
      if (!storedData) {
        console.log(`No data found for key: ${key}`);
        console.log(`No data found for key: ${key}`);
        resolve(null);
        return;
      }

      try {
        // Decode encrypted data
        const encryptedBase64 = storedData.encrypted;
        const encryptedBinary = atob(encryptedBase64);
        const encryptedArray = new Uint8Array(
          encryptedBinary.split("").map((char) => char.charCodeAt(0))
        );
        const encryptedData: ArrayBuffer = encryptedArray.buffer;

        // Decode IV
        const ivArray = decodeBase64(storedData.iv);
        // const decoder = new TextDecoder("utf-8");

        write(`Try decrypt`);
        write(
          `getFromStorageAndDecrypt key: ${key} sessionKey: ${sessionKey} encryptedString: ${storedData.encrypted} iv: ${ivArray}`
        );

        const decrypted = await decrypt(
          encryptedData,
          ivArray as BufferSource,
          sessionKey as CryptoKey
        );
        resolve(decrypted);
      } catch (error) {
        console.error("Decryption error:", error);
        write(`Decryption error: ${error}`);
        reject(error);
      }
    });
  });
}

async function decrypt(
  encryptedData: ArrayBuffer,
  iv: BufferSource, // Change type to BufferSource
  key: CryptoKey
): Promise<string> {
  try {
    console.log("Decrypting with iv type:", iv.constructor.name);
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv, // BufferSource is valid for AES-GCM
      },
      key,
      encryptedData
    );
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error("Decryption error:", error);
    throw error;
  }
}

export async function doesStorageKeyExist(key: string): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      if (chrome.runtime.lastError) {
        console.error("Storage error:", chrome.runtime.lastError);
        resolve(false);
        return;
      }
      resolve(result.hasOwnProperty(key));
    });
  });
}

export async function generateSaltFromString(
  input: string
): Promise<ArrayBuffer> {
  const enc = new TextEncoder();
  const inputBuffer = enc.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", inputBuffer);
  const uint8Arr = new Uint8Array(hashBuffer).slice(0, 16);
  const saltBuffer = uint8Arr.buffer.slice(0, 16);
  return saltBuffer as ArrayBuffer;
}

export function clearStorage(): void {
  chrome.storage.local.clear(() => {
    if (chrome.runtime.lastError) {
      console.error("Error clearing storage:", chrome.runtime.lastError);
    } else {
      console.log("Storage successfully cleared.");
    }
  });
}

function decodeBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function createDeterministicBcryptSalt(
  input: string,
  rounds: number = 10
): Promise<string> {
  const buffer = await generateSaltFromString(input);
  // Convert ArrayBuffer to Uint8Array
  const bytes = new Uint8Array(buffer);

  // Convert bytes to binary string for btoa
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  // Base64 encode the binary string
  let base64 = btoa(binary);

  // Convert standard base64 to bcrypt base64 (./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789)
  // Replace '+' with '.' and '/' with '.'
  base64 = base64.replace(/\+/g, ".").replace(/\//g, ".");

  // Truncate or pad to 22 chars (bcrypt salt body)
  const saltBody = base64.substring(0, 22).padEnd(22, "A");

  // Construct full bcrypt salt string (29 chars)
  const bcryptSalt = `$2b$${rounds.toString().padStart(2, "0")}$${saltBody}`;

  return bcryptSalt;
}
