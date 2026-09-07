from typing import List, Dict, Any
from app.models.schemas import FinancialDataPoint, QualityAssessment, QualityLevel
from datetime import datetime
import numpy as np

class QualityAssessor:
    def __init__(self):
        self.min_data_points = 3
        self.required_fields = ['revenue', 'gross_profit', 'net_income']
    
    def assess(self, data: List[FinancialDataPoint]) -> QualityAssessment:
        """Assess data quality and return score with details"""
        if not data:
            return QualityAssessment(
                score=0,
                level=QualityLevel.POOR,
                issues=["No data extracted from file"],
                details={
                    "completeness": 0,
                    "consistency": 0,
                    "validity": 0,
                    "timeliness": 0,
                }
            )
        
        issues = []
        
        # Completeness check
        completeness_score, completeness_issues = self._check_completeness(data)
        issues.extend(completeness_issues)
        
        # Consistency check
        consistency_score, consistency_issues = self._check_consistency(data)
        issues.extend(consistency_issues)
        
        # Validity check
        validity_score, validity_issues = self._check_validity(data)
        issues.extend(validity_issues)
        
        # Timeliness check
        timeliness_score, timeliness_issues = self._check_timeliness(data)
        issues.extend(timeliness_issues)
        
        # Overall score (weighted)
        overall_score = int(
            completeness_score * 0.3 +
            consistency_score * 0.3 +
            validity_score * 0.25 +
            timeliness_score * 0.15
        )
        
        # Determine level
        if overall_score >= 80:
            level = QualityLevel.EXCELLENT
        elif overall_score >= 60:
            level = QualityLevel.GOOD
        elif overall_score >= 40:
            level = QualityLevel.WARNING
        else:
            level = QualityLevel.POOR
        
        return QualityAssessment(
            score=overall_score,
            level=level,
            issues=issues,
            details={
                "completeness": completeness_score,
                "consistency": consistency_score,
                "validity": validity_score,
                "timeliness": timeliness_score,
            }
        )
    
    def _check_completeness(self, data: List[FinancialDataPoint]) -> tuple:
        """Check data completeness"""
        issues = []
        score = 100
        
        # Check minimum data points
        if len(data) < self.min_data_points:
            issues.append(f"Only {len(data)} data points found (minimum {self.min_data_points} recommended)")
            score -= 30
        
        # Check for missing required fields
        for field in self.required_fields:
            missing = sum(1 for d in data if getattr(d, field, 0) == 0)
            if missing > len(data) * 0.5:
                issues.append(f"Field '{field}' missing in {missing}/{len(data)} records")
                score -= 15
        
        # Check for gaps in time series
        if len(data) > 1:
            dates = [datetime.strptime(d.date, '%Y-%m-%d') for d in data]
            dates.sort()
            gaps = []
            for i in range(1, len(dates)):
                diff = (dates[i] - dates[i-1]).days
                if diff > 90:  # More than 3 months gap
                    gaps.append(diff)
            if gaps:
                issues.append(f"Found {len(gaps)} significant time gaps in data")
                score -= min(10 * len(gaps), 20)
        
        return max(0, score), issues
    
    def _check_consistency(self, data: List[FinancialDataPoint]) -> tuple:
        """Check internal consistency"""
        issues = []
        score = 100
        
        # Revenue >= Gross Profit >= Net Income (typically)
        violations = 0
        for d in data:
            if d.gross_profit > d.revenue and d.revenue > 0:
                violations += 1
            if d.net_income > d.gross_profit and d.gross_profit > 0:
                violations += 1
        
        if violations > 0:
            issues.append(f"Found {violations} records with inconsistent profit hierarchy (Revenue >= Gross Profit >= Net Income)")
            score -= min(violations * 5, 25)
        
        # Check for sudden unexplained jumps
        if len(data) > 2:
            for field in ['revenue', 'gross_profit', 'net_income']:
                values = [getattr(d, field) for d in data]
                if all(v > 0 for v in values):
                    pct_changes = []
                    for i in range(1, len(values)):
                        if values[i-1] != 0:
                            pct = abs((values[i] - values[i-1]) / values[i-1]) * 100
                            pct_changes.append(pct)
                    
                    if pct_changes:
                        avg_change = np.mean(pct_changes)
                        std_change = np.std(pct_changes)
                        # Flag if any change > 3 standard deviations from mean
                        outliers = sum(1 for pct in pct_changes if pct > avg_change + 3 * std_change)
                        if outliers > 0:
                            issues.append(f"Found {outliers} unusual spikes in {field}")
                            score -= min(outliers * 5, 15)
        
        return max(0, score), issues
    
    def _check_validity(self, data: List[FinancialDataPoint]) -> tuple:
        """Check data validity"""
        issues = []
        score = 100
        
        # Check for negative values where inappropriate
        negative_revenue = sum(1 for d in data if d.revenue < 0)
        if negative_revenue > 0:
            issues.append(f"Found {negative_revenue} records with negative revenue")
            score -= min(negative_revenue * 10, 30)
        
        # Check for zero values in critical fields
        zero_revenue = sum(1 for d in data if d.revenue == 0)
        if zero_revenue > len(data) * 0.3:
            issues.append(f"Revenue is zero in {zero_revenue}/{len(data)} records")
            score -= 20
        
        # Check margins are reasonable
        for d in data:
            if d.revenue > 0:
                gross_margin = (d.gross_profit / d.revenue) * 100
                net_margin = (d.net_income / d.revenue) * 100
                
                if gross_margin > 100:
                    issues.append(f"Gross margin exceeds 100% on {d.date} ({gross_margin:.1f}%)")
                    score -= 10
                if net_margin > 100:
                    issues.append(f"Net margin exceeds 100% on {d.date} ({net_margin:.1f}%)")
                    score -= 10
                if gross_margin < -50:
                    issues.append(f"Gross margin below -50% on {d.date} ({gross_margin:.1f}%)")
                    score -= 10
        
        return max(0, score), issues
    
    def _check_timeliness(self, data: List[FinancialDataPoint]) -> tuple:
        """Check data timeliness"""
        issues = []
        score = 100
        
        if not data:
            return 0, ["No data to assess timeliness"]
        
        # Check if data is recent
        try:
            latest_date = max(datetime.strptime(d.date, '%Y-%m-%d') for d in data)
            days_old = (datetime.now() - latest_date).days
            
            if days_old > 365:
                issues.append(f"Latest data is {days_old} days old (over a year)")
                score -= 20
            elif days_old > 180:
                issues.append(f"Latest data is {days_old} days old (over 6 months)")
                score -= 10
            elif days_old > 90:
                issues.append(f"Latest data is {days_old} days old (over 3 months)")
                score -= 5
        except:
            issues.append("Could not parse dates for timeliness check")
            score -= 10
        
        return max(0, score), issues


assessor = QualityAssessor()

def assess_quality(data: List[FinancialDataPoint]) -> QualityAssessment:
    return assessor.assess(data)