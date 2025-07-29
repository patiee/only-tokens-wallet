declare global {
  interface Window {
    wallet?: {
      getAddress: () => Promise<string>;
    };
    keplr?: {
      enable: (chainId: string) => Promise<void>;
      getKey: (chainId: string) => Promise<{ bech32Address: string }>;
    };
  }
}

// Inject a global API for dApps to interact with the wallet (similar to Keplr's window.keplr)
window.wallet = {
  getAddress: (): Promise<string> => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "GET_ADDRESS" }, (response) => {
        resolve(response?.address || "");
      });
    });
  },
};

// Listen for dApp messages
window.addEventListener("message", (event: MessageEvent) => {
  if (event.data?.type === "WALLET_REQUEST" && event.source instanceof Window) {
    chrome.runtime.sendMessage({ type: "GET_ADDRESS" }, (response) => {
      event.source!.postMessage(
        {
          type: "WALLET_RESPONSE",
          address: response?.address || "",
        },
        {
          targetOrigin: event.origin,
        }
      );
    });
  }
});

// Expose a keplr-compatible API
window.keplr = {
  async enable(chainId: string): Promise<void> {
    // This could open a side panel or popup to request user approval
    await chrome.runtime.sendMessage({ type: "REQUEST_CONNECTION", chainId });
  },

  async getKey(chainId: string): Promise<{ bech32Address: string }> {
    console.log("chainId", chainId);
    return new Promise((resolve) => {
      chrome.storage.local.get(["address"], (data) => {
        resolve({ bech32Address: data["address"] || "" });
      });
    });
  },
};

export {}; // To ensure this is a module and doesn't pollute the global scope
