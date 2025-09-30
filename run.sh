#!/bin/bash

# Web UI for Large Models 启动脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${2}${1}${NC}"
}

print_info() {
    print_message "$1" "$BLUE"
}

print_success() {
    print_message "$1" "$GREEN"
}

print_warning() {
    print_message "$1" "$YELLOW"
}

print_error() {
    print_message "$1" "$RED"
}

# 检查Python版本
check_python() {
    if command -v python3 &> /dev/null; then
        PYTHON_CMD="python3"
    elif command -v python &> /dev/null; then
        PYTHON_CMD="python"
    else
        print_error "Python 未安装，请先安装 Python 3.8+"
        exit 1
    fi
    
    PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | cut -d' ' -f2)
    print_info "检测到 Python 版本: $PYTHON_VERSION"
}

# 检查虚拟环境
check_venv() {
    if [[ "$VIRTUAL_ENV" != "" ]]; then
        print_success "虚拟环境已激活: $VIRTUAL_ENV"
    else
        print_warning "未检测到虚拟环境"
        
        # 检查是否存在虚拟环境
        if [ -d "Webui_env" ]; then
            print_info "发现虚拟环境 Webui_env，正在激活..."
            source Webui_env/bin/activate
            print_success "虚拟环境已激活"
        else
            print_info "创建虚拟环境 Webui_env..."
            $PYTHON_CMD -m venv Webui_env
            source Webui_env/bin/activate
            print_success "虚拟环境创建并激活成功"
        fi
    fi
}

# 安装依赖
install_dependencies() {
    print_info "安装项目依赖..."
    pip install --upgrade pip
    pip install -r requirements.txt
    print_success "依赖安装完成"
}

# 检查环境变量
check_env() {
    if [ ! -f ".env" ]; then
        if [ -f "env.example" ]; then
            print_warning ".env 文件不存在，正在从 env.example 创建..."
            cp env.example .env
            print_info "请编辑 .env 文件，添加您的 Gemini API Key"
        else
            print_error "未找到环境配置文件"
            exit 1
        fi
    fi
}

# 创建必要目录
create_directories() {
    print_info "创建必要目录..."
    mkdir -p outputs/images outputs/videos outputs/files logs static/css static/js static/images
    print_success "目录创建完成"
}

# 启动应用
start_app() {
    print_info "启动 Web UI for Large Models..."
    print_success "应用将在 http://localhost:8000 启动"
    print_info "按 Ctrl+C 停止应用"
    echo ""
    
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
}

# 主函数
main() {
    print_success "=========================================="
    print_success "    Web UI for Large Models 启动脚本"
    print_success "=========================================="
    echo ""
    
    check_python
    check_venv
    install_dependencies
    check_env
    create_directories
    start_app
}

# 捕获中断信号
trap 'print_warning "\n正在停止应用..."; exit 0' INT

# 运行主函数
main

