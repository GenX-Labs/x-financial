from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime
from enum import Enum

class FileType(str, Enum):
    PDF = "pdf"
    XLSX = "xlsx"
    XLS = "xls"

class QualityLevel(str, Enum):
    EXCELLENT = "excellent"
    GOOD = "good"
    WARNING = "warning"
    POOR = "poor"

class InsightType(str, Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    UNUSUAL = "unusual"
    INFORMATIONAL = "informational"

class RiskLevel(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class FinancialDataPoint(BaseModel):
    date: str
    revenue: float
    gross_profit: float
    net_income: float
    cash_balance: Optional[float] = None
    operating_expenses: Optional[float] = None

class QualityAssessment(BaseModel):
    score: int = Field(ge=0, le=100)
    level: QualityLevel
    issues: List[str]
    details: dict

class Insight(BaseModel):
    id: str
    type: InsightType
    title: str
    description: str
    reason: str
    impact: str
    confidence: float = Field(ge=0, le=1)
    data_points: List[str]

class GrowthEngineData(BaseModel):
    period: str
    revenue: float
    net_income: float

class ProfitabilityGapData(BaseModel):
    period: str
    gross_margin: float
    net_margin: float

class CashRunwayData(BaseModel):
    period: str
    months_remaining: float

class ChartData(BaseModel):
    growth_engine: List[GrowthEngineData]
    profitability_gap: List[ProfitabilityGapData]
    cash_runway: List[CashRunwayData]

class Suggestion(BaseModel):
    id: str
    title: str
    description: str
    reasoning: str
    what_if_nothing: str
    priority: Literal["high", "medium", "low"]

class AnalysisResult(BaseModel):
    priority_score: int = Field(ge=0, le=100)
    insights: List[Insight]
    charts: ChartData
    summary: str
    suggestions: List[Suggestion]
    risk_level: RiskLevel

class UploadedDataset(BaseModel):
    id: str
    user_id: str
    file_name: str
    file_type: FileType
    uploaded_at: datetime
    data: List[FinancialDataPoint]
    quality_score: int
    quality_level: QualityLevel
    quality_issues: List[str]
    analysis: Optional[AnalysisResult] = None

class ChatMessage(BaseModel):
    id: str
    role: Literal["user", "assistant"]
    content: str
    timestamp: datetime
    dataset_id: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    dataset_id: str
    history: List[ChatMessage] = []

class ChatResponse(BaseModel):
    message: str

class CalculateRequest(BaseModel):
    dataset_id: str
    metric: str

class CalculateResponse(BaseModel):
    metric: str
    value: float
    formatted: str