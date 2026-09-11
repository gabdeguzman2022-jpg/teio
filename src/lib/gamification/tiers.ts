import { TIER_LIMITS, type Tier, type TierLimits } from "@/lib/types";

export function tierLimits(tier: Tier): TierLimits {
  return TIER_LIMITS[tier];
}

// aiMessagesPerDay === null means unlimited (see TierLimits in types.ts).
export function canUseAiTutor(tier: Tier, messagesUsedToday: number): boolean {
  const limit = tierLimits(tier).aiMessagesPerDay;
  if (limit === null) return true;
  return messagesUsedToday < limit;
}
