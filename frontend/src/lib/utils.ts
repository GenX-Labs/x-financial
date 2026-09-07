import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = 'RM'): string {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-MY').format(value);
}

export function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-MY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function getQualityColor(level: string): string {
  switch (level) {
    case 'excellent':
    case 'good':
      return 'text-green-600 bg-green-100';
    case 'warning':
      return 'text-yellow-600 bg-yellow-100';
    case 'poor':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

export function getInsightColor(type: string): string {
  switch (type) {
    case 'critical':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'warning':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'unusual':
      return 'text-purple-600 bg-purple-50 border-purple-200';
    case 'informational':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

export function getInsightIcon(type: string): string {
  switch (type) {
    case 'critical':
      return 'alert-triangle';
    case 'warning':
      return 'alert-circle';
    case 'unusual':
      return 'help-circle';
    case 'informational':
      return 'info';
    default:
      return 'circle';
  }
}

export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function calculateMargin(profit: number, revenue: number): number {
  if (revenue === 0) return 0;
  return (profit / revenue) * 100;
}

export function groupByPeriod(data: FinancialDataPoint[], period: 'day' | 'month' | 'quarter' | 'year'): FinancialDataPoint[] {
  const groups: Record<string, FinancialDataPoint> = {};
  
  data.forEach((point) => {
    const date = new Date(point.date);
    let key: string;
    
    switch (period) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'quarter':
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        key = `${date.getFullYear()}-Q${quarter}`;
        break;
      case 'year':
        key = String(date.getFullYear());
        break;
    }
    
    if (!groups[key]) {
      groups[key] = { ...point, date: key };
    } else {
      groups[key].revenue += point.revenue;
      groups[key].grossProfit += point.grossProfit;
      groups[key].netIncome += point.netIncome;
      if (point.cashBalance) {
        groups[key].cashBalance = (groups[key].cashBalance || 0) + point.cashBalance;
      }
    }
  });
  
  return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));
}