'use client';

import type { ConfidenceTier } from '@/types/location';

const TIER_STYLES: Record<ConfidenceTier, string> = {
  high: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  low: 'bg-red-100 text-red-800 border-red-200',
};

const TIER_DOTS: Record<ConfidenceTier, string> = {
  high: 'bg-green-500',
  medium: 'bg-amber-500',
  low: 'bg-red-500',
};

export function ConfidenceBadge({ tier, label }: { tier: ConfidenceTier; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${TIER_STYLES[tier]}`}>
      <span className={`w-2 h-2 rounded-full ${TIER_DOTS[tier]}`} />
      {label}
    </span>
  );
}
