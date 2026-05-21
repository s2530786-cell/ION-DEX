export const ATTACK_TYPES = [
  { id: "reentrancy", name: "Reentrancy" },
  { id: "flashloan", name: "Flash Loan" },
  { id: "sandwich", name: "Sandwich" },
  { id: "oracle", name: "Oracle Manipulation" },
  { id: "access", name: "Access Control" },
  { id: "overflow", name: "Integer Overflow" },
  { id: "dos", name: "Denial of Service" },
  { id: "faketoken", name: "Fake Token" },
  { id: "timestamp", name: "Timestamp Manip" },
  { id: "quantum", name: "Quantum Attack" },
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
