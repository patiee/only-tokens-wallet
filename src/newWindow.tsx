// Function to open a new window and render content
export function openInNewWindow(viewComponent: JSX.Element): void {
  const newWindow = window.open(
    chrome.runtime.getURL("popup.html"),
    "_blank",
    "width=390,height=600,toolbar=0,location=0,status=0,menubar=0,scrollbars=1,resizable=0"
  );

  if (!newWindow) {
    console.error("Could not open new window. Check pop-up settings.");
    return;
  }

  const timer = setInterval(() => {
    try {
      if (
        newWindow.document.readyState === "complete" &&
        newWindow.document.getElementById("root")
      ) {
        clearInterval(timer);
        (newWindow as any).initialView = viewComponent;

        newWindow.location.reload();

        window.close();
      }
    } catch (e) {}
  }, 100);
}
