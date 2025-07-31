interface Cosmos {
  enable(chainId: string): Promise<void>;
  getOfflineSigner(chainId: string): Promise<OfflineSigner>;
}

interface OfflineSigner {
  getAccounts(): Promise<
    readonly { address: string; algo: string; pubkey: Uint8Array }[]
  >;
  signDirect(signerAddress: string, signDoc: any): Promise<any>;
}

interface Window {
  only: {
    cosmos: Cosmos | undefined;
  };
}
