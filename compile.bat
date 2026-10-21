@echo off
echo ============================================================
echo   Compiling MazeMaster C++ Solver using MinGW g++
echo ============================================================

cd /d "%~dp0"

g++ -std=c++11 -O2 solver.cpp -o solver.exe

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] solver.exe compiled successfully!
) else (
    echo [ERROR] Compilation failed. Please check g++ installation.
)
