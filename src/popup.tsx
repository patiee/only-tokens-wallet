import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { openInNewWindow } from "./newWindow";
import { StartView } from "./views/start/start";
import { clearStorage } from "./storage";

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
};

const Popup = () => {
  // const [isConnected, setIsConnected] = useState(false);
  const [isStart, setIsStart] = useState(true);

  const handleOpenInNewWindow = () => {
    openInNewWindow(<Popup />);
  };

  return (
    <div style={styles["popup"]}>
      <h3 style={{ textAlign: "center" }}>wallet here</h3>
      {isStart ? <StartView /> : null}
      <button onClick={handleOpenInNewWindow}>Open Popup in New Window</button>
      <button onClick={() => {setIsStart(!isStart);clearStorage()}}>Start</button>
    </div>
  );
};

const view = (window as any).initialView ?? <Popup />;

const root = createRoot(document.getElementById("root")!);

root.render(view);
