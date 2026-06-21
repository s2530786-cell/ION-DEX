import React, { useState } from "react";
import { toast } from "sonner";
import { Share2, Download, Send, Copy, Twitter } from "lucide-react";
import { downloadNode, nativeShare, shareToX, shareToTelegram, copyText } from "../lib/share";

export default function ShareMenu({ cardRef, text, filename, url, testIdPrefix = "share" }) {
  const [busy, setBusy] = useState(false);
  const canNative = typeof navigator !== "undefined" && !!navigator.share;

  const guard = async (fn) => {
    if (!cardRef.current) return;
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  const onNative = () => guard(async () => {
    const ok = await nativeShare(cardRef.current, text, filename, url);
    if (!ok) toast.message("此设备不支持原生分享,试试保存图片或 X / Telegram");
  });
  const onDownload = () => guard(async () => {
    await downloadNode(cardRef.current, filename);
    toast.success("霓虹卡片已保存,去 X / Telegram 晒一晒吧!");
  });
  const onCopy = () => guard(async () => {
    const ok = await copyText(text, url);
    toast[ok ? "success" : "error"](ok ? "邀请文案+链接已复制" : "复制失败");
  });

  const Btn = ({ icon: I, children, onClick, color, testid }) => (
    <button onClick={onClick} disabled={busy} className="share-act" style={{ "--sc": color }} data-testid={testid}>
      <I size={15} strokeWidth={2.2} />
      <span>{children}</span>
    </button>
  );

  return (
    <div className="grid grid-cols-2 gap-2" data-testid={`${testIdPrefix}-actions`}>
      {canNative && <Btn icon={Share2} color="var(--cyan)" onClick={onNative} testid={`${testIdPrefix}-native`}>一键分享(带图)</Btn>}
      <Btn icon={Download} color="var(--green)" onClick={onDownload} testid={`${testIdPrefix}-download`}>保存图片</Btn>
      <Btn icon={Twitter} color="#1DA1F2" onClick={() => shareToX(text, url)} testid={`${testIdPrefix}-x`}>分享到 X</Btn>
      <Btn icon={Send} color="#229ED9" onClick={() => shareToTelegram(text, url)} testid={`${testIdPrefix}-tg`}>Telegram</Btn>
      <Btn icon={Copy} color="var(--purple)" onClick={onCopy} testid={`${testIdPrefix}-copy`}>复制文案</Btn>
    </div>
  );
}
