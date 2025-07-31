async function saveToStorageEncrypted(
  key: string,
  value: string,
  passphrase: string
) {
  try {
    const derivedKey = await deriveKey(passphrase);
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
    const ivString = btoa(String.fromCharCode(...iv));
    const salt = btoa(
      String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16)))
    );

    chrome.storage.local.set(
      {
        [key]: {
          encrypted: encryptedString,
          iv: ivString,
          salt, // Store salt instead of key
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
  }
}

async function deriveKey(passphrase: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: crypto.getRandomValues(new Uint8Array(16)),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// Decryption would require the passphrase to derive the key again
async function getFromStorageAndDecrypt(
  storageKey: string,
  passphrase: string
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([storageKey], async (result) => {
      if (chrome.runtime.lastError) {
        console.error(
          "Error retrieving from storage:",
          chrome.runtime.lastError
        );
        reject(chrome.runtime.lastError);
        return;
      }

      const storedData = result[storageKey];
      if (!storedData) {
        console.log(`No data found for key: ${storageKey}`);
        resolve(null);
        return;
      }

      try {
        const encryptedBase64 = storedData.encrypted;
        const encryptedBinary = atob(encryptedBase64);
        const encryptedArray = new Uint8Array(encryptedBinary.length);
        for (let i = 0; i < encryptedBinary.length; i++) {
          encryptedArray[i] = encryptedBinary.charCodeAt(i);
        }
        const encryptedData = encryptedArray.buffer;

        const ivBase64 = storedData.iv;
        const ivBinary = atob(ivBase64);
        const ivArray = new Uint8Array(ivBinary.length);
        for (let i = 0; i < ivBinary.length; i++) {
          ivArray[i] = ivBinary.charCodeAt(i);
        }

        const derivedKey = await deriveKey(passphrase); // Derive key from passphrase
        const decrypted = await decrypt(encryptedData, ivArray, derivedKey);
        resolve(decrypted);
      } catch (error) {
        console.error("Decryption error:", error);
        reject(error);
      }
    });
  });
}

async function decrypt(
  encryptedData: ArrayBuffer,
  iv: BufferSource,
  key: CryptoKey
): Promise<string> {
  try {
    console.log("Decrypting with iv type:", iv.constructor.name);
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
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
