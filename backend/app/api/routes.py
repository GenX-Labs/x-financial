from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from typing import List, Optional
import uuid
import json
from datetime import datetime
from app.models.schemas import (
    UploadedDataset, FinancialDataPoint, QualityAssessment, 
    AnalysisResult, ChatRequest, ChatResponse, CalculateRequest, CalculateResponse,
    FileType, QualityLevel
)
from app.services.extractor import extract_financial_data
from app.services.quality import assess_quality
from app.services.analyzer import analyze_financial_data
from app.core.config import settings

router = APIRouter()

# In-memory storage (replace with Supabase in production)
datasets_db: dict = {}
chat_history_db: dict = {}

# Mock user for development
MOCK_USER_ID = "dev-user-123"

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload and process financial data file"""
    # Validate file type
    content_type = file.content_type
    if content_type == "application/pdf":
        file_type = FileType.PDF
    elif content_type in ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"]:
        file_type = FileType.XLSX if "spreadsheetml" in content_type else FileType.XLS
    else:
        raise HTTPException(400, "Unsupported file type. Use PDF or Excel.")
    
    # Read file
    content = await file.read()
    
    # Extract financial data
    data = extract_financial_data(content, file_type)
    
    if not data:
        raise HTTPException(400, "Could not extract financial data from file. Ensure file contains date, revenue, gross profit, net income columns.")
    
    # Assess quality
    quality = assess_quality(data)
    
    # Create dataset record
    dataset_id = str(uuid.uuid4())
    dataset = UploadedDataset(
        id=dataset_id,
        user_id=MOCK_USER_ID,
        file_name=file.filename,
        file_type=file_type,
        uploaded_at=datetime.now(),
        data=data,
        quality_score=quality.score,
        quality_level=quality.level,
        quality_issues=quality.issues,
    )
    
    datasets_db[dataset_id] = dataset
    
    return {
        "datasetId": dataset_id,
        "fileName": file.filename,
        "fileType": file_type.value,
        "recordCount": len(data),
        "quality": quality.dict(),
        "preview": [d.dict() for d in data[:5]]
    }

@router.get("/datasets")
async def get_datasets():
    """Get all datasets for current user"""
    user_datasets = [d for d in datasets_db.values() if d.user_id == MOCK_USER_ID]
    return [
        {
            "id": d.id,
            "fileName": d.file_name,
            "fileType": d.file_type.value,
            "uploadedAt": d.uploaded_at.isoformat(),
            "recordCount": len(d.data),
            "qualityScore": d.quality_score,
            "qualityLevel": d.quality_level.value,
            "hasAnalysis": d.analysis is not None,
        }
        for d in sorted(user_datasets, key=lambda x: x.uploaded_at, reverse=True)
    ]

@router.get("/datasets/{dataset_id}")
async def get_dataset(dataset_id: str):
    """Get specific dataset"""
    dataset = datasets_db.get(dataset_id)
    if not dataset:
        raise HTTPException(404, "Dataset not found")
    return dataset.dict()

@router.delete("/datasets/{dataset_id}")
async def delete_dataset(dataset_id: str):
    """Delete dataset"""
    if dataset_id not in datasets_db:
        raise HTTPException(404, "Dataset not found")
    
    del datasets_db[dataset_id]
    # Also delete chat history
    if dataset_id in chat_history_db:
        del chat_history_db[dataset_id]
    
    return {"success": True, "message": "Dataset deleted"}

@router.get("/analysis/{dataset_id}")
async def get_analysis(dataset_id: str, timeRange: Optional[str] = Query("month")):
    """Get or generate analysis for dataset"""
    dataset = datasets_db.get(dataset_id)
    if not dataset:
        raise HTTPException(404, "Dataset not found")
    
    # Check if analysis exists and timeRange matches
    if dataset.analysis:
        return dataset.analysis.dict()
    
    # Generate analysis
    analysis = analyze_financial_data(dataset.data, timeRange)
    dataset.analysis = analysis
    
    return analysis.dict()

@router.post("/chat")
async def chat_with_copilot(request: ChatRequest):
    """Chat with AI financial copilot"""
    dataset = datasets_db.get(request.dataset_id)
    if not dataset:
        raise HTTPException(404, "Dataset not found")
    
    # Build context from dataset
    context = build_dataset_context(dataset)
    
    # Build conversation history
    history_text = "\n".join([f"{msg.role}: {msg.content}" for msg in request.history[-10:]])
    
    # Create prompt
    prompt = f"""You are an AI Financial Copilot for X-Financial. You have access to the user's financial data.

DATASET CONTEXT:
{context}

CONVERSATION HISTORY:
{history_text}

USER QUESTION: {request.message}

INSTRUCTIONS:
- Answer based on the financial data provided
- For calculations, show your work step by step
- Be specific with numbers from the data
- If you don't have enough data, say so
- Keep responses concise but informative
- Use formatting (bullet points, bold) for readability"""

    try:
        # Try Gemini first
        if settings.GEMINI_API_KEY:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-pro')
            response = model.generate_content(prompt)
            message = response.text
        else:
            # Fallback to rule-based responses
            message = generate_fallback_response(request.message, dataset)
    except Exception as e:
        message = generate_fallback_response(request.message, dataset)
    
    return ChatResponse(message=message)

def build_dataset_context(dataset: UploadedDataset) -> str:
    """Build context string from dataset"""
    lines = [
        f"Dataset: {dataset.file_name}",
        f"Records: {len(dataset.data)}",
        f"Quality Score: {dataset.quality_score}/100 ({dataset.quality_level.value})",
        "",
        "FINANCIAL DATA:",
    ]
    
    for d in dataset.data[-12:]:  # Last 12 periods
        line = f"  {d.date}: Revenue={d.revenue:,.0f}, Gross Profit={d.gross_profit:,.0f}, Net Income={d.net_income:,.0f}"
        if d.cash_balance:
            line += f", Cash={d.cash_balance:,.0f}"
        if d.operating_expenses:
            line += f", OpEx={d.operating_expenses:,.0f}"
        lines.append(line)
    
    # Add summary stats
    if dataset.data:
        total_rev = sum(d.revenue for d in dataset.data)
        total_ni = sum(d.net_income for d in dataset.data)
        avg_gross = sum(d.gross_profit for d in dataset.data) / sum(d.revenue for d in dataset.data) * 100 if sum(d.revenue for d in dataset.data) > 0 else 0
        lines.extend([
            "",
            f"TOTALS: Revenue={total_rev:,.0f}, Net Income={total_ni:,.0f}",
            f"AVERAGE GROSS MARGIN: {avg_gross:.1f}%",
        ])
    
    return "\n".join(lines)

def generate_fallback_response(message: str, dataset: UploadedDataset) -> str:
    """Generate rule-based response when AI unavailable"""
    msg_lower = message.lower()
    
    # Calculations
    if "total revenue" in msg_lower:
        total = sum(d.revenue for d in dataset.data)
        return f"Total Revenue: **{total:,.0f}** (across {len(dataset.data)} periods)"
    
    if "total net income" in msg_lower or "total profit" in msg_lower:
        total = sum(d.net_income for d in dataset.data)
        return f"Total Net Income: **{total:,.0f}** (across {len(dataset.data)} periods)"
    
    if "average gross margin" in msg_lower or "avg gross margin" in msg_lower:
        total_rev = sum(d.revenue for d in dataset.data)
        total_gp = sum(d.gross_profit for d in dataset.data)
        if total_rev > 0:
            margin = (total_gp / total_rev) * 100
            return f"Average Gross Margin: **{margin:.1f}%**"
        return "Cannot calculate - no revenue data"
    
    if "average net margin" in msg_lower or "avg net margin" in msg_lower:
        total_rev = sum(d.revenue for d in dataset.data)
        total_ni = sum(d.net_income for d in dataset.data)
        if total_rev > 0:
            margin = (total_ni / total_rev) * 100
            return f"Average Net Margin: **{margin:.1f}%**"
        return "Cannot calculate - no revenue data"
    
    if "revenue growth" in msg_lower:
        if len(dataset.data) >= 2:
            first = dataset.data[0].revenue
            last = dataset.data[-1].revenue
            if first > 0:
                growth = ((last - first) / first) * 100
                return f"Revenue Growth: **{growth:.1f}%** ({first:,.0f} → {last:,.0f})"
        return "Need at least 2 periods for growth calculation"
    
    if "burn rate" in msg_lower or "monthly burn" in msg_lower:
        opex_data = [d for d in dataset.data if d.operating_expenses and d.operating_expenses > 0]
        if opex_data:
            avg_burn = sum(d.operating_expenses for d in opex_data) / len(opex_data)
            return f"Average Monthly Burn Rate: **{avg_burn:,.0f}**"
        return "No operating expense data available"
    
    if "runway" in msg_lower or "cash runway" in msg_lower:
        cash_data = [d for d in dataset.data if d.cash_balance and d.cash_balance > 0]
        if cash_data and cash_data[-1].operating_expenses and cash_data[-1].operating_expenses > 0:
            months = cash_data[-1].cash_balance / cash_data[-1].operating_expenses
            return f"Cash Runway: **{months:.1f} months** (Cash: {cash_data[-1].cash_balance:,.0f}, Monthly Burn: {cash_data[-1].operating_expenses:,.0f})"
        return "Insufficient data for runway calculation"
    
    if "risk" in msg_lower or "risk" in msg_lower:
        return "Based on your data, key risks to monitor: 1) Revenue trend direction, 2) Margin stability, 3) Cash runway. Run the full analysis on the dashboard for detailed risk assessment."
    
    if "trend" in msg_lower:
        if len(dataset.data) >= 3:
            rev_trend = "increasing" if dataset.data[-1].revenue > dataset.data[0].revenue else "decreasing"
            ni_trend = "increasing" if dataset.data[-1].net_income > dataset.data[0].net_income else "decreasing"
            return f"Trends: Revenue is **{rev_trend}**, Net Income is **{ni_trend}** over the tracked period."
        return "Need more data points for trend analysis"
    
    # Default response
    return f"""I can help you analyze your financial data from **{dataset.file_name}** ({len(dataset.data)} records).

**Try asking me:**
- "What's my total revenue?"
- "Calculate my average gross margin"
- "What's my revenue growth rate?"
- "How many months of cash runway do I have?"
- "What are the trends in my net income?"
- "What risks do you see in my data?"

**Dataset Summary:**
- Quality Score: {dataset.quality_score}/100
- Date Range: {dataset.data[0].date} to {dataset.data[-1].date}
- Latest Revenue: {dataset.data[-1].revenue:,.0f}
- Latest Net Income: {dataset.data[-1].net_income:,.0f}"""

@router.post("/calculate")
async def calculate_metric(request: CalculateRequest):
    """Calculate specific financial metric"""
    dataset = datasets_db.get(request.dataset_id)
    if not dataset:
        raise HTTPException(404, "Dataset not found")
    
    metric = request.metric.lower()
    data = dataset.data
    
    if not data:
        raise HTTPException(400, "No data available")
    
    result = None
    formatted = ""
    
    if metric == "totalrevenue":
        result = sum(d.revenue for d in data)
        formatted = f"{result:,.0f}"
    elif metric == "totalnetincome":
        result = sum(d.net_income for d in data)
        formatted = f"{result:,.0f}"
    elif metric == "avggrossmargin":
        total_rev = sum(d.revenue for d in data)
        total_gp = sum(d.gross_profit for d in data)
        result = (total_gp / total_rev * 100) if total_rev > 0 else 0
        formatted = f"{result:.1f}%"
    elif metric == "avgnamargin":
        total_rev = sum(d.revenue for d in data)
        total_ni = sum(d.net_income for d in data)
        result = (total_ni / total_rev * 100) if total_rev > 0 else 0
        formatted = f"{result:.1f}%"
    elif metric == "revenuegrowth":
        if len(data) >= 2:
            first = data[0].revenue
            last = data[-1].revenue
            result = ((last - first) / first * 100) if first > 0 else 0
            formatted = f"{result:.1f}%"
        else:
            raise HTTPException(400, "Need at least 2 periods")
    else:
        raise HTTPException(400, f"Unknown metric: {metric}")
    
    return CalculateResponse(metric=metric, value=result, formatted=formatted)