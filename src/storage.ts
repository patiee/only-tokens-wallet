async function saveToStorageEncrypted(key: string, value: string) {
  try {
    const { encrypted, iv, key: cryptoKey } = await encrypt(value); // Destructure the result
    // Convert ArrayBuffer and CryptoKey to storable formats
    const encryptedString = btoa(
      String.fromCharCode(...new Uint8Array(encrypted))
    ); // Base64 for storage
    const ivString = btoa(String.fromCharCode(...iv)); // Base64 for storage
    // Export the key to a storable format (JWK)
    const exportedKey = await crypto.subtle.exportKey("jwk", cryptoKey);

    // Store all parts under a single key with a structured object
    chrome.storage.local.set(
      {
        [key]: {
          encrypted: encryptedString,
          iv: ivString,
          key: exportedKey,
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

async function getFromStorageAndDecrypt(
  storageKey: string
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

        console.log("Retrieved iv type:", ivArray.constructor.name);
        console.log("Encrypted data type:", encryptedData.constructor.name);

        const cryptoKey = await crypto.subtle.importKey(
          "jwk",
          storedData.key,
          { name: "AES-GCM", length: 256 },
          true,
          ["decrypt"]
        );

        const decrypted = await decrypt(encryptedData, ivArray, cryptoKey);
        resolve(decrypted);
      } catch (error) {
        console.error("Decryption error:", error);
        reject(error);
      }
    });
  });
}

async function encrypt(text: any) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
  return { encrypted, iv, key }; // Store key and IV securely
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
