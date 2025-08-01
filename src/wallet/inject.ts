// Inject a script tag to run in the main world
const script = document.createElement("script");
script.src = chrome.runtime.getURL("cosmos.ts");
script.type = "text/javascript";
(document.head || document.documentElement).appendChild(script);

// // Listen for messages from the injected script
// window.addEventListener("message", (event) => {
//   if (event.data.type === "ONLY_COSMOS_RESPONSE") {
//     console.log("Received window.only.cosmos data:", event.data.data);
//     chrome.runtime.sendMessage(event.data);
//   }
// });
