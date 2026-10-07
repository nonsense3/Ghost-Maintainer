import fs from "fs";
import path from "path";
import { createCanvas } from "@napi-rs/canvas";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

class NodeCanvasFactory {
  create(width, height) {
    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");
    return { canvas, context };
  }
  reset(canvasAndContext, width, height) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }
  destroy(canvasAndContext) {
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
  }
}

const pdfPath = "C:/Users/GHOST/Desktop/prd for ghost maintainer.pdf";
const outDir = "d:/codes/Ghost Maintainer/prd-pages";
fs.mkdirSync(outDir, { recursive: true });

const data = new Uint8Array(fs.readFileSync(pdfPath));
const canvasFactory = new NodeCanvasFactory();
const doc = await getDocument({ data, canvasFactory, useSystemFonts: true }).promise;

for (let i = 1; i <= doc.numPages; i++) {
  const page = await doc.getPage(i);
  const scale = 2;
  const viewport = page.getViewport({ scale });
  const canvasAndContext = canvasFactory.create(viewport.width, viewport.height);
  await page.render({
    canvasContext: canvasAndContext.context,
    viewport,
    canvasFactory,
  }).promise;
  const out = path.join(outDir, `page-${i}.png`);
  fs.writeFileSync(out, canvasAndContext.canvas.toBuffer("image/png"));
  canvasFactory.destroy(canvasAndContext);
  console.log("wrote", out);
}
