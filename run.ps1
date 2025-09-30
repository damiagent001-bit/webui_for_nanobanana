# Web UI for Large Models PowerShell 启动脚本

# 设置控制台编码为UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 颜色定义
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"
$White = "White"

# 打印带颜色的消息函数
function Write-ColorMessage {
    param(
        [string]$Message,
        [string]$Color = $White
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Info {
    param([string]$Message)
    Write-ColorMessage $Message $Blue
}

function Write-Success {
    param([string]$Message)
    Write-ColorMessage $Message $Green
}

function Write-Warning {
    param([string]$Message)
    Write-ColorMessage $Message $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-ColorMessage $Message $Red
}

# 检查Python版本
function Test-Python {
    Write-Info "检查Python环境..."
    
    # 尝试使用python命令
    try {
        $pythonVersion = python --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "检测到 Python 版本: $pythonVersion"
            $script:PythonCmd = "python"
            return $true
        }
    }
    catch {
        # 忽略错误，继续尝试其他命令
    }
    
    # 尝试使用py命令
    try {
        $pythonVersion = py --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "检测到 Python 版本: $pythonVersion"
            $script:PythonCmd = "py"
            return $true
        }
    }
    catch {
        # 忽略错误
    }
    
    Write-Error "Python 未安装，请先安装 Python 3.8+"
    Write-Info "下载地址: https://www.python.org/downloads/"
    Read-Host "按任意键退出"
    exit 1
}

# 检查虚拟环境
function Test-VirtualEnvironment {
    if ($env:VIRTUAL_ENV) {
        Write-Success "虚拟环境已激活: $env:VIRTUAL_ENV"
        return $true
    }
    
    Write-Warning "未检测到虚拟环境"
    
    # 检查是否存在虚拟环境
    if (Test-Path "Webui_env") {
        Write-Info "发现虚拟环境 Webui_env，正在激活..."
        try {
            & ".\Webui_env\Scripts\Activate.ps1"
            Write-Success "虚拟环境已激活"
            return $true
        }
        catch {
            Write-Error "虚拟环境激活失败: $_"
            return $false
        }
    }
    else {
        Write-Info "创建虚拟环境 Webui_env..."
        try {
            & $script:PythonCmd -m venv Webui_env
            & ".\Webui_env\Scripts\Activate.ps1"
            Write-Success "虚拟环境创建并激活成功"
            return $true
        }
        catch {
            Write-Error "虚拟环境创建失败: $_"
            return $false
        }
    }
}

# 安装依赖
function Install-Dependencies {
    Write-Info "安装项目依赖..."
    
    try {
        Write-Info "升级pip..."
        python -m pip install --upgrade pip
        if ($LASTEXITCODE -ne 0) {
            throw "pip升级失败"
        }
        
        Write-Info "安装项目依赖..."
        pip install -r requirements.txt
        if ($LASTEXITCODE -ne 0) {
            throw "依赖安装失败"
        }
        
        Write-Success "依赖安装完成"
        return $true
    }
    catch {
        Write-Error "依赖安装失败: $_"
        return $false
    }
}

# 检查环境变量
function Test-Environment {
    if (-not (Test-Path ".env")) {
        if (Test-Path "env.example") {
            Write-Warning ".env 文件不存在，正在从 env.example 创建..."
            Copy-Item "env.example" ".env"
            Write-Info "请编辑 .env 文件，添加您的 Gemini API Key"
        }
        else {
            Write-Error "未找到环境配置文件"
            return $false
        }
    }
    return $true
}

# 创建必要目录
function New-RequiredDirectories {
    Write-Info "创建必要目录..."
    
    $directories = @(
        "outputs",
        "outputs\images",
        "outputs\videos", 
        "outputs\files",
        "logs",
        "static\css",
        "static\js",
        "static\images"
    )
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }
    
    Write-Success "目录创建完成"
}

# 启动应用
function Start-Application {
    Write-Info "启动 Web UI for Large Models..."
    Write-Success "应用将在 http://localhost:8000 启动"
    Write-Info "按 Ctrl+C 停止应用"
    Write-Host ""
    
    try {
        uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    }
    catch {
        Write-Error "应用启动失败: $_"
        return $false
    }
    return $true
}

# 主函数
function Main {
    Write-Success "=========================================="
    Write-Success "    Web UI for Large Models 启动脚本"
    Write-Success "=========================================="
    Write-Host ""
    
    # 检查Python
    if (-not (Test-Python)) {
        return $false
    }
    
    # 检查虚拟环境
    if (-not (Test-VirtualEnvironment)) {
        return $false
    }
    
    # 安装依赖
    if (-not (Install-Dependencies)) {
        return $false
    }
    
    # 检查环境
    if (-not (Test-Environment)) {
        return $false
    }
    
    # 创建目录
    New-RequiredDirectories
    
    # 启动应用
    Start-Application
}

# 捕获中断信号
$null = Register-EngineEvent PowerShell.Exiting -Action {
    Write-Warning "正在停止应用..."
}

# 运行主函数
try {
    Main
}
catch {
    Write-Error "启动失败: $_"
    Read-Host "按任意键退出"
    exit 1
}
