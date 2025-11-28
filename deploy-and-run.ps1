# SRT Tool 部署和运行脚本

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("dev", "prod")]
    [string]$Mode = "dev"
)

Write-Host "Running in $Mode mode..." -ForegroundColor Green

if ($Mode -eq "dev") {
    Write-Host "Installing dependencies..." -ForegroundColor Green
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Error during npm install"
        pause
        exit 1
    }

    # 启动开发服务器并在浏览器中打开
    Write-Host "Starting development server..." -ForegroundColor Green
    Start-Process "http://localhost:3000/srt-tool/"
    
    # 在后台启动开发服务器
    npm run dev
}
else {
    Write-Host "Installing dependencies..." -ForegroundColor Green
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Error during npm install"
        pause
        exit 1
    }

    Write-Host "Building the project..." -ForegroundColor Green
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Error during build process"
        pause
        exit 1
    }

    # 启动预览服务器并在浏览器中打开
    Write-Host "Starting preview server..." -ForegroundColor Green
    Start-Process "http://localhost:3000/srt-tool/"

    # 在后台启动服务器
    npm run preview
}