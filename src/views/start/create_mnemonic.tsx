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
  copyContainer: {
    textAlign: "right",
  },
  copyButton: {
    backgroundColor: "#dfa8d5",
    borderRadius: "5px",
  },
  nextButton: {
    padding: "5px",
    width: "100%",
    margin: "10px 0",
    backgroundColor: "#dfa8d5",
    borderRadius: "5px",
    fontSize: "20px",
  },
};

interface CreateWalletProps {
  mnemonic: string[];
  next: () => void;
}

export const CreateWallet: React.FC<CreateWalletProps> = ({
  mnemonic,
  next,
}) => {
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(mnemonic.join(" "));
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div style={styles["container"]}>
      <h2>Your mnemonic</h2>
      <div style={styles["mnemonicBox"]}>
        {mnemonic.map((word, index) => (
          <div key={index} style={styles["mnemonicWord"]}>
            <span style={styles["wordIndex"]}>{index + 1}.</span>
            <span>{word}</span>
          </div>
        ))}
      </div>
      <div style={styles["copyContainer"]}>
        <button style={styles["copyButton"]} onClick={copyToClipboard}>
          copy
        </button>
      </div>
      <p>Keep it in safe place and do not share with anyone</p>
      <button style={styles["nextButton"]} onClick={next}>
        I understand
      </button>
    </div>
  );
};
