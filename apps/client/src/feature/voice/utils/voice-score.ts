export interface VoiceScoreMeta {
  badgeClassName: string;
}

export function getVoiceScoreMeta(score?: number): VoiceScoreMeta {
  if (typeof score !== "number") {
    return {
      badgeClassName: "border-slate-200 bg-slate-50 text-slate-600",
    };
  }

  if (score > 0.9) {
    return {
      badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (score >= 0.7) {
    return {
      badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    badgeClassName: "border-rose-200 bg-rose-50 text-rose-700",
  };
}
