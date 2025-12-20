import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

type NeonColor = 'pink' | 'blue' | 'purple' | 'orange' | 'green';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  color?: NeonColor;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const colorClasses: Record<NeonColor, {
  icon: string;
  border: string;
  glow: string;
  value: string;
}> = {
  pink: {
    icon: 'text-neon-pink',
    border: 'border-neon-pink/20 hover:border-neon-pink/40',
    glow: 'bg-neon-pink/10',
    value: 'text-neon-pink',
  },
  blue: {
    icon: 'text-neon-blue',
    border: 'border-neon-blue/20 hover:border-neon-blue/40',
    glow: 'bg-neon-blue/10',
    value: 'text-neon-blue',
  },
  purple: {
    icon: 'text-neon-purple',
    border: 'border-neon-purple/20 hover:border-neon-purple/40',
    glow: 'bg-neon-purple/10',
    value: 'text-neon-purple',
  },
  orange: {
    icon: 'text-neon-orange',
    border: 'border-neon-orange/20 hover:border-neon-orange/40',
    glow: 'bg-neon-orange/10',
    value: 'text-neon-orange',
  },
  green: {
    icon: 'text-green-400',
    border: 'border-green-400/20 hover:border-green-400/40',
    glow: 'bg-green-400/10',
    value: 'text-green-400',
  },
};

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color = 'blue',
  trend,
  className,
}: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <div
      className={cn(
        'glass-card-hover p-6 rounded-2xl transition-all duration-300',
        'border-t-2',
        colors.border,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-2">
            {title}
          </p>
          <h3 className={cn(
            'text-3xl font-display tracking-wide text-glow',
            colors.value
          )}>
            {value}
          </h3>
          {description && (
            <p className="text-sm text-gray-400 mt-2">{description}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  'text-xs font-mono',
                  trend.isPositive ? 'text-green-400' : 'text-red-400'
                )}
              >
                {trend.isPositive ? '▲' : '▼'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500">vs last period</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            'border border-white/10',
            colors.glow
          )}>
            <Icon className={cn('h-6 w-6', colors.icon)} />
          </div>
        )}
      </div>
    </div>
  );
}
