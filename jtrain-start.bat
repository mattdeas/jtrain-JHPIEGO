@echo off
echo Starting jTrain development server on port 3001...
echo Proxying requests to https://dhis2.jhpiego.org
echo -------------------------------------------------

REM Navigate to the project directory
cd /d C:\Code\jtrain-dev\jtrain-dev

REM Start the dev server and keep the window open
npm start -- --proxy https://dhis2.jhpiego.org --port 3001

echo -------------------------------------------------
echo Server stopped. Press any key to exit.
pause >nul