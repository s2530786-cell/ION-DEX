import { UserRound } from "lucide-react";
import { avatarPreviewForId } from "@/lib/profileAvatar";

type SidebarIdentityRowProps = {
  connected: boolean;
  label: string;
  avatarId: string;
  onOpen: () => void;
};

export function SidebarIdentityRow({
  connected,
  label,
  avatarId,
  onOpen,
}: SidebarIdentityRowProps) {
  return (
    <button
      className={`mt-4 flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition ${
        connected
          ? "border-emerald-300/30 bg-emerald-300/[0.08] shadow-[0_0_22px_rgba(36,247,255,0.18)]"
          : "border-cyan-200/20 bg-cyan-300/[0.06] hover:border-cyan-200/35"
      }`}
      data-testid="sidebar-identity"
      onClick={onOpen}
      type="button"
    >
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-cyan-200/30 shadow-neonCyan"
        data-testid="sidebar-profile-avatar"
        style={{ background: avatarPreviewForId(avatarId) }}
      >
        <UserRound className="text-white/90" size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100/55">
            Profile
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${
              connected
                ? "border border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
                : "border border-cyan-200/25 bg-cyan-300/10 text-cyan-100"
            }`}
            data-testid="sidebar-online-badge"
          >
            {connected ? "Online+" : "Offline"}
          </span>
        </span>
        <span className="mt-1 block truncate text-sm font-bold text-white">
          {connected ? label : "Connect wallet"}
        </span>
      </span>
    </button>
  );
}
