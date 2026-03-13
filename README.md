# WebChat Channel 开发项目

基于 Selgen 项目开发的 CoPaw WebChat Channel，实现网页版聊天功能。

## 📋 目录结构

```
Webchat-Dev/
├── CoPaw/                      # CoPaw 源码
│   ├── src/copaw/app/channels/
│   │   ├── webchat.py           # WebChat Channel 实现
│   │   └── __init__.py          # Channel 注册
│   ├── Dockerfile.dev              # 开发环境 Dockerfile
│   └── Dockerfile                 # 生产环境 Dockerfile
├── Selgen/                     # Selgen 前端
│   ├── src/
│   │   ├── hooks/
│   │   │   ├── useCoPawWebSocket.ts  # WebSocket Hook
│   │   │   └── useAuth.ts           # Auth Hook
│   │   ├── components/
│   │   │   ├── canvas/
│   │   │   │   └── AgentCanvas.tsx     # 主画布组件
│   │   │   └── providers.tsx        # Session Provider
│   │   ├── lib/
│   │   │   └── auth/
│   │   │       └── dev-users.ts        # 开发账号
│   │   └── types/
│   │       └── copaw.ts              # CoPaw 类型
│   │   └── app/
│   │       ├── page.tsx                # 主页
│   │       ├── auth/
│   │       │   └── signin/
│   │       │       ├── page.tsx          # 登录页
│   │       │       └── layout.tsx         # 登录布局
│   │       └── api/
│   │           ├── auth/[...nextauth]/route.ts  # NextAuth 配置
│   │           └── user/route.ts            # 用户 API
│   ├── Dockerfile.dev            # 开发环境 Dockerfile
│   └── Dockerfile               # 生产环境 Dockerfile
├── shared/                      # 共享配置
│   ├── scripts/
│   │   ├── start-dev.sh          # 启动开发环境
│   │   ├── start-test.sh         # 启动测试环境
│   │   ├── backup.sh            # 备份脚本
│   │   └── reset-data.sh        # 重置数据
│   └── config/
│       ├── channels-dev.yaml      # 开发环境配置
│       └── channels-test.yaml     # 测试环境配置
├── data/                        # 数据目录（gitignore）
│   ├── copaw-dev/             # 开发环境数据
│   ├── copaw-test/            # 测试环境数据
│   └── selgen-data/           # Selgen 数据
├── backups/                     # 备份目录（gitignore）
├── docker-compose.yml            # Docker Compose 配置
├── ecosystem.config.js          # PM2 多实例配置
├── .env                        # 环境变量
├── Makefile                    # 常用命令
└── README.md                   # 本文件
```

## 🚀 快速开始

### 环境要求

- Docker 20.10+（使用 `docker compose` 命令）
- Node.js 18+
- Python 3.8+
- Git

### 端口规划

| 服务 | 开发环境 | 测试环境 | 原有 CoPaw |
|------|----------|----------|--------------|
| CoPaw API | 7088 | 7098 | 8088 |
| WebSocket | 7080 | 7090 | - |
| HTTP API | 7081 | 7091 | - |
| Selgen 前端 | 3000 | 3001 | - |

**端口规划原则**：
- **原有 CoPaw**：继续使用默认 **8088** 端口
- **新 WebChat 项目**：使用 **7080-7089** 端口段（完全避开 8088）
- **测试环境**：在开发环境端口基础上 +10（7080→7090）

### Docker Compose 命令

新版本 Docker 使用 `docker compose`（注意是空格，不是连字符）：

```bash
# 启动开发环境
docker compose -f docker-compose.yml up -d copaw-dev selgen-dev

# 启动测试环境
docker compose -f docker-compose.yml --profile test up -d copaw-test selgen-test

# 查看日志
docker compose logs -f copaw-dev

# 停止服务
docker compose down

# 重启服务
docker compose restart copaw-dev
```

### Makefile 命令

```bash
# 查看所有可用命令
make help

# 安装依赖
make install

# 启动开发环境
make dev

# 启动测试环境
make test

# 备份数据
make backup

# 重置开发环境
make reset-dev

# 重置测试环境
make reset-test

# 清理所有容器和数据
make clean
```

### PM2 管理命令

```bash
# 启动所有实例
pm2 start ecosystem.config.js

# 启动指定实例
pm2 start ecosystem.config.js --only copaw-webchat-dev

# 查看状态
pm2 status

# 查看日志
pm2 logs copaw-webchat-dev

# 重启指定实例
pm2 restart copaw-webchat-dev

# 停止指定实例
pm2 stop copaw-webchat-dev

# 删除指定实例
pm2 delete copaw-webchat-dev
```

### 开发账号

开发阶段使用硬编码账号进行测试：

| 邮箱 | 密码 | 角色 | 说明 |
|--------|--------|------|------|
| dev1@example.com | dev123456 | admin | 管理员账号 |
| dev2@example.com | dev123456 | user | 开发者账号 |
| test@example.com | test123456 | user | 测试账号 |

## 📚 开发指南

### 1. 安装依赖

```bash
# 使用 Makefile 安装所有依赖
make install

# 或者手动安装
cd Selgen && npm install
```

### 2. 启动开发环境

```bash
# 使用 Makefile 启动
make dev

# 或者手动启动
./shared/scripts/start-dev.sh
```

### 3. 访问应用

打开浏览器访问：**http://localhost:7000**

### 4. 登录

使用开发账号登录：
- 邮箱：dev1@example.com
- 密码：dev123456

### 5. 开始使用

登录后，你将看到：
- 左侧：ReactFlow 无限画布，展示 Agent 生成的资产
- 右侧：聊天对话框，与 CoPaw Agent 进行对话

## 🔧 故障排查

### Docker 权限问题

如果遇到 "permission denied" 错误：

```bash
# 将当前用户添加到 docker 组
sudo usermod -aG docker $USER

# 重新登录或重启系统
```

### 端口冲突

如果遇到端口冲突：

```bash
# 检查端口占用
netstat -tuln | grep -E ':(7088|7080|7081|3000)'

# 杀死占用端口的进程
sudo kill -9 <PID>
```

### WebSocket 连接失败

如果 WebSocket 连接失败：

1. 检查 CoPaw 服务是否正常运行
   ```bash
   docker compose logs copaw-dev
   ```

2. 检查端口是否正确
   - 开发环境：ws://localhost:7080/ws
   - 测试环境：ws://localhost:7090/ws

3. 检查浏览器控制台错误信息

### PM2 多实例冲突

如果 PM2 多实例出现冲突：

1. 检查每个实例的配置是否唯一
   - 实例名称
   - 日志路径
   - PID 文件路径
   - 工作目录

2. 查看日志
   ```bash
   pm2 logs copaw-webchat-dev
   ```

## 📝 模块说明

### CoPaw WebChat Channel

- **文件**：`CoPaw/src/copaw/app/channels/webchat.py`
- **功能**：
  - WebSocket 实时通信（端口 7080）
  - HTTP API 端点（端口 7081）
  - 用户会话管理
  - 文件上传/下载
  - 资产自动同步到前端

### Selgen 前端

- **文件**：`Selgen/src/components/canvas/AgentCanvas.tsx`
- **功能**：
  - ReactFlow 无限画布
  - 聊天对话框
  - 资产自动布局
  - 连接状态显示
  - 错误处理

### WebSocket Hook

- **文件**：`Selgen/src/hooks/useCoPawWebSocket.ts`
- **功能**：
  - 自动连接管理
  - 消息发送/接收
  - 自动重连（最多 5 次）
  - 心跳检测（每 25 秒）

## 🤝 贡献指南

1. Fork 本项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

MIT License

## 📞 联系方式

如有问题，请提交 Issue。
