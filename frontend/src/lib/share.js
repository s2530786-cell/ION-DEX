import { toPng } from "html-to-image";

const APP_URL = "https://iondex.app";

export { APP_URL };

async function nodeToDataUrl(node) {
  return await toPng(node, { pixelRatio: 2, cacheBust: true, skipFonts: true, backgroundColor: "#050811" });
}

export async function downloadNode(node, filename) {
  const dataUrl = await nodeToDataUrl(node);
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export async function nodeToFile(node, filename) {
  const dataUrl = await nodeToDataUrl(node);
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: "image/png" });
}

export async function nativeShare(node, text, filename, url = APP_URL) {
  try {
    const file = await nodeToFile(node, filename);
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text, url });
      return true;
    }
    if (navigator.share) {
      await navigator.share({ text, url });
      return true;
    }
  } catch (e) { /* user cancelled or unsupported */ }
  return false;
}

export function shareToX(text, url = APP_URL) {
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank", "noopener");
}

export function shareToTelegram(text, url = APP_URL) {
  window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank", "noopener");
}

export async function copyText(text, url = APP_URL) {
  try {
    await navigator.clipboard.writeText(`${text} ${url}`);
    return true;
  } catch (e) {
    return false;
  }
}
