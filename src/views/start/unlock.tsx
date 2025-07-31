import React, { useState } from "react";
import bcrypt from "bcryptjs";

import {
    createDeterministicBcryptSalt,
  getFromStorageAndDecrypt,
  lockExtension,
  unlockExtension,
} from "../../storage";
import { write } from "../../utils";

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    justifyContent: "center",
    borderRadius: "10px",
    width: "100%",
    maxWidth: "400px",
    margin: "0 auto",
    textAlign: "center",
    alignItems: "center",
    fontFamily: "sans-serif",
    // paddingTop: "100px",
  },
  passwordContainer: {
    margin: "10px 0",
    width: "100%",
    padding: "5px",
    boxSizing: "border-box",
    borderRadius: "5px",
    fontSize: "20px",
  },
  nextButton: {
    padding: "5px",
    width: "100%",
    margin: "10px 0",
    backgroundColor: "#dfa8d5",
    borderRadius: "5px",
    fontSize: "20px",
    boxSizing: "border-box",
  },
  nextButtonDisabled: {
    padding: "5px",
    width: "100%",
    margin: "10px 0",
    backgroundColor: "#b7adb5ff",
    borderRadius: "5px",
    fontSize: "20px",
    boxSizing: "border-box",
  },
};

interface UnlockProps {
  next: () => void;
}

export const Unlock: React.FC<UnlockProps> = ({ next }) => {
  const [password, setPassword] = useState("");
  const [wrongPassword, setWrongPassword] = useState(false);

  const unlock = async () => {
    write(`click`)
    const salt = await createDeterministicBcryptSalt(password);
    const hash = await bcrypt.hash(password, salt);
    await unlockExtension(hash);
    write(`unlockExtension`)
    const mnemonic = await getFromStorageAndDecrypt("mnemonic");
    write(`unlocked mnemonic: ${mnemonic}`)
    if (mnemonic?.split(" ").length != 12) {
      lockExtension();
      setWrongPassword(true);
    } else {
      setWrongPassword(false);
      next();
    }
  };

  return (
    <div style={styles["container"]}>
      <input
        style={styles["passwordContainer"]}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter password"
      />
      {wrongPassword ? <p>wrong password</p> : null}
      <button style={styles["nextButton"]} onClick={unlock}>
        Unlock
      </button>
    </div>
  );
};
