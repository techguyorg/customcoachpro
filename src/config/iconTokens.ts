export const iconTokens = {
  neutral: {
    icon: "text-icon-neutral",
    background: "bg-icon-neutral/10",
  },
  brand: {
    icon: "text-icon-brand",
    background: "bg-icon-brand/10",
  },
  warning: {
    icon: "text-icon-warning",
    background: "bg-icon-warning/10",
  },
  workout: {
    icon: "text-icon-workout",
    background: "bg-icon-workout/10",
  },
  diet: {
    icon: "text-icon-diet",
    background: "bg-icon-diet/10",
  },
  analytics: {
    icon: "text-icon-analytics",
    background: "bg-icon-analytics/10",
  },
  success: {
    icon: "text-icon-success",
    background: "bg-icon-success/10",
  },
};

export type IconToken = keyof typeof iconTokens;
