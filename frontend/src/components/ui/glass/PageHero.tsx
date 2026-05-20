import type { LucideIcon } from "lucide-react";
import { NeonCard } from "@/components/ui/NeonCard";
import { MetricTile } from "@/components/ui/glass/MetricTile";

type HeroMetric = {
  label: string;
  value: string;
  tone?: "cyan" | "magenta" | "gold" | "emerald";
  testId?: string;
};

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  metrics: HeroMetric[];
};

export function PageHero({ eyebrow, title, description, icon: Icon, metrics }: PageHeroProps) {
  return (
    <NeonCard variant="mixed">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex gap-4">
          <div className="float-3d grid h-20 w-20 shrink-0 place-items-center rounded-[1.6rem] border border-cyan-200/25 bg-[linear-gradient(135deg,rgba(36,247,255,0.22),rgba(141,77,255,0.28))] text-cyan-100 shadow-neonCyan">
            <Icon size={36} />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.36em] text-cyan-200/70">{eyebrow}</p>
            <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl" data-testid="page-title">
              {title}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-cyan-100/68">{description}</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[24rem]">
          {metrics.map((metric) => (
            <MetricTile key={metric.label} {...metric} />
          ))}
        </div>
      </div>
    </NeonCard>
  );
}
