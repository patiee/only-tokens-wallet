// function polling() {
//   // console.log("polling");
//   setTimeout(polling, 1000 * 30);
// }

// polling();

function writeOnConsole(text: any) {
  console.log(text);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // console.log("Message received in background:", message, sender);
  if (message.action === "console") {
    writeOnConsole(message.data);
    sendResponse({ result: "ok" });
  }
  return true; // Keeps the message channel open for async response
});
