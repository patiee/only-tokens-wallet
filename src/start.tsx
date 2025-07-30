import React from "react";

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

export const renderStartView = (
  createWallet: any,
  importWallet: any
) => {
  return (
    <>
      {/* <div style={{width: "100%"}}></div> */}
      <img src="icon128.png" style={styles["imageStyle"]} />

      <button
        onClick={() => {
          createWallet();
        }}
        style={styles["createWalletButton"]}
      >
        Create wallet
      </button>
      <button
        onClick={() => {
          importWallet();
        }}
        style={styles["createWalletButton"]}
      >
        Import wallet
      </button>
    </>
  );
};
