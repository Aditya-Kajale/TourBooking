import { Users } from 'lucide-react';

interface Props {
  max_people: number;
  bookings_count?: number;
  is_housefull?: boolean;
  size?: 'sm' | 'md';
}

export function SeatBadge({ max_people, bookings_count = 0, is_housefull, size = 'sm' }: Props) {
  const filled = bookings_count;
  const total = max_people || 0;
  const left = Math.max(0, total - filled);
  const housefull = is_housefull || left === 0;
  const pct = total > 0 ? Math.min(100, Math.round((filled / total) * 100)) : 0;

  const textSm = size === 'sm' ? 'text-xs' : 'text-sm';

  if (housefull) {
    return (
      <span className={`inline-flex items-center gap-1 ${textSm} font-bold bg-destructive/10 text-destructive px-2 py-0.5 rounded-full border border-destructive/20`}>
        <Users className="w-3 h-3" /> Housefull
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${textSm} font-semibold text-muted-foreground`}
      title={`${filled} booked, ${left} available`}
    >
      <Users className="w-3.5 h-3.5 text-primary shrink-0" />
      <span className="text-foreground font-bold">{left}</span>
      <span>/ {total} left</span>
    </span>
  );
}
