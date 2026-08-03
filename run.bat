@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
title 人物关系图谱工作台

echo ==============================================================
echo 人物关系图谱工作台 - Windows 诊断启动器
echo ==============================================================
echo.

where py >nul 2>nul
if not errorlevel 1 (
    echo 检测到 Python Launcher，正在启动……
    py -3 start.py
    set "EXIT_CODE=%ERRORLEVEL%"
    goto :FINISH
)

where python >nul 2>nul
if not errorlevel 1 (
    echo 检测到 python 命令，正在启动……
    python start.py
    set "EXIT_CODE=%ERRORLEVEL%"
    goto :FINISH
)

where python3 >nul 2>nul
if not errorlevel 1 (
    echo 检测到 python3 命令，正在启动……
    python3 start.py
    set "EXIT_CODE=%ERRORLEVEL%"
    goto :FINISH
)

echo [启动失败] 没有检测到 Python。
echo 请安装 Python 3.10 或更高版本，并勾选 “Add Python to PATH”。
echo 也可以打开 Windows 终端，在本目录运行：py -3 start.py
set "EXIT_CODE=9009"

:FINISH
echo.
if "%EXIT_CODE%"=="0" (
    echo 服务已正常结束。
) else (
    echo 程序未能正常启动，退出码：%EXIT_CODE%
    echo 请查看同目录下的 startup.log；如不存在，通常表示脚本在执行前已被 Windows 拦截。
)
echo.
pause
exit /b %EXIT_CODE%
