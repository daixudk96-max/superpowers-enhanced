@echo off
REM Polyglot wrapper: runs Node.js scripts cross-platform
REM Usage: run-node.cmd <script-path> [args...]
REM Note: Script path with spaces must be quoted when calling this wrapper

setlocal enabledelayedexpansion

if "%~1"=="" (
    echo run-node.cmd: missing script path >&2
    exit /b 1
)

REM Store script path (handles spaces correctly with %~1)
set "SCRIPT_PATH=%~1"

REM Try multiple node locations (in order of preference)
set "NODE_EXE="

REM 1. Check if node is in PATH
where node >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "NODE_EXE=node"
    goto :run
)

REM 2. Check common Windows installation paths
if exist "C:\Program Files\nodejs\node.exe" (
    set "NODE_EXE=C:\Program Files\nodejs\node.exe"
    goto :run
)

if exist "%LOCALAPPDATA%\Programs\node\node.exe" (
    set "NODE_EXE=%LOCALAPPDATA%\Programs\node\node.exe"
    goto :run
)

if exist "%ProgramFiles%\nodejs\node.exe" (
    set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
    goto :run
)

REM 3. Check nvm-windows paths
if exist "%APPDATA%\nvm\current\node.exe" (
    set "NODE_EXE=%APPDATA%\nvm\current\node.exe"
    goto :run
)

REM Node not found
echo run-node.cmd: node.exe not found in PATH or common locations >&2
exit /b 1

:run
"%NODE_EXE%" "%SCRIPT_PATH%" %2 %3 %4 %5 %6 %7 %8 %9
exit /b %ERRORLEVEL%
