# 海龟汤 — Windows 上传脚本
# 用法: .\deploy\upload.ps1 -Server <your-server-ip>
# 需要安装 OpenSSH 客户端（Win10+ 自带）

param(
    [Parameter(Mandatory=$true)]
    [string]$Server,
    [string]$User = "root",
    [string]$RemotePath = "/var/www/haigui"
)

$ErrorActionPreference = "Stop"

Write-Host "=== 海龟汤上传脚本 ===" -ForegroundColor Cyan

# 1. 确认 dist/ 存在
if (-not (Test-Path ".\dist\index.html")) {
    Write-Host "错误: dist/ 目录不存在，请先运行 npm run build" -ForegroundColor Red
    exit 1
}

# 2. 打包项目（仅生产所需文件）
Write-Host "[1/4] 打包项目文件..."
$archive = "haigui-deploy.tar.gz"

# 删除旧包
if (Test-Path $archive) { Remove-Item $archive }

# 打包（排除开发文件）
tar -czf $archive `
    --exclude='node_modules' `
    --exclude='src' `
    --exclude='.git' `
    --exclude='*.log' `
    server/ dist/ package.json deploy/

Write-Host "  打包完成: $archive ($([math]::Round((Get-Item $archive).Length / 1KB, 1)) KB)"

# 3. 上传到服务器
Write-Host "[2/4] 上传到 $Server ..."
scp $archive "${User}@${Server}:${RemotePath}/"

# 4. 服务器端解压和部署
Write-Host "[3/4] 服务器端解压和安装..."
ssh "${User}@${Server}" @"
cd ${RemotePath}
tar -xzf haigui-deploy.tar.gz --overwrite
rm haigui-deploy.tar.gz

# 安装/更新依赖
npm install --omit=dev 2>&1 | tail -3

# 确保数据目录存在
mkdir -p server/data

echo '依赖安装完成'
"@

# 5. 运行部署脚本
Write-Host "[4/4] 运行服务器部署脚本..."
ssh "${User}@${Server}" "cd ${RemotePath} && bash deploy/server-setup.sh"

# 清理本地包
Remove-Item $archive

Write-Host ""
Write-Host "=== 上传完成 ===" -ForegroundColor Green
Write-Host "访问: https://haigui.yuntianli.art" -ForegroundColor Cyan
Write-Host ""
Write-Host "别忘了:" -ForegroundColor Yellow
Write-Host "1. DNS 添加 A 记录: haigui → 服务器公网IP" -ForegroundColor Yellow
Write-Host "2. SSL: ssh ${User}@${Server} 'sudo certbot --nginx -d haigui.yuntianli.art'" -ForegroundColor Yellow
Write-Host "3. 编辑 .env: ssh ${User}@${Server} 'nano ${RemotePath}/.env'" -ForegroundColor Yellow
