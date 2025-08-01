import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { openInNewWindow } from "./newWindow";
import { StartView } from "./views/start/start";
import { clearStorage, isUnlocked, lockExtension } from "./storage";
import { Dashboard } from "./views/dashboard/dashboard";

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

interface PopupProps {}

export const Popup: React.FC<PopupProps> = () => {
  const [unlocked, setUnlocked] = useState(true);

  useEffect(() => {
    const checkIsUnlocked = async () => {
      const checkIsUnlocked = await isUnlocked();
      setUnlocked(checkIsUnlocked);
    };

    checkIsUnlocked();
  }, [unlocked]);

  const handleOpenInNewWindow = () => {
    openInNewWindow(<Popup />);
  };

  return (
    <div style={styles["popup"]}>
      <h3 style={{ textAlign: "center" }}>wallet here</h3>
      {!unlocked ? <StartView next={() => setUnlocked(true)} /> : <Dashboard />}
      <button onClick={handleOpenInNewWindow}>Open Popup in New Window</button>
      <button
        onClick={() => {
          clearStorage();
          lockExtension();
        }}
      >
        Start
      </button>
    </div>
  );
};

const view = (window as any).initialView ?? <Popup />;

const root = createRoot(document.getElementById("root")!);

root.render(view);
