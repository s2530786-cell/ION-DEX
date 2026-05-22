export const PROFILE_AVATAR_SWATCHES: Record<string, string> = {
  neon: "linear-gradient(135deg, #24f7ff 0%, #8d4dff 55%, #ff3bd4 100%)",
  ember: "linear-gradient(135deg, #ff3bd4 0%, #ffd166 100%)",
  vault: "linear-gradient(135deg, #1a2a4a 0%, #24f7ff 100%)",
  aurora: "linear-gradient(135deg, #8d4dff 0%, #24f7ff 50%, #ffd166 100%)",
};

export function avatarPreviewForId(id: string): string {
  return PROFILE_AVATAR_SWATCHES[id] ?? PROFILE_AVATAR_SWATCHES.neon;
}
