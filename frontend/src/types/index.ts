export interface FinancialDataPoint {
  date: string;
  revenue: number;
  grossProfit: number;
  netIncome: number;
  cashBalance?: number;
  operatingExpenses?: number;
}

export interface UploadedDataset {
  id: string;
  userId: string;
  fileName: string;
  fileType: 'pdf' | 'xlsx';
  uploadedAt: string;
  data: FinancialDataPoint[];
  qualityScore: number;
  qualityLevel: 'excellent' | 'good' | 'warning' | 'poor';
  qualityIssues: string[];
  analysis?: AnalysisResult;
}

export interface QualityAssessment {
  score: number;
  level: 'excellent' | 'good' | 'warning' | 'poor';
  issues: string[];
  details: {
    completeness: number;
    consistency: number;
    validity: number;
    timeliness: number;
  };
}

export interface AnalysisResult {
  priorityScore: number;
  insights: Insight[];
  charts: ChartData;
  summary: string;
  suggestions: Suggestion[];
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
}

export interface Insight {
  id: string;
  type: 'critical' | 'warning' | 'unusual' | 'informational';
  title: string;
  description: string;
  reason: string;
  impact: string;
  confidence: number;
  dataPoints: string[];
}

export interface ChartData {
  growthEngine: GrowthEngineData[];
  profitabilityGap: ProfitabilityGapData[];
  cashRunway: CashRunwayData[];
}

export interface GrowthEngineData {
  period: string;
  revenue: number;
  netIncome: number;
}

export interface ProfitabilityGapData {
  period: string;
  grossMargin: number;
  netMargin: number;
}

export interface CashRunwayData {
  period: string;
  monthsRemaining: number;
}

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  reasoning: string;
  whatIfNothing: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  datasetId?: string;
}

export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}

export interface TimeRange {
  value: 'day' | 'month' | 'quarter' | 'year';
  label: string;
}