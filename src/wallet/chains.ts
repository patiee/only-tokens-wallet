import { write } from "../utils";

interface ChainConfig {
  chainId: string;
  type: string;
  prefix?: string;
  config?: any;
  rpc?: string;
}

interface ChainMap {
  [chainId: string]: ChainConfig;
}

export async function loadChains(): Promise<ChainMap> {
  try {
    const response = await fetch(chrome.runtime.getURL("chains.json"));
    write(`config chains: ${response}`);
    const chains: ChainConfig[] = await response.json();
    return chains.reduce((acc: ChainMap, cfg: ChainConfig) => {
      acc[cfg.chainId] = cfg;
      return acc;
    }, {});
  } catch (err) {
    console.error("Failed to load chains.json:", err);
    return {};
  }
}
