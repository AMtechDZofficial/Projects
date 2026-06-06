import { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  trend?: { value: number; label: string };
}

const colors = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', value: 'text-blue-700' },
  green: { bg: 'bg-green-50', icon: 'text-green-600', value: 'text-green-700' },
  purple: { bg: 'bg-primary-50', icon: 'text-primary-600', value: 'text-primary-700' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-600', value: 'text-orange-700' },
  red: { bg: 'bg-red-50', icon: 'text-red-600', value: 'text-red-700' }
};

export default function StatsCard({ title, value, subtitle, icon: Icon, color = 'blue', trend }: Props) {
  const c = colors[color];
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${c.value}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend && (
            <p className={`text-xs mt-2 ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center flex-shrink-0 ml-4`}>
          <Icon className={`w-6 h-6 ${c.icon}`} />
        </div>
      </div>
    </div>
  );
}
