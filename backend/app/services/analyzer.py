from typing import List, Dict, Any, Optional
import numpy as np
from datetime import datetime
import uuid
import google.generativeai as genai
from app.models.schemas import (
    FinancialDataPoint, AnalysisResult, Insight, InsightType, 
    ChartData, GrowthEngineData, ProfitabilityGapData, CashRunwayData,
    Suggestion, RiskLevel, QualityLevel
)
from app.services.quality import assess_quality
from app.core.config import settings

class FinancialAnalyzer:
    def __init__(self):
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel('gemini-pro')
        else:
            self.model = None
    
    def analyze(self, data: List[FinancialDataPoint], time_range: str = 'month') -> AnalysisResult:
        """Perform comprehensive financial analysis"""
        # Group data by period
        grouped = self._group_by_period(data, time_range)
        
        # Generate charts
        charts = self._generate_charts(grouped)
        
        # Detect insights
        insights = self._detect_insights(grouped, data)
        
        # Calculate priority score
        priority_score = self._calculate_priority_score(insights, grouped)
        
        # Determine risk level
        risk_level = self._determine_risk_level(priority_score, insights)
        
        # Generate summary
        summary = self._generate_summary(grouped, insights, risk_level)
        
        # Generate suggestions
        suggestions = self._generate_suggestions(insights, grouped, risk_level)
        
        return AnalysisResult(
            priority_score=priority_score,
            insights=insights,
            charts=charts,
            summary=summary,
            suggestions=suggestions,
            risk_level=risk_level
        )
    
    def _group_by_period(self, data: List[FinancialDataPoint], period: str) -> List[FinancialDataPoint]:
        """Group data by time period"""
        if not data:
            return []
        
        groups: Dict[str, FinancialDataPoint] = {}
        
        for point in data:
            try:
                dt = datetime.strptime(point.date, '%Y-%m-%d')
                if period == 'day':
                    key = dt.strftime('%Y-%m-%d')
                elif period == 'month':
                    key = dt.strftime('%Y-%m')
                elif period == 'quarter':
                    quarter = (dt.month - 1) // 3 + 1
                    key = f"{dt.year}-Q{quarter}"
                elif period == 'year':
                    key = str(dt.year)
                else:
                    key = dt.strftime('%Y-%m')
            except:
                key = point.date
            
            if key not in groups:
                groups[key] = FinancialDataPoint(
                    date=key,
                    revenue=0,
                    gross_profit=0,
                    net_income=0,
                    cash_balance=0,
                    operating_expenses=0
                )
            
            groups[key].revenue += point.revenue
            groups[key].gross_profit += point.gross_profit
            groups[key].net_income += point.net_income
            if point.cash_balance:
                groups[key].cash_balance = (groups[key].cash_balance or 0) + point.cash_balance
            if point.operating_expenses:
                groups[key].operating_expenses = (groups[key].operating_expenses or 0) + point.operating_expenses
        
        # Convert to list and sort
        result = list(groups.values())
        result.sort(key=lambda x: x.date)
        return result
    
    def _generate_charts(self, grouped: List[FinancialDataPoint]) -> ChartData:
        """Generate three specialized charts"""
        # Chart A: Growth Engine (Revenue vs Net Income)
        growth_engine = [
            GrowthEngineData(
                period=p.date,
                revenue=p.revenue,
                net_income=p.net_income
            )
            for p in grouped
        ]
        
        # Chart B: Profitability Safety Gap (Gross Margin vs Net Margin %)
        profitability_gap = []
        for p in grouped:
            if p.revenue > 0:
                gross_margin = (p.gross_profit / p.revenue) * 100
                net_margin = (p.net_income / p.revenue) * 100
            else:
                gross_margin = 0
                net_margin = 0
            profitability_gap.append(ProfitabilityGapData(
                period=p.date,
                gross_margin=round(gross_margin, 2),
                net_margin=round(net_margin, 2)
            ))
        
        # Chart C: Cash Runway Horizon
        cash_runway = []
        for p in grouped:
            months = 0
            if p.cash_balance and p.cash_balance > 0 and p.operating_expenses and p.operating_expenses > 0:
                monthly_burn = p.operating_expenses
                months = p.cash_balance / monthly_burn
            elif p.net_income < 0 and p.cash_balance and p.cash_balance > 0:
                # If no operating expenses, use net loss as burn rate
                months = p.cash_balance / abs(p.net_income)
            cash_runway.append(CashRunwayData(
                period=p.date,
                months_remaining=round(months, 1)
            ))
        
        return ChartData(
            growth_engine=growth_engine,
            profitability_gap=profitability_gap,
            cash_runway=cash_runway
        )
    
    def _detect_insights(self, grouped: List[FinancialDataPoint], raw_data: List[FinancialDataPoint]) -> List[Insight]:
        """Detect patterns, trends, anomalies, and risks"""
        insights = []
        
        if len(grouped) < 2:
            return insights
        
        # 1. Revenue Growth Trend
        revenue_trend = self._calculate_trend([p.revenue for p in grouped])
        if revenue_trend > 10:
            insights.append(Insight(
                id=str(uuid.uuid4()),
                type=InsightType.INFORMATIONAL,
                title="Strong Revenue Growth",
                description=f"Revenue growing at {revenue_trend:.1f}% per period",
                reason="Revenue shows consistent upward trajectory across periods",
                impact="Positive indicator of business expansion and market traction",
                confidence=0.85,
                data_points=[f"Revenue trend: +{revenue_trend:.1f}%"]
            ))
        elif revenue_trend < -10:
            insights.append(Insight(
                id=str(uuid.uuid4()),
                type=InsightType.CRITICAL,
                title="Revenue Decline Detected",
                description=f"Revenue declining at {abs(revenue_trend):.1f}% per period",
                reason="Revenue shows consistent downward trajectory",
                impact="Threatens business viability if trend continues",
                confidence=0.9,
                data_points=[f"Revenue trend: {revenue_trend:.1f}%"]
            ))
        
        # 2. Net Income vs Revenue (Inefficient Growth)
        if len(grouped) >= 2:
            last = grouped[-1]
            prev = grouped[-2]
            if prev.revenue > 0 and last.revenue > prev.revenue:
                # Revenue increased
                if last.net_income < prev.net_income:
                    insights.append(Insight(
                        id=str(uuid.uuid4()),
                        type=InsightType.CRITICAL,
                        title="Inefficient Growth Alarm",
                        description="Revenue increased but Net Income decreased",
                        reason="Company is selling more but spending disproportionately more to acquire those sales",
                        impact="Margin erosion indicates unsustainable growth strategy",
                        confidence=0.88,
                        data_points=[
                            f"Revenue: {prev.revenue:,.0f} -> {last.revenue:,.0f}",
                            f"Net Income: {prev.net_income:,.0f} -> {last.net_income:,.0f}"
                        ]
                    ))
        
        # 3. Margin Analysis (Profitability Safety Gap)
        margins = [(p.gross_profit / p.revenue * 100) if p.revenue > 0 else 0 for p in grouped]
        net_margins = [(p.net_income / p.revenue * 100) if p.revenue > 0 else 0 for p in grouped]
        
        if len(margins) >= 2:
            gross_margin_trend = self._calculate_trend(margins)
            net_margin_trend = self._calculate_trend(net_margins)
            
            if abs(gross_margin_trend) < 5 and net_margin_trend < -5:
                insights.append(Insight(
                    id=str(uuid.uuid4()),
                    type=InsightType.WARNING,
                    title="Margin Compression - Operating Cost Creep",
                    description="Gross margin stable but net margin declining",
                    reason="Product profitability maintained but internal costs (rent, salaries, software) increasing faster than revenue",
                    impact="Eroding bottom line despite stable product economics",
                    confidence=0.82,
                    data_points=[
                        f"Gross margin trend: {gross_margin_trend:.1f}%",
                        f"Net margin trend: {net_margin_trend:.1f}%"
                    ]
                ))
        
        # 4. Cash Runway Analysis
        runway_data = [p for p in grouped if p.cash_balance and p.cash_balance > 0]
        if runway_data:
            latest = runway_data[-1]
            if latest.operating_expenses and latest.operating_expenses > 0:
                months = latest.cash_balance / latest.operating_expenses
                if months < 3:
                    insights.append(Insight(
                        id=str(uuid.uuid4()),
                        type=InsightType.CRITICAL,
                        title="Critical Cash Runway",
                        description=f"Only {months:.1f} months of cash remaining",
                        reason="Cash reserves depleting rapidly relative to burn rate",
                        impact="Imminent funding requirement or risk of insolvency",
                        confidence=0.95,
                        data_points=[f"Cash: {latest.cash_balance:,.0f}", f"Monthly burn: {latest.operating_expenses:,.0f}"]
                    ))
                elif months < 6:
                    insights.append(Insight(
                        id=str(uuid.uuid4()),
                        type=InsightType.WARNING,
                        title="Short Cash Runway",
                        description=f"{months:.1f} months of cash remaining",
                        reason="Cash runway below 6 months requires fundraising planning",
                        impact="Need to initiate fundraising or reduce burn rate",
                        confidence=0.85,
                        data_points=[f"Cash: {latest.cash_balance:,.0f}", f"Monthly burn: {latest.operating_expenses:,.0f}"]
                    ))
        
        # 5. Anomaly Detection - Sudden Changes
        for field_name, field_label in [('revenue', 'Revenue'), ('net_income', 'Net Income'), ('gross_profit', 'Gross Profit')]:
            values = [getattr(p, field_name) for p in grouped]
            if len(values) >= 3:
                anomalies = self._detect_anomalies(values)
                for idx, severity in anomalies:
                    date = grouped[idx].date
                    insights.append(Insight(
                        id=str(uuid.uuid4()),
                        type=InsightType.UNUSUAL if severity < 3 else InsightType.WARNING,
                        title=f"Unusual {field_label} Movement",
                        description=f"{field_label} showed {'significant' if severity >= 3 else 'unusual'} change in {date}",
                        reason=f"Statistical anomaly detected: {severity:.1f} standard deviations from trend",
                        impact="May indicate one-time event, data error, or structural change",
                        confidence=0.75,
                        data_points=[f"{field_label}: {values[idx]:,.0f} in {date}"]
                    ))
        
        # 6. Positive Pattern - Consistent Profitability
        profitable_periods = sum(1 for p in grouped if p.net_income > 0)
        if profitable_periods == len(grouped) and len(grouped) >= 3:
            insights.append(Insight(
                id=str(uuid.uuid4()),
                type=InsightType.INFORMATIONAL,
                title="Consistent Profitability",
                description=f"Net income positive for all {len(grouped)} periods",
                reason="Business demonstrates sustainable profitable operations",
                impact="Strong foundation for growth and investment",
                confidence=0.9,
                data_points=[f"{profitable_periods}/{len(grouped)} periods profitable"]
            ))
        
        return insights
    
    def _calculate_trend(self, values: List[float]) -> float:
        """Calculate linear trend percentage per period"""
        if len(values) < 2:
            return 0
        x = np.arange(len(values))
        y = np.array(values)
        if np.all(y == 0):
            return 0
        coeff = np.polyfit(x, y, 1)
        slope = coeff[0]
        avg = np.mean(y)
        if avg == 0:
            return 0
        return (slope / avg) * 100
    
    def _detect_anomalies(self, values: List[float], threshold: float = 2.5) -> List[tuple]:
        """Detect statistical anomalies using z-score"""
        if len(values) < 3:
            return []
        diffs = np.diff(values)
        if np.std(diffs) == 0:
            return []
        z_scores = np.abs((diffs - np.mean(diffs)) / np.std(diffs))
        anomalies = [(i + 1, z) for i, z in enumerate(z_scores) if z > threshold]
        return anomalies
    
    def _calculate_priority_score(self, insights: List[Insight], grouped: List[FinancialDataPoint]) -> int:
        """Calculate overall priority score (0-100)"""
        score = 50  # Base score
        
        for insight in insights:
            if insight.type == InsightType.CRITICAL:
                score += 15 * insight.confidence
            elif insight.type == InsightType.WARNING:
                score += 8 * insight.confidence
            elif insight.type == InsightType.UNUSUAL:
                score += 3 * insight.confidence
            elif insight.type == InsightType.INFORMATIONAL:
                score -= 5 * insight.confidence
        
        # Adjust for data quality
        if len(grouped) < 4:
            score += 10  # Less data = more uncertainty
        
        return max(0, min(100, int(score)))
    
    def _determine_risk_level(self, priority_score: int, insights: List[Insight]) -> RiskLevel:
        critical_count = sum(1 for i in insights if i.type == InsightType.CRITICAL)
        warning_count = sum(1 for i in insights if i.type == InsightType.WARNING)
        
        if critical_count >= 2 or priority_score >= 80:
            return RiskLevel.CRITICAL
        elif critical_count >= 1 or warning_count >= 2 or priority_score >= 60:
            return RiskLevel.HIGH
        elif warning_count >= 1 or priority_score >= 40:
            return RiskLevel.MEDIUM
        return RiskLevel.LOW
    
    def _generate_summary(self, grouped: List[FinancialDataPoint], insights: List[Insight], risk_level: RiskLevel) -> str:
        """Generate human-readable summary"""
        critical = [i for i in insights if i.type == InsightType.CRITICAL]
        warning = [i for i in insights if i.type == InsightType.WARNING]
        positive = [i for i in insights if i.type == InsightType.INFORMATIONAL]
        
        if risk_level in [RiskLevel.CRITICAL, RiskLevel.HIGH]:
            summary = "⚠️ **Attention Required**: "
            if critical:
                summary += f"{len(critical)} critical issue(s) detected. "
            if warning:
                summary += f"{len(warning)} warning(s) need review. "
            summary += "Immediate action recommended to address identified risks."
        else:
            summary = "✅ **Generally Healthy**: "
            if positive:
                summary += f"{len(positive)} positive indicator(s) found. "
            if warning:
                summary += f"{len(warning)} area(s) to monitor. "
            summary += "Business shows stable financial patterns with manageable risks."
        
        # Add key metrics
        if grouped:
            latest = grouped[-1]
            summary += f" Latest: Revenue {latest.revenue:,.0f}, Net Income {latest.net_income:,.0f}."
        
        return summary
    
    def _generate_suggestions(self, insights: List[Insight], grouped: List[FinancialDataPoint], risk_level: RiskLevel) -> List[Suggestion]:
        """Generate actionable recommendations"""
        suggestions = []
        
        # Critical insights -> high priority suggestions
        for insight in insights:
            if insight.type == InsightType.CRITICAL:
                if "Inefficient Growth" in insight.title:
                    suggestions.append(Suggestion(
                        id=str(uuid.uuid4()),
                        title="Audit Customer Acquisition Costs",
                        description="Review CAC, marketing spend, and sales efficiency metrics. Identify channels with negative ROI.",
                        reasoning="Revenue growth without profit growth indicates spending more to acquire customers than they're worth.",
                        what_if_nothing="Continued margin erosion leading to cash crisis despite top-line growth.",
                        priority="high"
                    ))
                elif "Cash Runway" in insight.title:
                    suggestions.append(Suggestion(
                        id=str(uuid.uuid4()),
                        title="Initiate Emergency Fundraising",
                        description="Prepare pitch deck, contact investors, and explore bridge financing options immediately.",
                        reasoning="Cash runway below critical threshold requires immediate capital infusion.",
                        what_if_nothing="Risk of insolvency and inability to meet payroll/obligations.",
                        priority="high"
                    ))
                elif "Revenue Decline" in insight.title:
                    suggestions.append(Suggestion(
                        id=str(uuid.uuid4()),
                        title="Revenue Diagnostic & Turnaround Plan",
                        description="Analyze customer churn, pipeline health, and competitive positioning. Implement retention campaigns.",
                        reasoning="Sustained revenue decline threatens business model viability.",
                        what_if_nothing="Continued decline leading to cash burn and potential shutdown.",
                        priority="high"
                    ))
        
        # Warning insights -> medium priority
        for insight in insights:
            if insight.type == InsightType.WARNING:
                if "Margin Compression" in insight.title:
                    suggestions.append(Suggestion(
                        id=str(uuid.uuid4()),
                        title="Operating Expense Review",
                        description="Audit all OpEx categories. Identify non-essential spend, renegotiate vendor contracts, optimize headcount.",
                        reasoning="Gross margin stability means product is healthy; rising OpEx is the problem.",
                        what_if_nothing="Net margins continue compressing until business becomes unprofitable.",
                        priority="medium"
                    ))
                elif "Short Cash Runway" in insight.title:
                    suggestions.append(Suggestion(
                        id=str(uuid.uuid4()),
                        title="Extend Runway & Plan Fundraise",
                        description="Reduce discretionary spend by 15-20%. Begin investor conversations for Series A/bridge round.",
                        reasoning="6-month runway requires 3-4 months to close funding.",
                        what_if_nothing="Forced down round or emergency measures under duress.",
                        priority="medium"
                    ))
        
        # Positive insights -> low priority (optimization)
        for insight in insights:
            if insight.type == InsightType.INFORMATIONAL:
                if "Strong Revenue Growth" in insight.title:
                    suggestions.append(Suggestion(
                        id=str(uuid.uuid4()),
                        title="Scale Winning Channels",
                        description="Double down on highest-ROI acquisition channels. Invest in sales capacity.",
                        reasoning="Strong growth trajectory indicates product-market fit. Capitalize on momentum.",
                        what_if_nothing="Missed opportunity to capture market share during growth window.",
                        priority="low"
                    ))
                elif "Consistent Profitability" in insight.title:
                    suggestions.append(Suggestion(
                        id=str(uuid.uuid4()),
                        title="Build Strategic Reserves",
                        description="Allocate 20% of net income to cash reserves. Consider strategic investments or M&A.",
                        reasoning="Profitable operations provide optionality for strategic moves.",
                        what_if_nothing="Vulnerable to market downturns without adequate reserves.",
                        priority="low"
                    ))
        
        # Default suggestions if none generated
        if not suggestions:
            suggestions.append(Suggestion(
                id=str(uuid.uuid4()),
                title="Implement Monthly Financial Review",
                description="Establish monthly review of revenue, margins, cash flow, and key ratios.",
                reasoning="Regular monitoring catches issues early before they become critical.",
                what_if_nothing="Blind spots develop, leading to surprise crises.",
                priority="medium"
            ))
        
        return suggestions[:5]  # Limit to 5 suggestions


analyzer = FinancialAnalyzer()

def analyze_financial_data(data: List[FinancialDataPoint], time_range: str = 'month') -> AnalysisResult:
    return analyzer.analyze(data, time_range)