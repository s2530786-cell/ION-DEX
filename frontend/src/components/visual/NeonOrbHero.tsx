type NeonOrbHeroProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  testId?: string;
};

const sizeMap = {
  sm: "h-24 w-24 sm:h-28 sm:w-28",
  md: "h-32 w-32 sm:h-40 sm:w-40",
  lg: "h-44 w-44 sm:h-56 sm:w-56",
} as const;

export function NeonOrbHero({ className = "", size = "lg", testId }: NeonOrbHeroProps) {
  return (
    <div
      aria-hidden
      className={`neon-orb-hero ${sizeMap[size]} ${className}`.trim()}
      data-testid={testId}
    >
      <span className="neon-orb-glow" />
      <span className="neon-orb-ring neon-orb-ring-outer" />
      <span className="neon-orb-ring neon-orb-ring-inner" />
      <span className="neon-orb-core" />
    </div>
  );
}
