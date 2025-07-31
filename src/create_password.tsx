import React, { useEffect, useState } from "react";

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
    paddingTop: "100px"
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
  nextButtonDisabled:{
    padding: "5px",
    width: "100%",
    margin: "10px 0", 
    backgroundColor: "#b7adb5ff",
    borderRadius: "5px",
    fontSize: "20px",
    boxSizing: "border-box", 
  }
};

interface CreatePasswordProps {
  mnemonic: string[];
}

function write(text:any) {
    chrome.runtime.sendMessage(
        { action: "console", data: { message: text } },
        (response) => {
          if (response) {
            console.log("Response from background:", response.result);
          } else {
            console.log("No response from background");
          }
        }
      );
}

export const CreatePassword: React.FC<CreatePasswordProps> = ({}) => {
    const [isOk, setIsOk] = useState(false)
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");
      const setPasswordIsOk = () => {
    write(`Validating:, { ${password}, ${password2} }`)
    
    const isLongEnough = password.length >= 8;
    const hasSpecial = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
    write(`Checks:", { ${isLongEnough}, ${hasSpecial}, match: ${password === password2} }`)
    if (password === password2 && isLongEnough && hasSpecial) {
      write("Validation passed, setting isOk to true")
      setIsOk(true);
    } else {
        write("Validation failed, setting isOk to false")
      setIsOk(false);
    }
  };

  useEffect(() => {
    setPasswordIsOk()
  })
    
    return (
    <div style={styles["container"]}>
      <h2>Create a password</h2>
      <input style={styles["passwordContainer"]} type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Enter password"/>
      <input style={styles["passwordContainer"]} type="password" value={password2} onChange={(e)=>setPassword2(e.target.value)} placeholder="Re-enter password"/>
      {isOk ? null : <p>min. 8 characters and 1 special character</p>}
      <button style={isOk ? styles["nextButton"]: styles['nextButtonDisabled']} disabled={!isOk}>Create password</button>
    </div>
  );
};
