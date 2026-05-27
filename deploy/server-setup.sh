#!/bin/bash
# 海龟汤 — 服务器端部署脚本
# 在阿里云 ECS Ubuntu 上以 root 或 sudo 用户执行

set -e

APP_DIR="/var/www/haigui"
NODE_VERSION="20"

echo "=== 海龟汤部署脚本 ==="

# 1. 创建应用目录
echo "[1/6] 创建应用目录..."
mkdir -p "$APP_DIR"
mkdir -p "$APP_DIR/server/data"

# 2. 复制 .env（如不存在则从模板创建）
echo "[2/6] 配置环境变量..."
if [ ! -f "$APP_DIR/.env" ]; then
    if [ -f "$APP_DIR/deploy/.env.production" ]; then
        cp "$APP_DIR/deploy/.env.production" "$APP_DIR/.env"
        echo "  已从模板创建 .env，请编辑 $APP_DIR/.env 修改 JWT_SECRET"
    else
        echo "  ⚠ .env.production 模板不存在，请手动创建 $APP_DIR/.env"
    fi
else
    echo "  .env 已存在，跳过"
fi

# 3. 安装依赖（better-sqlite3 需要原生编译）
echo "[3/6] 安装依赖..."
cd "$APP_DIR"
npm install --omit=dev 2>&1 | tail -1
echo "  依赖安装完成"

# 4. 设置目录权限
echo "[4/6] 设置权限..."
chown -R www-data:www-data "$APP_DIR/server/data" 2>/dev/null || true

# 5. PM2 启动/重载
echo "[5/6] PM2 启动服务..."
if pm2 list | grep -q "haigui"; then
    pm2 reload haigui
    echo "  已重载 haigui"
else
    pm2 start server/index.js --name haigui --cwd "$APP_DIR"
    pm2 save
    echo "  已启动 haigui"
fi

# 6. Nginx 配置
echo "[6/6] Nginx 配置..."
if [ ! -f /etc/nginx/sites-enabled/haigui ]; then
    cp "$APP_DIR/deploy/nginx-haigui.conf" /etc/nginx/sites-available/haigui
    ln -sf /etc/nginx/sites-available/haigui /etc/nginx/sites-enabled/haigui
    nginx -t && systemctl reload nginx
    echo "  Nginx 配置已启用，请运行: sudo certbot --nginx -d haigui.yuntianli.art"
else
    nginx -t && systemctl reload nginx
    echo "  Nginx 已重载"
fi

echo ""
echo "=== 部署完成 ==="
echo "应用路径: $APP_DIR"
echo "PM2 状态: pm2 status"
echo "日志查看: pm2 logs haigui"
echo ""
echo "下一步（如首次部署）："
echo "1. 去阿里云 DNS 添加 A 记录: haigui → 你的ECS公网IP"
echo "2. 运行 SSL: sudo certbot --nginx -d haigui.yuntianli.art"
echo "3. 编辑 $APP_DIR/.env 修改 JWT_SECRET 和 ADMIN_PASSWORD"
