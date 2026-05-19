import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const path = join(dirname(fileURLToPath(import.meta.url)), "..", "contracts", "ion", "FeeDistributor.fc");
let body = readFileSync(path, "utf8").replace(/^\uFEFF/, "");
if (!body.includes("#pragma version")) {
  body = `#pragma version >=0.4.4;\n\n${body}`;
}
writeFileSync(path, body, { encoding: "utf8" });
const bytes = readFileSync(path);
const hasBom = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
console.log(hasBom ? "FAIL: BOM present" : "OK: UTF-8 without BOM");
console.log(bytes.slice(0, 48).toString("utf8"));
