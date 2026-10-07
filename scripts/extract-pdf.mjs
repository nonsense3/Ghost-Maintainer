import fs from "fs";
import { PDFParse } from "pdf-parse";

const buf = fs.readFileSync("C:/Users/GHOST/Desktop/prd for ghost maintainer.pdf");
const parser = new PDFParse({ data: buf });
const result = await parser.getText();
fs.writeFileSync("prd-extract.txt", result.text);
console.log("chars", result.text.length);
console.log(result.text.slice(0, 20000));
