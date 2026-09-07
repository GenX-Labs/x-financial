import pandas as pd
import pdfplumber
import io
import re
from typing import List, Dict, Any, Optional
from app.models.schemas import FinancialDataPoint, FileType

class DataExtractor:
    def __init__(self):
        self.date_patterns = [
            r'\d{4}-\d{2}-\d{2}',
            r'\d{2}/\d{2}/\d{4}',
            r'\d{2}-\d{2}-\d{4}',
            r'\d{4}/\d{2}/\d{2}',
            r'[A-Za-z]{3}\s+\d{4}',
            r'[A-Za-z]{3}\s+\d{1,2},\s+\d{4}',
            r'Q[1-4]\s+\d{4}',
            r'\d{4}',
        ]
        
        self.financial_keywords = {
            'revenue': ['revenue', 'sales', 'turnover', 'income', 'total revenue', 'net sales'],
            'gross_profit': ['gross profit', 'gross income', 'gross margin'],
            'net_income': ['net income', 'net profit', 'profit after tax', 'net earnings', 'bottom line'],
            'cash_balance': ['cash', 'cash balance', 'cash & equivalents', 'cash and cash equivalents'],
            'operating_expenses': ['operating expenses', 'opex', 'operating costs', 'total expenses'],
        }

    def extract_from_pdf(self, file_content: bytes) -> List[Dict[str, Any]]:
        """Extract financial data from PDF using pdfplumber"""
        data = []
        try:
            with pdfplumber.open(io.BytesIO(file_content)) as pdf:
                for page in pdf.pages:
                    tables = page.extract_tables()
                    for table in tables:
                        if table and len(table) > 1:
                            parsed = self._parse_table(table)
                            data.extend(parsed)
                    
                    # Also try text extraction for non-table data
                    text = page.extract_text()
                    if text:
                        parsed_text = self._parse_text(text)
                        data.extend(parsed_text)
        except Exception as e:
            print(f"PDF extraction error: {e}")
        return data

    def extract_from_excel(self, file_content: bytes) -> List[Dict[str, Any]]:
        """Extract financial data from Excel"""
        data = []
        try:
            df = pd.read_excel(io.BytesIO(file_content), header=None)
            parsed = self._parse_dataframe(df)
            data.extend(parsed)
        except Exception as e:
            print(f"Excel extraction error: {e}")
        return data

    def _parse_table(self, table: List[List]) -> List[Dict[str, Any]]:
        """Parse a table into financial data points"""
        if not table or len(table) < 2:
            return []
        
        # Find header row
        header_row = None
        for i, row in enumerate(table):
            if row and any(cell and isinstance(cell, str) for cell in row):
                header_row = i
                break
        
        if header_row is None:
            return []
        
        headers = [str(cell).lower().strip() if cell else '' for cell in table[header_row]]
        
        # Map columns
        col_map = self._map_columns(headers)
        if not col_map.get('date'):
            return []
        
        results = []
        for row in table[header_row + 1:]:
            if not row:
                continue
            point = self._extract_row_data(row, col_map)
            if point:
                results.append(point)
        
        return results

    def _parse_dataframe(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Parse pandas DataFrame"""
        # Convert to list of lists
        table = df.fillna('').values.tolist()
        return self._parse_table(table)

    def _map_columns(self, headers: List[str]) -> Dict[str, int]:
        """Map column headers to financial fields"""
        col_map = {}
        for i, header in enumerate(headers):
            header_lower = header.lower()
            for field, keywords in self.financial_keywords.items():
                if any(kw in header_lower for kw in keywords):
                    col_map[field] = i
                    break
            # Check for date column
            if not col_map.get('date'):
                if any(kw in header_lower for kw in ['date', 'period', 'month', 'year', 'quarter', 'time']):
                    col_map['date'] = i
        return col_map

    def _extract_row_data(self, row: List, col_map: Dict[str, int]) -> Optional[Dict[str, Any]]:
        """Extract data from a single row"""
        try:
            date_val = row[col_map.get('date', 0)] if col_map.get('date') is not None and col_map['date'] < len(row) else None
            if not date_val:
                return None
            
            date_str = self._normalize_date(str(date_val))
            if not date_str:
                return None
            
            def get_val(field: str) -> float:
                idx = col_map.get(field)
                if idx is not None and idx < len(row) and row[idx]:
                    try:
                        val = str(row[idx]).replace(',', '').replace('$', '').replace('RM', '').strip()
                        return float(val) if val else 0.0
                    except:
                        return 0.0
                return 0.0
            
            return {
                'date': date_str,
                'revenue': get_val('revenue'),
                'gross_profit': get_val('gross_profit'),
                'net_income': get_val('net_income'),
                'cash_balance': get_val('cash_balance'),
                'operating_expenses': get_val('operating_expenses'),
            }
        except Exception as e:
            print(f"Row extraction error: {e}")
            return None

    def _parse_text(self, text: str) -> List[Dict[str, Any]]:
        """Parse financial data from plain text"""
        results = []
        lines = text.split('\n')
        
        for line in lines:
            # Look for date patterns
            for pattern in self.date_patterns:
                matches = list(re.finditer(pattern, line))
                if matches:
                    date_str = self._normalize_date(matches[0].group())
                    if date_str:
                        # Extract numbers from line
                        numbers = re.findall(r'[\$\£\€\RM]?\s*[\d,]+\.?\d*', line)
                        if len(numbers) >= 3:
                            try:
                                vals = [float(n.replace(',', '').replace('$', '').replace('RM', '').strip()) for n in numbers]
                                results.append({
                                    'date': date_str,
                                    'revenue': vals[0] if len(vals) > 0 else 0,
                                    'gross_profit': vals[1] if len(vals) > 1 else 0,
                                    'net_income': vals[2] if len(vals) > 2 else 0,
                                })
                            except:
                                pass
        return results

    def _normalize_date(self, date_str: str) -> Optional[str]:
        """Normalize various date formats to YYYY-MM-DD"""
        date_str = date_str.strip()
        
        # Try various formats
        formats = [
            '%Y-%m-%d',
            '%m/%d/%Y',
            '%m-%d-%Y',
            '%Y/%m/%d',
            '%b %Y',
            '%b %d, %Y',
            '%B %Y',
            '%B %d, %Y',
            'Q%q %Y',
            '%Y',
        ]
        
        for fmt in formats:
            try:
                if fmt == 'Q%q %Y':
                    # Handle quarter format
                    match = re.match(r'Q([1-4])\s+(\d{4})', date_str, re.IGNORECASE)
                    if match:
                        quarter, year = match.groups()
                        month = (int(quarter) - 1) * 3 + 1
                        return f"{year}-{month:02d}-01"
                else:
                    from datetime import datetime
                    dt = datetime.strptime(date_str, fmt)
                    return dt.strftime('%Y-%m-%d')
            except:
                continue
        
        return None


# Singleton instance
extractor = DataExtractor()

def extract_financial_data(file_content: bytes, file_type: FileType) -> List[FinancialDataPoint]:
    """Main extraction function"""
    raw_data = []
    if file_type == FileType.PDF:
        raw_data = extractor.extract_from_pdf(file_content)
    elif file_type in [FileType.XLSX, FileType.XLS]:
        raw_data = extractor.extract_from_excel(file_content)
    
    # Convert to FinancialDataPoint models
    points = []
    for item in raw_data:
        try:
            points.append(FinancialDataPoint(**item))
        except Exception as e:
            print(f"Validation error: {e}")
    
    # Sort by date
    points.sort(key=lambda x: x.date)
    return points