import { ethers } from "ethers";

document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab") as NodeListOf<HTMLElement>;
  const tabContents = document.querySelectorAll(
    ".tab-content"
  ) as NodeListOf<HTMLElement>;
  const addressSpan = document.getElementById("address") as HTMLSpanElement;
  const balanceSpan = document.getElementById("balance") as HTMLSpanElement;
  const refreshBalanceBtn = document.getElementById(
    "refreshBalance"
  ) as HTMLButtonElement;
  const showMnemonicBtn = document.getElementById(
    "showMnemonic"
  ) as HTMLButtonElement;
  const logoutBtn = document.getElementById("logout") as HTMLButtonElement;

  // Tab switching
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));
      tab.classList.add("active");
      const targetId = tab.dataset["tab"];
      if (targetId) {
        const target = document.getElementById(targetId);
        if (target) target.classList.add("active");
      }
    });
  });

  // Set default tab
  const defaultTab = document.querySelector(
    '.tab[data-tab="account"]'
  ) as HTMLElement;
  const defaultTabContent = document.getElementById("account") as HTMLElement;
  defaultTab?.classList.add("active");
  defaultTabContent?.classList.add("active");

  // Load wallet address
  chrome.storage.local.get(["address"], async (data) => {
    const address = data["address"];
    if (address) {
      addressSpan.textContent = address;
      await updateBalance(address);
    } else {
      addressSpan.textContent = "No wallet loaded";
    }
  });

  // Refresh balance
  refreshBalanceBtn.addEventListener("click", async () => {
    const address = addressSpan.textContent;
    if (address && address !== "No wallet loaded") {
      await updateBalance(address);
    }
  });

  // Show mnemonic
  showMnemonicBtn.addEventListener("click", () => {
    const password = prompt("Enter your password:");
    if (!password) {
      alert("Password required!");
      return;
    }

    chrome.runtime.sendMessage(
      { type: "DECRYPT_VAULT", password },
      (response: any) => {
        if (response?.mnemonic) {
          alert("Mnemonic (keep secure!): " + response.mnemonic);
        } else {
          alert("Incorrect password!");
        }
      }
    );
  });

  // Logout
  logoutBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "CLEAR_MNEMONIC" }, () => {
      chrome.storage.local.clear(() => {
        addressSpan.textContent = "No wallet loaded";
        balanceSpan.textContent = "0 ETH";
        alert("Logged out");
      });
    });
  });

  async function updateBalance(address: string): Promise<void> {
    try {
      const provider = new ethers.JsonRpcProvider(
        "https://rpc.sepolia.eth.network"
      );
      const balance = await provider.getBalance(address);
      balanceSpan.textContent = ethers.formatEther(balance) + " ETH";
    } catch (e) {
      balanceSpan.textContent = "Error fetching balance";
      console.error("Balance error:", e);
    }
  }
});

// Session check
chrome.storage.session.get(["sessionStart"], (data) => {
  const sessionStart = data["sessionStart"];
  const content = document.getElementById("tab-content") as HTMLElement;
  if (!sessionStart || Date.now() - sessionStart > 5 * 60 * 1000) {
    if (content) content.style.display = "none";
    alert("Session locked. Please re-enter password.");
  }
});
