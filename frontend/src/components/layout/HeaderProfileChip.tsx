import { UserRound, Wallet } from "lucide-react";
import { NeonButton } from "@/components/ui/NeonButton";
import { avatarPreviewForId } from "@/lib/profileAvatar";

type HeaderProfileChipProps = {
  connected: boolean;
  label: string;
  avatarId: string;
  expanded: boolean;
  onToggle: () => void;
};

export function HeaderProfileChip({
  connected,
  label,
  avatarId,
  expanded,
  onToggle,
}: HeaderProfileChipProps) {
  return (
    <NeonButton
      aria-expanded={expanded}
      aria-label={connected ? "Open profile hub" : "Wallet Connect"}
      className={`flex items-center gap-2 px-3 py-2 sm:px-4 ${
        connected
          ? "shadow-[0_0_28px_rgba(255,59,212,0.35),0_0_18px_rgba(141,77,255,0.28)] ring-1 ring-fuchsia-300/35"
          : ""
      }`}
      data-testid="wallet-connect"
      onClick={onToggle}
      type="button"
    >
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-cyan-200/35 shadow-[0_0_14px_rgba(36,247,255,0.35)]"
        data-testid="header-profile-avatar"
        style={{ background: avatarPreviewForId(avatarId) }}
      >
        {connected ? (
          <UserRound className="text-white/95" size={16} />
        ) : (
          <Wallet className="text-white/90" size={16} />
        )}
      </span>
      <span className="max-w-[8.5rem] truncate text-xs font-bold sm:max-w-[10rem]">{label}</span>
    </NeonButton>
  );
}
