import React from "react";

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    // padding: "20px",
    borderRadius: "10px",
    width: "100%",
    maxWidth: "400px",
    margin: "0 auto",
    textAlign: "center",
    fontFamily: "sans-serif",
  },
  mnemonicBox: {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
  backgroundColor: "#fff",
  padding: "15px",
  borderRadius: "8px",
  boxShadow: "0 0 5px rgba(0,0,0,0.1)",
  fontSize: "16px",
  lineHeight: "1.6",
  },
  mnemonicWord: {
    marginBottom: "10px",
    padding: "5px 10px",
    backgroundColor: "#f0f0f0",
    borderRadius: "4px",
    textAlign: "left",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  wordIndex: {
    fontWeight: "bold",
    color: "#555",
  },
};

interface CreateWalletProps {
  mnemonic: string[];
}

export const CreateWallet: React.FC<CreateWalletProps> = ({ mnemonic }) => {
  return (
    <div style={styles['container']}>
      <h2>Generated Mnemonic</h2>
      <div style={styles['mnemonicBox']}>
        {mnemonic.map((word, index) => (
          <div key={index} style={styles["mnemonicWord"]}>
            <span style={styles["wordIndex"]}>{index + 1}.</span>
            <span>{word}</span>
          </div>
        ))}
      </div>
    </div>
  );
};