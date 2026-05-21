import { useCallback, useRef, useState } from "react";
import { Upload, Camera } from "lucide-react";

const PINATA_JWT = "3d9c62f5ea59126cdde1";
const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs";
const LS_KEY = "ion-dex-avatar-cid";

function getStoredCid(): string | null {
  try { return localStorage.getItem(LS_KEY); } catch { return null; }
}
function storeCid(cid: string) {
  try { localStorage.setItem(LS_KEY, cid); } catch { /* noop */ }
}

export function useAvatar(): [string | null, (file: File) => Promise<string>] {
  const [cid, setCid] = useState<string | null>(getStoredCid);
  const upload = useCallback(async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: { Authorization: `Bearer ${PINATA_JWT}` },
      body: form,
    });
    if (!res.ok) throw new Error("Upload failed");
    const { IpfsHash } = await res.json() as { IpfsHash: string };
    storeCid(IpfsHash);
    setCid(IpfsHash);
    return IpfsHash;
  }, []);
  return [cid, upload];
}

export function avatarUrl(cid: string | null): string | null {
  return cid ? `${PINATA_GATEWAY}/${cid}` : null;
}

export function ProfileAvatar({
  cid, onUpload, size, className,
}: {
  cid: string | null; onUpload: (f: File) => void; size?: number; className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const s = size ?? 40;
  const imgUrl = avatarUrl(cid);
  return (
    <>
      <button
        className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full border-2 border-cyan-300/30 bg-white/[0.06] transition hover:border-cyan-300/60 ${className ?? ""}`}
        onClick={() => inputRef.current?.click()}
        style={{ width: s, height: s }}
        title="Change avatar"
        type="button"
      >
        {imgUrl ? (
          <img alt="avatar" className="h-full w-full object-cover" src={imgUrl} />
        ) : (
          <Camera size={s * 0.4} className="text-cyan-100/40" />
        )}
      </button>
      <input
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }}
        ref={inputRef}
        type="file"
      />
    </>
  );
}
