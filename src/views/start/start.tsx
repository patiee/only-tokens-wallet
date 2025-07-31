import React, { useState } from "react";
import { CreateWallet } from "./create_mnemonic";
import * as bip39 from "bip39";
import { CreatePassword } from "./create_password";

const styles: { [key: string]: React.CSSProperties } = {
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

export const StartView: React.FC = () => {
  const [create, setCreate] = useState(false);
  const [isImport, setIsImport] = useState(false);
  const [newMnemonic, setNewMnemonic] = useState<string[]>([]);
  const [isSetPassowrd, setIsSetPassword] = useState(false);

  const generateMnemonic = () => {
    const mnemonic: string = bip39.generateMnemonic(); // 128 bits = 12 words
    const words: string[] = mnemonic.split(" ");
    setNewMnemonic(words);
  };

  const createWallet = () => {
    generateMnemonic();
    setCreate(true);
  };

  const importWallet = () => {
    setIsImport(true);
  };

  const setCreatePassword = () => {
    setIsSetPassword(true);
  };
  return (
    <>
      {/* <div style={{width: "100%"}}></div> */}
      {!create && !isImport ? <img src="icon128.png" style={styles["imageStyle"]} />: null}
      {!create && !isImport ? (
        <button
          onClick={createWallet}
          style={styles["createWalletButton"]}
        >
          Create wallet
        </button>
      ) : null}
      {!create && !isImport ? (
        <button
          onClick={importWallet}
          style={styles["createWalletButton"]}
        >
          Import wallet
        </button>
      ) : null}
      {create ? (
        <CreateWallet mnemonic={newMnemonic} next={setCreatePassword} />
      ) : null}
      {isSetPassowrd ? <CreatePassword mnemonic={newMnemonic} /> : null}
    </>
  );
};
