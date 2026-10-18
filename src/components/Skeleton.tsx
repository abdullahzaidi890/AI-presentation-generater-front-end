export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} aria-hidden="true" />
)
