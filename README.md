# Tyren Chatbot

这是一个功能齐全、基于 Next.js 15 和 Tyren AI 的聊天机器人，支持多模态对话和联网搜索。

## 功能特性

- 🚀 **模型支持**: 默认使用 Gemini 2.0 Flash (可配置)。
- 🔒 **安全性**: 包含网页访问密码验证。
- 💬 **对话功能**: 支持流式响应和长上下文对话。
- 🖼️ **多模态**: 支持图像上传与分析。
- 🌐 **联网搜索**: 内置 Google 搜索工具，可随时开启/关闭。
- 📱 **响应式设计**: 完美适配桌面和移动设备。

## 部署到 Vercel

1. 将此代码推送到您的 GitHub 仓库。
2. 在 Vercel 中导入项目。
3. 在 Vercel 项目设置中配置以下环境变量：

| 变量名 | 描述 | 示例 |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | 您的 Gemini API 密钥 | `AIzaSy...` |
| `WEB_ACCESS_PASSWORD` | 用于访问网页的密码 | `my_secure_password` |
| `GEMINI_MODEL` | 使用的模型名称 (可选) | `gemini-2.0-flash-exp` |

## 本地开发

1. 安装依赖:
   ```bash
   npm install
   ```
2. 创建 `.env` 文件并填入上述环境变量。
3. 运行开发服务器:
   ```bash
   npm run dev
   ```

## 技术栈

- **框架**: Next.js 15 (App Router)
- **AI SDK**: @google/generative-ai
- **样式**: CSS Modules + Global CSS (Dark Mode)
- **渲染**: Edge Runtime
