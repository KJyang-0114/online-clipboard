#!/bin/bash

# 線上剪貼簿 GitHub Pages 部署腳本
# 使用方法: chmod +x deploy-script.sh && ./deploy-script.sh

echo "🚀 線上剪貼簿 GitHub Pages 部署腳本"
echo "======================================"

# 檢查是否在正確的目錄
if [ ! -f "package.json" ]; then
    echo "❌ 錯誤：請在專案根目錄執行此腳本"
    exit 1
fi

echo "📁 當前目錄：$(pwd)"
echo ""

# 步驟 1: 檢查 Git 狀態
echo "🔍 步驟 1: 檢查 Git 狀態..."
if [ ! -d ".git" ]; then
    echo "📝 初始化 Git 存儲庫..."
    git init
else
    echo "✅ Git 存儲庫已存在"
fi

# 步驟 2: 添加檔案
echo ""
echo "📦 步驟 2: 添加檔案到 Git..."
git add .

# 顯示狀態
echo "📊 檔案狀態："
git status --short

# 步驟 3: 提交
echo ""
echo "💾 步驟 3: 提交變更..."
read -p "請輸入提交訊息 (預設: 'Deploy online clipboard app'): " commit_msg
commit_msg=${commit_msg:-"Deploy online clipboard app"}
git commit -m "$commit_msg"

# 步驟 4: 設定遠端存儲庫
echo ""
echo "🔗 步驟 4: 設定 GitHub 遠端存儲庫..."

# 檢查是否已有遠端存儲庫
if git remote | grep -q "origin"; then
    echo "✅ 遠端存儲庫已設定"
    git remote -v
else
    echo "📝 設定遠端存儲庫..."
    git remote add origin https://github.com/kjyang-0114/online-clipboard.git
    echo "✅ 遠端存儲庫已設定"
fi

# 步驟 5: 設定主分支
echo ""
echo "🌿 步驟 5: 設定主分支..."
git branch -M main

# 步驟 6: 推送到 GitHub
echo ""
echo "🚀 步驟 6: 推送到 GitHub..."
echo "⚠️  如果這是第一次推送，可能需要輸入 GitHub 帳號密碼"
echo "   用戶名: kjyang-0114"
echo "   密碼: 您的 GitHub 密碼或 Personal Access Token"
echo ""

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 成功推送到 GitHub！"
    echo ""
    echo "📋 接下來的步驟："
    echo "1. 前往 https://github.com/kjyang-0114/online-clipboard"
    echo "2. 點擊 Settings 標籤"
    echo "3. 在左側選單找到 Pages"
    echo "4. 在 Source 下拉選單選擇 'GitHub Actions'"
    echo "5. 等待 2-5 分鐘讓 GitHub 建構網站"
    echo "6. 您的網站將在以下網址可用："
    echo "   🌐 https://kjyang-0114.github.io/online-clipboard/"
    echo ""
    echo "💡 提示：您可以在 Actions 標籤查看部署進度"
else
    echo ""
    echo "❌ 推送失敗！"
    echo ""
    echo "🔧 可能的解決方法："
    echo "1. 檢查網路連接"
    echo "2. 確認 GitHub 帳號密碼正確"
    echo "3. 如果使用 2FA，需要使用 Personal Access Token"
    echo "4. 確認存儲庫名稱正確"
    echo ""
    echo "📚 詳細教學請參考：部署教學.md"
fi

echo ""
echo "🎯 部署腳本執行完畢"