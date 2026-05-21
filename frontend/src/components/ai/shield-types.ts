export const ATTACK_TYPES = [
  { id: "reentrancy", name: "Reentrancy", icon: "🔄" },
  { id: "flashloan", name: "Flash Loan", icon: "⚡" },
  { id: "sandwich", name: "Sandwich", icon: "🥪" },
  { id: "oracle", name: "Oracle Manipulation", icon: "🔮" },
  { id: "access", name: "Access Control", icon: "🔑" },
  { id: "overflow", name: "Integer Overflow", icon: "💥" },
  { id: "dos", name: "Denial of Service", icon: "🚫" },
  { id: "faketoken", name: "Fake Token", icon: "🪙" },
  { id: "timestamp", name: "Timestamp Manip", icon: "⏱️" },
  { id: "quantum", name: "Quantum Attack", icon: "⚛️" },
] as const;

export type AttackStatus = { id: string; detected: number; blocked: number; lastBlock: string | null };
export type ShieldData = {
  updated: string;
  mode: "armed" | "paused";
  totalScanned: number;
  totalBlocked: number;
  testsPassed: number;
  testsTarget: number;
  attacks: AttackStatus[];
  recentBlocks: { id: string; type: string; from: string; value: string; time: string }[];
} | null;
