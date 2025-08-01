// Create the only object in the main world
if (!window.only) {
    window.only = {};
}

// Create the cosmos interface in the main world
window.only.cosmos = {
    async enable(chainId) {
        return new Promise((resolve, reject) => {
            // Send message to content script to handle the enable call
            window.postMessage({
                type: 'ONLY_COSMOS_ENABLE',
                chainId: chainId
            }, '*');

            // Listen for response
            const handleResponse = (event) => {
                if (event.data.type === 'ONLY_COSMOS_ENABLE_RESPONSE' && event.data.chainId === chainId) {
                    window.removeEventListener('message', handleResponse);
                    if (event.data.error) {
                        reject(new Error(event.data.error));
                    } else {
                        resolve();
                    }
                }
            };

            window.addEventListener('message', handleResponse);
        });
    },

    async getOfflineSigner(chainId) {
        return new Promise((resolve, reject) => {
            // Send message to content script to handle the getOfflineSigner call
            window.postMessage({
                type: 'ONLY_COSMOS_GET_OFFLINE_SIGNER',
                chainId: chainId
            }, '*');

            // Listen for response
            const handleResponse = (event) => {
                if (event.data.type === 'ONLY_COSMOS_GET_OFFLINE_SIGNER_RESPONSE' && event.data.chainId === chainId) {
                    window.removeEventListener('message', handleResponse);
                    if (event.data.error) {
                        reject(new Error(event.data.error));
                    } else {
                        // Create a proxy wallet object that forwards calls to the content script
                        const wallet = {
                            getAccounts: async () => {
                                return new Promise((resolveAccounts, rejectAccounts) => {
                                    window.postMessage({
                                        type: 'ONLY_COSMOS_GET_ACCOUNTS',
                                        chainId: chainId
                                    }, '*');

                                    const handleAccountsResponse = (event) => {
                                        if (event.data.type === 'ONLY_COSMOS_GET_ACCOUNTS_RESPONSE' && event.data.chainId === chainId) {
                                            window.removeEventListener('message', handleAccountsResponse);
                                            if (event.data.error) {
                                                rejectAccounts(new Error(event.data.error));
                                            } else {
                                                resolveAccounts(event.data.accounts);
                                            }
                                        }
                                    };

                                    window.addEventListener('message', handleAccountsResponse);
                                });
                            },

                            signDirect: async (signerAddress, signDoc) => {
                                return new Promise((resolveSign, rejectSign) => {
                                    window.postMessage({
                                        type: 'ONLY_COSMOS_SIGN_DIRECT',
                                        chainId: chainId,
                                        signerAddress: signerAddress,
                                        signDoc: signDoc
                                    }, '*');

                                    const handleSignResponse = (event) => {
                                        if (event.data.type === 'ONLY_COSMOS_SIGN_DIRECT_RESPONSE' && event.data.chainId === chainId) {
                                            window.removeEventListener('message', handleSignResponse);
                                            if (event.data.error) {
                                                rejectSign(new Error(event.data.error));
                                            } else {
                                                resolveSign(event.data.result);
                                            }
                                        }
                                    };

                                    window.addEventListener('message', handleSignResponse);
                                });
                            },

                            signAmino: async (signerAddress, signDoc) => {
                                return new Promise((resolveSign, rejectSign) => {
                                    window.postMessage({
                                        type: 'ONLY_COSMOS_SIGN_AMINO',
                                        chainId: chainId,
                                        signerAddress: signerAddress,
                                        signDoc: signDoc
                                    }, '*');

                                    const handleSignResponse = (event) => {
                                        if (event.data.type === 'ONLY_COSMOS_SIGN_AMINO_RESPONSE' && event.data.chainId === chainId) {
                                            window.removeEventListener('message', handleSignResponse);
                                            if (event.data.error) {
                                                rejectSign(new Error(event.data.error));
                                            } else {
                                                resolveSign(event.data.result);
                                            }
                                        }
                                    };

                                    window.addEventListener('message', handleSignResponse);
                                });
                            }
                        };

                        resolve(wallet);
                    }
                }
            };

            window.addEventListener('message', handleResponse);
        });
    }
};

console.log('Only Tokens Cosmos interface injected successfully'); 