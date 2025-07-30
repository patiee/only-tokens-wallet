import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { openInNewWindow } from "./newWindow";
import { renderStartView } from "./start";
import { CreateWallet } from "./create_mnemonic";

import * as bip39 from "bip39";

const styles: { [key: string]: React.CSSProperties } = {
  popup: {
    minWidth: "350px",
    minHeight: "550px",
    backgroundColor: "#ffedffff",
    overflowY: "auto",
    padding: "5px 10px",
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    overflow: "auto",
    flexDirection: "column",
    boxSizing: "border-box",
  },
  createWalletButton: {
    padding: "5px",
    width: "100%",
    margin: "10px 0",
    backgroundColor: "#dfa8d5",
    borderRadius: "5px",
    fontSize: "20px",
  },
  imageStyle: {
    display: "block",
    padding: "50px",
  },
};



const Popup = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isStart, setIsStart] = useState(false);
  const [create, setCreate] = useState(false);

  const [newMnemonic, setNewMnemonic] = useState<string[]>([]);

  const handleOpenInNewWindow = () => {
    openInNewWindow(<Popup />);
  };

  const generateMnemonic = () => {
    const mnemonic: string = bip39.generateMnemonic(); // 128 bits = 12 words
    const words: string[] = mnemonic.split(" ");
    setNewMnemonic(words);
  };

  const createWallet = () => {
    generateMnemonic();
    setIsStart(!isStart);
    setCreate(!create);
  };

  const importWallet = () => {
    setIsConnected(!isConnected);
  };

  return (
    <div style={styles["popup"]}>
      <h3 style={{ textAlign: "center" }}>wallet here</h3>
      {isStart ? null : renderStartView(createWallet, importWallet)}
      {create ? <CreateWallet mnemonic={newMnemonic}/> : null}
      {/* {isStart ? "start" : "not start"}
      {isConnected ? "connected" : "not connected"} */}
      <button onClick={handleOpenInNewWindow}>Open Popup in New Window</button>
    </div>
  );
};

const view = (window as any).initialView ?? <Popup />;

const root = createRoot(document.getElementById("root")!);

root.render(view);
