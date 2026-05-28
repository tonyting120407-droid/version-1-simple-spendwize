import { mkdir, copyFile, rm } from "node:fs/promises";

const outputDir = "dist";
const files = ["index.html", "app.js", "styles.css", "README.md"];

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await Promise.all(files.map((file) => copyFile(file, `${outputDir}/${file}`)));
console.log(`Built SpendWise static files into ${outputDir}/`);
