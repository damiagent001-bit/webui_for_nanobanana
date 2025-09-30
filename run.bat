@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

REM Web UI for Large Models Windows 启动脚本

title Web UI for Large Models

REM 颜色定义 (Windows CMD 支持的颜色代码)
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM 打印带颜色的消息函数
:print_message
echo %~2%~1%NC%
goto :eof

:print_info
call :print_message "%~1" "%BLUE%"
goto :eof

:print_success
call :print_message "%~1" "%GREEN%"
goto :eof

:print_warning
call :print_message "%~1" "%YELLOW%"
goto :eof

:print_error
call :print_message "%~1" "%RED%"
goto :eof

REM 检查Python版本
:check_python
call :print_info "检查Python环境..."
python --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
    call :print_success "检测到 Python 版本: %PYTHON_VERSION%"
    set PYTHON_CMD=python
    goto :eof
)

py --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=2" %%i in ('py --version 2^>^&1') do set PYTHON_VERSION=%%i
    call :print_success "检测到 Python 版本: %PYTHON_VERSION%"
    set PYTHON_CMD=py
    goto :eof
)

call :print_error "Python 未安装，请先安装 Python 3.8+"
call :print_info "下载地址: https://www.python.org/downloads/"
pause
exit /b 1

REM 检查虚拟环境
:check_venv
if defined VIRTUAL_ENV (
    call :print_success "虚拟环境已激活: %VIRTUAL_ENV%"
    goto :eof
)

call :print_warning "未检测到虚拟环境"

REM 检查是否存在虚拟环境
if exist "Webui_env" (
    call :print_info "发现虚拟环境 Webui_env，正在激活..."
    call Webui_env\Scripts\activate.bat
    if %errorlevel% equ 0 (
        call :print_success "虚拟环境已激活"
    ) else (
        call :print_error "虚拟环境激活失败"
        exit /b 1
    )
) else (
    call :print_info "创建虚拟环境 Webui_env..."
    %PYTHON_CMD% -m venv Webui_env
    if %errorlevel% equ 0 (
        call Webui_env\Scripts\activate.bat
        call :print_success "虚拟环境创建并激活成功"
    ) else (
        call :print_error "虚拟环境创建失败"
        exit /b 1
    )
)
goto :eof

REM 安装依赖
:install_dependencies
call :print_info "安装项目依赖..."
pip install --upgrade pip
if %errorlevel% neq 0 (
    call :print_error "pip 升级失败"
    exit /b 1
)

pip install -r requirements.txt
if %errorlevel% neq 0 (
    call :print_error "依赖安装失败"
    exit /b 1
)

call :print_success "依赖安装完成"
goto :eof

REM 检查环境变量
:check_env
if not exist ".env" (
    if exist "env.example" (
        call :print_warning ".env 文件不存在，正在从 env.example 创建..."
        copy env.example .env >nul
        call :print_info "请编辑 .env 文件，添加您的 Gemini API Key"
    ) else (
        call :print_error "未找到环境配置文件"
        exit /b 1
    )
)
goto :eof

REM 创建必要目录
:create_directories
call :print_info "创建必要目录..."
if not exist "outputs" mkdir outputs
if not exist "outputs\images" mkdir outputs\images
if not exist "outputs\videos" mkdir outputs\videos
if not exist "outputs\files" mkdir outputs\files
if not exist "logs" mkdir logs
if not exist "static\css" mkdir static\css
if not exist "static\js" mkdir static\js
if not exist "static\images" mkdir static\images
call :print_success "目录创建完成"
goto :eof

REM 启动应用
:start_app
call :print_info "启动 Web UI for Large Models..."
call :print_success "应用将在 http://localhost:8000 启动"
call :print_info "按 Ctrl+C 停止应用"
echo.

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
goto :eof

REM 主函数
:main
call :print_success "=========================================="
call :print_success "    Web UI for Large Models 启动脚本"
call :print_success "=========================================="
echo.

call :check_python
if %errorlevel% neq 0 exit /b 1

call :check_venv
if %errorlevel% neq 0 exit /b 1

call :install_dependencies
if %errorlevel% neq 0 exit /b 1

call :check_env
if %errorlevel% neq 0 exit /b 1

call :create_directories
call :start_app

REM 捕获中断信号
:cleanup
call :print_warning "正在停止应用..."
exit /b 0

REM 运行主函数
call :main
if %errorlevel% neq 0 (
    call :print_error "启动失败"
    pause
    exit /b 1
)
