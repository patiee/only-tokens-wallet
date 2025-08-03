// Create the only object in the main world
if (!window.only) {
    window.only = {};
}

// Create the ethereum interface in the main world (MetaMask-like)
window.only.ethereum = {
    // Request method that mimics MetaMask's request
    async request(request) {
        return new Promise((resolve, reject) => {
            // Generate unique ID for this request
            const requestId = Math.random().toString(36).substr(2, 9);

            // Send message to content script to handle the request
            window.postMessage({
                type: 'ONLY_EVM_REQUEST',
                id: requestId,
                request: request
            }, '*');

            // Listen for response
            const handleResponse = (event) => {
                if (event.data.type === 'ONLY_EVM_REQUEST_RESPONSE' && event.data.id === requestId) {
                    window.removeEventListener('message', handleResponse);
                    if (event.data.error) {
                        reject(new Error(event.data.error));
                    } else {
                        resolve(event.data.result);
                    }
                }
            };

            window.addEventListener('message', handleResponse);
        });
    },

    // Event listeners for MetaMask compatibility
    on(eventName, listener) {
        // Store event listeners for future use
        if (!this._listeners) this._listeners = {};
        if (!this._listeners[eventName]) this._listeners[eventName] = [];
        this._listeners[eventName].push(listener);
    },

    removeListener(eventName, listener) {
        if (this._listeners && this._listeners[eventName]) {
            const index = this._listeners[eventName].indexOf(listener);
            if (index > -1) {
                this._listeners[eventName].splice(index, 1);
            }
        }
    },

    // Properties that ethers.js expects
    isMetaMask: true,
    isOnlyTokens: true,
    selectedAddress: null,
    networkVersion: '1',
    chainId: '0x1',

    // Method to get the current account
    async getSelectedAddress() {
        return new Promise((resolve, reject) => {
            window.postMessage({
                type: 'ONLY_EVM_GET_SELECTED_ADDRESS'
            }, '*');

            const handleResponse = (event) => {
                if (event.data.type === 'ONLY_EVM_GET_SELECTED_ADDRESS_RESPONSE') {
                    window.removeEventListener('message', handleResponse);
                    if (event.data.error) {
                        reject(new Error(event.data.error));
                    } else {
                        resolve(event.data.address);
                    }
                }
            };

            window.addEventListener('message', handleResponse);
        });
    },

    // Method to update properties based on active chain
    async updateProperties() {
        try {
            // Get active chain from session
            const sessionData = await chrome.storage.session.get(['activeChainId']);
            const activeChainId = sessionData['activeChainId'];

            if (activeChainId) {
                // Update chainId
                this.chainId = '0x' + parseInt(activeChainId).toString(16);

                // Update networkVersion (decimal chain ID)
                this.networkVersion = activeChainId;

                // Update selectedAddress
                const accounts = await this.request({ method: 'eth_accounts' });
                this.selectedAddress = accounts[0] || null;
            }
        } catch (error) {
            console.error('Failed to update ethereum properties:', error);
        }
    }
};

// Initialize properties when the interface is created
window.only.ethereum.updateProperties().catch(console.error);

console.log('Only Tokens EVM interface injected successfully'); 