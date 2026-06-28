@echo off
echo ===================================================
echo   Uploading Textile ERP Project to GitHub
echo ===================================================
echo.

:: 1. Remove the nested .git folder inside backend so it's not treated as a submodule
if exist "backend\.git" (
    echo [1/4] Removing nested .git directory from backend...
    rmdir /s /q "backend\.git"
) else (
    echo [1/4] No nested .git directory found in backend. Good.
)

:: 2. Untrack backend directory if it was cached as a submodule gitlink previously
echo [2/4] Clearing git cache for nested folders...
git rm --cached -r "backend" >nul 2>&1

:: 3. Stage and commit all files
echo [3/4] Staging and committing all project files...
git add .
git commit -m "Upload whole project (backend, frontend, config)"

:: 4. Push to remote origin
echo [4/4] Pushing code to GitHub...
git push -u origin main

echo.
echo ===================================================
echo   Done! Please check the output above for any errors.
echo ===================================================
pause
