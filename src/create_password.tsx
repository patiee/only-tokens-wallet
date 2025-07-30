import React from "react";

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    // padding: "20px", // Added padding for better spacing
    // display: "flex", // Use flexbox to center
    justifyContent: "center", 
    borderRadius: "10px",
    width: "100%",
    maxWidth: "400px",
    margin: "0 auto",
    textAlign: "center",
    alignItems: "center",
    fontFamily: "sans-serif",
    paddingTop: "100px"
  },
  passwordContainer: {
    margin: "10px 0", // Vertical margin to match button's spacing
    width: "100%",
    padding: "5px",
    boxSizing: "border-box", // Ensures padding is included in width
    borderRadius: "5px",
    fontSize: "20px",
  },
  nextButton: {
    padding: "5px",
    width: "100%",
    margin: "10px 0", // Consistent vertical margin
    backgroundColor: "#dfa8d5",
    borderRadius: "5px",
    fontSize: "20px",
    boxSizing: "border-box", // Ensures padding is included in width
  },
};

interface CreatePasswordProps {
  mnemonic: string[];
}

export const CreatePassword: React.FC<CreatePasswordProps> = ({}) => {
  return (
    <div style={styles["container"]}>
      <h2>Create password</h2>
      <input style={styles["passwordContainer"]} type="password"/>
      <input style={styles["passwordContainer"]} type="password"/>
      <button style={styles["nextButton"]}>Create password</button>
    </div>
  );
};
