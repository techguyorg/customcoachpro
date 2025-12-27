import { iconTokens, type IconToken } from "@/config/iconTokens";
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
  iconTone?: IconToken;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  iconTone,
  className,
}: StatCardProps) {
  const variants = {
    default: 'bg-card border-border',
    primary: 'bg-icon-brand/5 border-icon-brand/20',
    secondary: 'bg-icon-warning/5 border-icon-warning/20',
    accent: 'bg-icon-analytics/5 border-icon-analytics/20',
  };

  const iconVariants = {
    default: iconTokens.neutral,
    primary: iconTokens.brand,
    secondary: iconTokens.warning,
    accent: iconTokens.analytics,
  };

  const cardToneBorders: Record<IconToken, string> = {
    neutral: "border-icon-neutral/20",
    brand: "border-icon-brand/20",
    warning: "border-icon-warning/20",
    workout: "border-icon-workout/20",
    diet: "border-icon-diet/20",
    analytics: "border-icon-analytics/20",
    success: "border-icon-success/20",
  };

  const tone = iconTone ? iconTokens[iconTone] : iconVariants[variant];
  const cardToneClass = iconTone
    ? cn(tone.background, cardToneBorders[iconTone])
    : variants[variant];

  return (
    <div
      className={cn(
        'rounded-xl border p-6 transition-all hover:shadow-md',
        cardToneClass,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <p
              className={cn(
                'text-sm font-medium',
                trend.isPositive ? 'text-icon-success' : 'text-destructive'
              )}
            >
              {trend.isPositive ? '+' : ''}{trend.value}%
              <span className="text-muted-foreground ml-1">vs last month</span>
            </p>
          )}
        </div>
        <div className={cn('rounded-xl p-3', tone.background, tone.icon)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

export default StatCard;
