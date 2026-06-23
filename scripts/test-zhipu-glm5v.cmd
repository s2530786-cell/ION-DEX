@echo off
REM Zhipu scripts toolkit wrapper (SDK + REST async). Set ZHIPU_API_KEY first.
if "%ZHIPU_API_KEY%"=="" (
  echo [error] Set ZHIPU_API_KEY, e.g. set ZHIPU_API_KEY=your-key
  exit /b 1
)
"C:\Users\admin\AppData\Local\Programs\Python\Python310\python.exe" "%~dp0test_zhipu_glm5v.py" %*
