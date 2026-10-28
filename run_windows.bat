@echo off
setlocal
cd /d "%~dp0"
if not exist .venv\Scripts\python.exe (
  echo Creating Python virtual environment...
  py -m venv .venv
  if errorlevel 1 goto error
)
call .venv\Scripts\activate.bat
if not exist .env (
  copy .env.example .env >nul
  echo Created .env. Edit it to set a strong admin password and secret key.
  notepad .env
)
echo Installing dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 goto error
echo Starting ReviewPilot AI at http://127.0.0.1:5000
python app.py
goto end
:error
echo Setup failed. Install Python 3.10+ and check your internet connection.
pause
:end
endlocal
