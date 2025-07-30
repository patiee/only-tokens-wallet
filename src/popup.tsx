import React, { useState } from "react";
import { createRoot } from "react-dom/client";

type RenderFunction = (newWindow: Window) => void;

// Rendering function to render the Popup component in the new window
export const renderPopupInNewWindow: RenderFunction = (newWindow: Window) => {
  const doc = newWindow.document;

  // Create a container for React
  const appContainer = doc.createElement("div");
  appContainer.id = "root";
  doc.body.appendChild(appContainer);

  // Load React and ReactDOM scripts dynamically
  const reactScript = doc.createElement("script");
  reactScript.src = "https://unpkg.com/react@18/umd/react.production.min.js";
  doc.head.appendChild(reactScript);

  const reactDomScript = doc.createElement("script");
  reactDomScript.src =
    "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js";
  doc.head.appendChild(reactDomScript);

  reactDomScript.onload = () => {
    // Render the Popup component after scripts are loaded
    const root = (newWindow as any).ReactDOM.createRoot(appContainer);
    root.render(<Popup />);
  };
};

const renderCreateWallet = (
  setIsWallet: any,
  createWallet: any,
  importWallet: any
) => {
  return (
    <>
      <button onClick={() => createWallet()} style={{ marginRight: "5px" }}>
        Create wallet
      </button>
      <button
        onClick={() => {
          importWallet();
          setIsWallet();
        }}
        style={{ padding: "5px", width: '100%' }}
      >
        Import wallet
      </button>
    </>
  );
};

// Function to open a new window and render content
export function openInNewWindow(renderFn: RenderFunction): void {
  const newWindow = window.open(
    "popup.html", // No URL; you can write to it with `document.write`
    "walletPopup", // Window name
    "width=380,height=600,toolbar=0,location=0,status=0,menubar=0,scrollbars=1,resizable=1"
  );

  if (newWindow) {
    // Wait for the window to load before rendering
    newWindow.onload = () => {
      renderFn(newWindow);
      // Close the popup window
      window.close();
    };
  } else {
    console.error(
      "Failed to open new window. Please check if pop-ups are blocked."
    );
  }
}

const Popup = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isWallet, setIsWallet] = useState(false);

  const handleOpenInNewWindow = () => {
    openInNewWindow(renderPopupInNewWindow);
  };

  const createWallet = () => {
    setIsConnected(!isConnected);
  };

  const importWallet = () => {
    setIsConnected(!isConnected);
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minWidth: "350px",
        minHeight: "550px",
        backgroundColor: "#ffedffff",
        overflowY: "auto",
        padding: "5px 10px",
        display: "flex",
        justifyContent: "center",
        alignItems: "start",
        overflow: "wrap"
      }}
    >
      <h3 style={{ textAlign: "center" }}>wallet here</h3>
      {isWallet
        ? null
        : renderCreateWallet(setIsWallet, createWallet, importWallet)}

      {isConnected ? "connected" : "not connected"}
      <button onClick={handleOpenInNewWindow}>Open Popup in New Window</button>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
