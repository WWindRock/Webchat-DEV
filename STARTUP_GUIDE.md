# WebChat Channel 启动指南

## 🔧 Docker 权限问题解决

如果遇到 "permission denied" 错误，请按以下步骤操作：

### 方法 1：添加用户到 docker 组

```bash
# 1. 添加当前用户到 docker 组
sudo usermod -aG docker $USER

# 2. 重新登录或重启系统
# 退出当前会话并重新登录，或者重启系统
```

### 方法 2：使用 sudo 运行 docker

```bash
# 在所有 docker 命令前添加 sudo
sudo docker compose -f docker-compose.yml up -d copaw-dev selgen-dev
```

### 方法 3：重启 Docker 服务

```bash
# 重启 Docker 服务
sudo service docker restart

# 或者
sudo systemctl restart docker
```

## 🚀 启动开发环境

### 1. 确保 Selgen 项目文件存在

```bash
# 检查 Selgen 目录
ls -la /home/alex/Webchat-Dev/Selgen

# 如果目录为空，需要从原 Selgen 项目复制文件
# 或者先运行 npm install 生成 package.json
```

### 2. 启动服务

```bash
cd /home/alex/Webchat-Dev

# 使用 sudo 启动
sudo docker compose -f docker-compose.yml up -d copaw-dev selgen-dev

# 或者使用启动脚本
sudo ./shared/scripts/start-dev.sh
```

### 3. 查看日志

```bash
# 查看所有服务日志
sudo docker compose -f /home/alex/Webchat-Dev/docker-compose.yml logs -f

# 查看特定服务日志
sudo docker compose -f /home/alex/Webchat-Dev/docker-compose.yml logs -f copaw-dev
sudo docker compose -f /home/alex/Webchat-Dev/docker-compose.yml logs -f selgen-dev
```

### 4. 访问应用

启动成功后，访问：
- **前端**: http://localhost:7000
- **CoPaw API**: http://localhost:7088
- **WebSocket**: ws://localhost:7080/ws

### 5. 登录

使用开发账号登录：
- 邮箱：dev1@example.com
- 密码：dev123456

## 🔧 故障排查

### 检查服务状态

```bash
# 查看容器状态
sudo docker compose -f /home/alex/Webchat-Dev/docker-compose.yml ps

# 查看容器详细信息
sudo docker ps -a
```

### 检查端口占用

```bash
# 检查端口是否被占用
netstat -tuln | grep -E ':(7000|7001|7088|7080|7081)'

# 或者使用 lsof
sudo lsof -i :7000
sudo lsof -i :7001
sudo lsof -i :7088
```

### 停止服务

```bash
# 停止所有服务
sudo docker compose -f /home/alex/Webchat-Dev/docker-compose.yml down

# 停止特定服务
sudo docker compose -f /home/alex/Webchat-Dev/docker-compose.yml stop copaw-dev
sudo docker compose -f /home/alex/Webchat-Dev/docker-compose.yml stop selgen-dev
```

### 重启服务

```bash
# 重启所有服务
sudo docker compose -f /home/alex/Webchat-Dev/docker-compose.yml restart

# 重启特定服务
sudo docker compose -f /home/alex/Webchat-Dev/docker-compose.yml restart copaw-dev
sudo docker compose -f /home/alex/Webchat-Dev/docker-compose.yml restart selgen-dev
```

### 查看容器日志

```bash
# 进入容器查看日志
sudo docker exec -it copaw-dev bash
sudo docker exec -it selgen-dev sh

# 查看容器内部日志
sudo docker logs copaw-dev
sudo docker logs selgen-dev
```

### 清理并重新构建

```bash
# 停止并删除容器
sudo docker compose -f /home/alex/Webchat-Dev/docker-compose.yml down

# 删除镜像
sudo docker rmi webchat-dev-copaw-dev webchat-dev-selgen-dev

# 重新构建并启动
sudo docker compose -f /home/alex/Webchat-Dev/docker-compose.yml up -d --build copaw-dev selgen-dev
```

## 📋 端口规划

| 服务 | 开发环境 | 测试环境 | 原有 CoPaw |
|------|----------|----------|--------------|
| CoPaw API | 7088 | 7098 | 8088 |
| WebSocket | 7080 | 7090 | - |
| HTTP API | 7081 | 7091 | - |
| Selgen 前端 | 7000 | 7001 | - |

## 📝 开发账号

| 邮箱 | 密码 | 角色 | 说明 |
|--------|--------|------|------|
| dev1@example.com | dev123456 | admin | 管理员账号 |
| dev2@example.com | dev123456 | user | 开发者账号 |
| test@example.com | test123456 | user | 测试账号 |

## ⚠️ 重要提示

1. **Docker 权限**: 如果持续遇到权限问题，建议使用 `sudo` 运行 docker 命令
2. **端口冲突**: 新项目使用 7000-7001 端口段，完全避开原有 CoPaw 的 8088 端口
3. **Selgen 目录**: 确保 `/home/alex/Webchat-Dev/Selgen` 目录包含必要的文件（package.json 等）
4. **网络连接**: 确保防火墙允许访问 7000、7001、7088、7080、7081 端口
