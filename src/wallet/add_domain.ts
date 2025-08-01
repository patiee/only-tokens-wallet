// document.addEventListener("click", (event) => {
//   if (event) {
//     const button = event.target.closest("#add-domain-button"); // Replace with your button's ID or selector
//     if (button) {
//       const domain = button.dataset.domain || "https://example.com/*"; // Get domain from data attribute or hardcode
//       chrome.runtime.sendMessage({
//         type: "REQUEST_PERMISSION",
//         domain: domain,
//       });
//     }
//   }
// });
