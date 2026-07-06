import type React from "react";
import { BookOpen, RefreshCcw } from "lucide-react";
import { motion } from "motion/react";

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  tone?: "primary" | "secondary" | "action" | "neutral";
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  tone = "primary",
  primaryAction,
  secondaryAction,
  compact = false,
}: EmptyStateProps) {
  const toneStyles = {
    primary: {
      shell: "border-[#800020]/15 bg-[#800020]/[0.03]",
      icon: "bg-[#800020] text-white shadow-[#800020]/20",
      ring: "bg-[#800020]/10",
      accent: "bg-[#800020]",
    },
    secondary: {
      shell: "border-[#264653]/15 bg-[#264653]/[0.035]",
      icon: "bg-[#264653] text-white shadow-[#264653]/20",
      ring: "bg-[#264653]/10",
      accent: "bg-[#264653]",
    },
    action: {
      shell: "border-amber-300/40 bg-amber-50/70",
      icon: "bg-amber-500 text-slate-950 shadow-amber-500/20",
      ring: "bg-amber-200/60",
      accent: "bg-amber-500",
    },
    neutral: {
      shell: "border-slate-200 bg-white",
      icon: "bg-slate-800 text-white shadow-slate-800/15",
      ring: "bg-slate-100",
      accent: "bg-slate-400",
    },
  }[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`relative overflow-hidden rounded-3xl border ${toneStyles.shell} ${compact ? "px-5 py-7" : "px-6 py-14"} text-center shadow-sm`}
    >
      <div className={`absolute left-0 top-0 h-1.5 w-full ${toneStyles.accent}`} />
      <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
        <div className={`absolute inset-0 rounded-3xl ${toneStyles.ring} rotate-6`} />
        <div className={`relative flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg ${toneStyles.icon}`}>
          <Icon className="h-8 w-8" />
        </div>
      </div>
      <h4 className={`${compact ? "text-lg" : "text-2xl"} font-bold text-slate-950`}>{title}</h4>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600">{description}</p>
      {(primaryAction || secondaryAction) && (
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#800020] px-5 py-3 text-xs font-bold text-white shadow-sm shadow-[#800020]/20 transition-colors hover:bg-[#5C0016] sm:w-auto"
            >
              <RefreshCcw className="h-4 w-4" />
              <span>{primaryAction.label}</span>
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#264653]/20 bg-white px-5 py-3 text-xs font-bold text-[#264653] transition-colors hover:bg-[#264653]/5 sm:w-auto"
            >
              <BookOpen className="h-4 w-4" />
              <span>{secondaryAction.label}</span>
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
