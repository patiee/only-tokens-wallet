import { ethers, HDNodeWallet } from "ethers";
import { fetchAddressTransactions } from "@evmexplorer/blockscout";

export async function connectToEthereum(): Promise<void> {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  const addressEl = document.getElementById("address");
  if (addressEl) {
    addressEl.textContent = address;
  }

  const balance = await provider.getBalance(address);
  const balanceEl = document.getElementById("balance");
  if (balanceEl) {
    balanceEl.textContent = ethers.formatEther(balance);
  }
}

export async function fetchTransactions(address: string): Promise<void> {
  try {
    const transactions = await fetchAddressTransactions(
      address,
      undefined,
      11155111
    );

    const txList = document.createElement("ul");
    transactions.items.forEach((tx: any) => {
      const li = document.createElement("li");
      const ethValue = Number(tx.value) / 1e18;
      li.textContent = `Tx: ${tx.hash} (${ethValue} ETH)`;
      txList.appendChild(li);
    });
  } catch (error) {
    console.error("Error fetching account history:", error);
  }
}

export async function sendEthTx(
  to: string,
  amountEth: string,
  wallet: HDNodeWallet
): Promise<string | Error> {
  try {
    const provider = new ethers.JsonRpcProvider(
      "https://rpc.sepolia.eth.network"
    );
    const signer = wallet.connect(provider);

    // 3. Prepare and send the transaction
    const tx = await signer.sendTransaction({
      to,
      value: ethers.parseEther(amountEth),
    });

    console.log("Transaction sent:", tx.hash);
    return tx.hash;
  } catch (error) {
    console.error("Failed to send transaction:", error);
    return error;
  }
}
