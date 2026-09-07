'use client';

import { useAuth } from '@/components/AuthProvider';
import { Layout } from '@/components/Layout';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { formatCurrency, formatPercentage, cn, getInsightColor, getInsightIcon } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAnalysis, calculateMetrics } from '@/lib/api';
import {
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Info,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  BarChart2,
  LineChart,
  Calculator,
  MessageSquare,
  ArrowRight,
  Clock,
  Filter,
  X,
} from 'lucide-react';
import { Insight, Suggestion, TimeRange, GrowthEngineData, ProfitabilityGapData, CashRunwayData } from '@/types';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts';

const timeRanges: TimeRange[] = [
  { value: 'day', label: 'Daily' },
  { value: 'month', label: 'Monthly' },
  { value: 'quarter', label: 'Quarterly' },
  { value: 'year', label: 'Yearly' },
];

const insightIcons = {
  critical: AlertTriangle,
  warning: AlertCircle,
  unusual: HelpCircle,
  informational: Info,
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { currentDataset, analysis, setAnalysis, setLoading } = useAppStore();
  const [selectedRange, setSelectedRange] = useState<TimeRange['value']>('month');
  const [showWhy, setShowWhy] = useState(false);
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());
  const [calculating, setCalculating] = useState<string | null>(null);

  useEffect(() => {
    if (currentDataset && !analysis) {
      fetchAnalysis();
    }
  }, [currentDataset, selectedRange]);

  const fetchAnalysis = async () => {
    if (!currentDataset) return;
    setLoading(true);
    try {
      const result = await getAnalysis(currentDataset.id, selectedRange);
      setAnalysis(result);
    } catch (error) {
      console.error('Failed to fetch analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async (metric: string) => {
    if (!currentDataset) return;
    setCalculating(metric);
    try {
      const result = await calculateMetrics(currentDataset.id, metric);
      toast.success(`${metric}: ${result.value}`);
    } catch (error) {
      toast.error('Calculation failed');
    } finally {
      setCalculating(null);
    }
  };

  if (!currentDataset) {
    return (
      <Layout>
        <div className="text-center py-20">
          <BarChart2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Dataset Selected</h2>
          <p className="text-gray-600 mb-6">Upload a financial file to see your dashboard</p>
          <Link href="/upload">
            <Button size="lg"><Upload className="w-4 h-4 mr-2" /> Upload File</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const priorityScore = analysis?.priorityScore || 0;
  const riskLevel = analysis?.riskLevel || 'low';
  const insights = analysis?.insights || [];
  const suggestions = analysis?.suggestions || [];
  const summary = analysis?.summary || '';
  const charts = analysis?.charts;

  const getPriorityColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-green-600 bg-green-100';
  };

  const getPriorityLabel = (score: number) => {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{currentDataset.fileName}</h1>
            <p className="text-gray-600 mt-1">
              Uploaded {new Date(currentDataset.uploadedAt).toLocaleDateString()} • 
              {currentDataset.data.length} data points • Quality: {currentDataset.qualityScore}/100
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant={riskLevel === 'critical' ? 'danger' : riskLevel === 'high' ? 'warning' : riskLevel === 'medium' ? 'info' : 'success'} size="lg" dot>
              Risk: {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
            </Badge>
            <div className={cn('px-4 py-2 rounded-xl font-semibold', getPriorityColor(priorityScore))}>
              Priority: {priorityScore}/100 ({getPriorityLabel(priorityScore)})
            </div>
            <Button variant="outline" onClick={fetchAnalysis} loading={analysis === null}>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
            {timeRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => {
                  setSelectedRange(range.value);
                  fetchAnalysis();
                }}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  selectedRange === range.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Charts Section */}
        {charts && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Chart A: Growth Engine */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Growth Engine</CardTitle>
                    <p className="text-sm text-gray-500">Revenue vs Net Income</p>
                  </div>
                  <Badge variant="info" size="sm">Chart A</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.growthEngine} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="period" stroke="#9ca3af" fontSize={12} tickLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} tickFormatter={formatCurrency} />
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), '']}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#revenueGradient)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="netIncome"
                        name="Net Income"
                        stroke="#22c55e"
                        fillOpacity={1}
                        fill="url(#incomeGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {charts.growthEngine.length > 1 && (
                  <div className="mt-4 flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-500" />
                      <span>Revenue: {formatCurrency(charts.growthEngine[charts.growthEngine.length - 1].revenue)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-green-500" />
                      <span>Net Income: {formatCurrency(charts.growthEngine[charts.growthEngine.length - 1].netIncome)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chart B: Profitability Gap */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Profitability Safety Gap</CardTitle>
                    <p className="text-sm text-gray-500">Gross Margin vs Net Margin %</p>
                  </div>
                  <Badge variant="success" size="sm">Chart B</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={charts.profitabilityGap} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="period" stroke="#9ca3af" fontSize={12} tickLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} tickFormatter={(v) => `${v}%`} />
                      <Tooltip
                        formatter={(value: number) => [`${value.toFixed(2)}%`, '']}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="grossMargin"
                        name="Gross Margin %"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="netMargin"
                        name="Net Margin %"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {charts.profitabilityGap.length > 0 && (
                  <div className="mt-4 flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span>Gross: {charts.profitabilityGap[charts.profitabilityGap.length - 1].grossMargin.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500" />
                      <span>Net: {charts.profitabilityGap[charts.profitabilityGap.length - 1].netMargin.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-purple-600 font-medium">
                      <HelpCircle className="w-4 h-4" />
                      Gap: {(charts.profitabilityGap[charts.profitabilityGap.length - 1].grossMargin - charts.profitabilityGap[charts.profitabilityGap.length - 1].netMargin).toFixed(1)}%
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chart C: Cash Runway */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Cash Runway Horizon</CardTitle>
                    <p className="text-sm text-gray-500">Months of Survival</p>
                  </div>
                  <Badge variant="warning" size="sm">Chart C</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.cashRunway} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                      <XAxis type="number" domain={[0, 'dataMax + 2']} stroke="#9ca3af" fontSize={12} tickLine={false} tickFormatter={(v) => `${v} mo`} />
                      <YAxis dataKey="period" type="category" stroke="#9ca3af" fontSize={12} tickLine={false} width={80} />
                      <Tooltip
                        formatter={(value: number) => [`${value.toFixed(1)} months`, '']}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      />
                      <Bar dataKey="monthsRemaining" name="Months" radius={[4, 4, 0, 0]}>
                        <CellCallback />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {charts.cashRunway.length > 0 && (
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-orange-500" />
                      <span>Current: {charts.cashRunway[charts.cashRunway.length - 1].monthsRemaining.toFixed(1)} months</span>
                    </div>
                    {charts.cashRunway.length > 1 && (
                      <div className={cn('flex items-center gap-2 font-medium', charts.cashRunway[charts.cashRunway.length - 1].monthsRemaining > charts.cashRunway[0].monthsRemaining ? 'text-green-600' : 'text-red-600')}>
                        <TrendingUp className="w-4 h-4" />
                        {charts.cashRunway[charts.cashRunway.length - 1].monthsRemaining > charts.cashRunway[0].monthsRemaining ? 'Improving' : 'Declining'}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Why Button & Insights */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Key Insights</h2>
          <Button variant="outline" onClick={() => setShowWhy(!showWhy)} className="gap-2">
            <Lightbulb className="w-4 h-4" />
            {showWhy ? 'Hide Why' : 'Show Why'}
          </Button>
        </div>

        <AnimatePresence mode="popLayout">
          {showWhy && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-xl"
            >
              <h3 className="font-semibold text-primary-800 mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Why These Insights?
              </h3>
              <div className="space-y-2 text-sm text-primary-700">
                <p>Each insight is generated by analyzing patterns in your financial data across time periods.</p>
                <p>• <strong>Critical (Red):</strong> Immediate risk detected — revenue declining, margins collapsing, or cash runway critical</p>
                <p>• <strong>Warning (Yellow):</strong> Concerning trends — slowing growth, margin compression, or rising expenses</p>
                <p>• <strong>Unusual (Purple):</strong> Anomalies detected — sudden spikes/drops, outliers, or pattern breaks</p>
                <p>• <strong>Informational (Blue):</strong> Positive patterns — healthy growth, stable margins, strong cash position</p>
                <p>Confidence scores reflect statistical significance and data quality.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Insights List */}
        <AnimatePresence mode="popLayout">
          {insights.length > 0 ? (
            <div className="space-y-4">
              {insights.map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  isExpanded={expandedInsights.has(insight.id)}
                  onToggle={() => {
                    setExpandedInsights(prev => {
                      const next = new Set(prev);
                      if (next.has(insight.id)) next.delete(insight.id);
                      else next.add(insight.id);
                      return next;
                    });
                  }}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Info className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">No insights generated yet. Run analysis to see insights.</p>
              </CardContent>
            </Card>
          )}
        </AnimatePresence>

        {/* Summary */}
        {summary && (
          <Card className={cn('border-l-4', 
            summary.toLowerCase().includes('positive') || summary.toLowerCase().includes('good') || summary.toLowerCase().includes('healthy') 
              ? 'border-green-500 bg-green-50' 
              : 'border-yellow-500 bg-yellow-50'
          )}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{summary}</p>
            </CardContent>
          </Card>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recommendations</h2>
            <div className="space-y-4">
              {suggestions.map((suggestion) => (
                <SuggestionCard key={suggestion.id} suggestion={suggestion} />
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Calculations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => handleCalculate('totalRevenue')} loading={calculating === 'totalRevenue'}>
                <Calculator className="w-4 h-4" />
                Total Revenue
              </Button>
              <Button variant="outline" onClick={() => handleCalculate('totalNetIncome')} loading={calculating === 'totalNetIncome'}>
                <Calculator className="w-4 h-4" />
                Total Net Income
              </Button>
              <Button variant="outline" onClick={() => handleCalculate('avgGrossMargin')} loading={calculating === 'avgGrossMargin'}>
                <Calculator className="w-4 h-4" />
                Avg Gross Margin
              </Button>
              <Button variant="outline" onClick={() => handleCalculate('avgNetMargin')} loading={calculating === 'avgNetMargin'}>
                <Calculator className="w-4 h-4" />
                Avg Net Margin
              </Button>
              <Button variant="outline" onClick={() => handleCalculate('revenueGrowth')} loading={calculating === 'revenueGrowth'}>
                <TrendingUp className="w-4 h-4" />
                Revenue Growth
              </Button>
              <Link href={`/chat?dataset=${currentDataset.id}`}>
                <Button variant="primary">
                  <MessageSquare className="w-4 h-4" />
                  Ask AI Copilot
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  );
}

// Helper components
function InsightCard({ insight, isExpanded, onToggle }: { insight: Insight; isExpanded: boolean; onToggle: () => void }) {
  const Icon = insightIcons[insight.type];
  return (
    <Card className={cn('border-l-4 transition-all', getInsightColor(insight.type).replace('bg-', 'border-'))}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', getInsightColor(insight.type).replace('border-', 'bg-'))}>
            <Icon className={cn('w-5 h-5', getInsightColor(insight.type).replace('bg-', 'text-').replace('border-', ''))} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">{insight.title}</h4>
              <div className="flex items-center gap-2">
                <Badge variant={insight.type === 'critical' ? 'danger' : insight.type === 'warning' ? 'warning' : insight.type === 'unusual' ? 'purple' : 'info'} size="sm">
                  {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
                </Badge>
                <Badge variant="default" size="sm">
                  {Math.round(insight.confidence * 100)}% confidence
                </Badge>
                <Button variant="ghost" size="sm" onClick={onToggle} className="p-1">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <p className="text-gray-600 mt-1">{insight.description}</p>
            
            <AnimatePresence mode="popLayout">
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-3 pt-4 border-t border-gray-100"
                >
                  <div className="flex items-start gap-2 text-sm">
                    <Target className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Reason</p>
                      <p className="text-gray-600">{insight.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <TrendingDown className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Impact</p>
                      <p className="text-gray-600">{insight.impact}</p>
                    </div>
                  </div>
                  {insight.dataPoints.length > 0 && (
                    <div className="flex items-start gap-2 text-sm">
                      <BarChart2 className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">Data Points</p>
                        <p className="text-gray-600">{insight.dataPoints.join(', ')}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const priorityColors = {
    high: 'border-red-500 bg-red-50',
    medium: 'border-yellow-500 bg-yellow-50',
    low: 'border-blue-500 bg-blue-50',
  };
  return (
    <Card className={cn('border-l-4', priorityColors[suggestion.priority])}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">{suggestion.title}</h4>
              <Badge variant={suggestion.priority === 'high' ? 'danger' : suggestion.priority === 'medium' ? 'warning' : 'info'} size="sm">
                {suggestion.priority.charAt(0).toUpperCase() + suggestion.priority.slice(1)} Priority
              </Badge>
            </div>
            <p className="text-gray-600 mt-1">{suggestion.description}</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="font-medium text-gray-900">Reasoning:</span>
                <span className="text-gray-600">{suggestion.reasoning}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium text-gray-900">If you do nothing:</span>
                <span className="text-gray-600">{suggestion.whatIfNothing}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Cell component for BarChart
function CellCallback({ cell }: { cell: any }) {
  const value = cell.props.cy;
  const color = value < 3 ? '#ef4444' : value < 6 ? '#f59e0b' : '#22c55e';
  return <rect {...cell.props} fill={color} />;
}

// Import toast
import { toast } from 'react-hot-toast';
import { Upload } from 'lucide-react';