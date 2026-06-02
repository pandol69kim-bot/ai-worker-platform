import { cn, getCategoryVisual } from "@/lib/utils";

interface CategoryThumbnailProps {
  category: string;
  className?: string;
  compact?: boolean;
}

export function CategoryThumbnail({ category, className, compact = false }: CategoryThumbnailProps) {
  const visual = getCategoryVisual(category);

  if (compact) {
    return (
      <div className={cn("relative overflow-hidden rounded-xl", visual.thumbnailClass, className)}>
        <div className="absolute inset-0 bg-white/55" />
        <div className="relative flex h-full items-center justify-center text-3xl leading-none">
          {visual.icon}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", visual.thumbnailClass, className)}>
      <div className="absolute inset-0 bg-white/40" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.88),transparent_42%)]" />
      <div className="relative flex h-full flex-col justify-between p-4">
        <span className="text-4xl leading-none drop-shadow-sm">{visual.icon}</span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500/80">
            {visual.label}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-700/85 line-clamp-2">
            {visual.description}
          </p>
        </div>
      </div>
    </div>
  );
}