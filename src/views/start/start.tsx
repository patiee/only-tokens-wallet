import React, { useEffect, useState } from "react";
import { CreateWallet } from "./create_mnemonic";
import * as bip39 from "bip39";
import { CreatePassword } from "./create_password";
import {  doesStorageKeyExist, isUnlocked } from "../../storage";
import { Unlock } from "./unlock";

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
  const [isConnected, setIsConnected] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [create, setCreate] = useState(false);
  const [isImport, setIsImport] = useState(false);
  const [newMnemonic, setNewMnemonic] = useState<string[]>([]);
  const [isSetPassowrd, setIsSetPassword] = useState(false);

  useEffect(() => {
    const checkMnemonic = async () => {
      const mnemonicExists = await doesStorageKeyExist("mnemonic");
      setIsConnected(mnemonicExists);
    };

    // clearStorage()
    checkMnemonic();
    setUnlocked(isUnlocked());
  }, []);

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

  const setFinishCreatePassword = () => {
    setIsSetPassword(false);
    setCreate(false);
  };

  return (
    <>
      {/* <div style={{width: "100%"}}></div> */}
      {!create && !isImport ? (
        <img src="icon128.png" style={styles["imageStyle"]} />
      ) : null}
      {!isConnected && !unlocked ? (
        <>
          {!create && !isImport ? (
            <button onClick={createWallet} style={styles["createWalletButton"]}>
              Create wallet
            </button>
          ) : null}
          {!create && !isImport ? (
            <button onClick={importWallet} style={styles["createWalletButton"]}>
              Import wallet
            </button>
          ) : null}
          {create && !isSetPassowrd ? (
            <CreateWallet mnemonic={newMnemonic} next={setCreatePassword} />
          ) : null}
          {isSetPassowrd ? (
            <CreatePassword
              mnemonic={newMnemonic}
              next={setFinishCreatePassword}
            />
          ) : null}
        </>
      ) : (
        <Unlock next={() => setIsConnected(true)} />
      )}
    </>
  );
};
