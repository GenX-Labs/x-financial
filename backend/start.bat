@echo off
echo Starting X-Financial Backend...
echo.

REM Check if virtual environment exists
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Copy .env.example to .env if not exists
if not exist .env (
    copy .env.example .env
    echo Created .env from .env.example - Please update with your credentials!
)

REM Start server
echo Starting FastAPI server on http://localhost:8000
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000