export function write(text: any) {
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
