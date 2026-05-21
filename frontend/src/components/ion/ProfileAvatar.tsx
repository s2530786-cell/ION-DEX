import { useCallback, useRef, useState } from "react";
import { Camera } from "lucide-react";

const LS_KEY = "ion-dex-avatar";

function getStoredAvatar(): string | null {
  try { return localStorage.getItem(LS_KEY); } catch { return null; }
}
function storeAvatar(dataUrl: string) {
  try { localStorage.setItem(LS_KEY, dataUrl); } catch { /* noop */ }
}

export function useAvatar(): [string | null, (file: File) => Promise<string>] {
  const [dataUrl, setDataUrl] = useState<string | null>(getStoredAvatar);
  const upload = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        storeAvatar(url);
        setDataUrl(url);
        resolve(url);
      };
      reader.onerror = () => reject(new Error("Read failed"));
      reader.readAsDataURL(file);
    });
  }, []);
  return [dataUrl, upload];
}

export function avatarUrl(dataUrl: string | null): string | null {
  return dataUrl;
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
