const fs = require("fs");
const path = require("path");
const manifest = require("../src/pages/manifest").default;

const outputDir = path.resolve(__dirname, "../");

// Ensure dist/ exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(
  path.join(outputDir, "manifest.json"),
  JSON.stringify(manifest, null, 2)
);
console.log("manifest.json written to dist/");
