# CoPaw 生产环境 Dockerfile

FROM python:3.11-slim

# 安装编译工具
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制源码
COPY src/ /app/src

# 暴露端口
EXPOSE 7088 7080 7081

# 使用 Gunicorn WSGI 服务器（生产环境）
CMD ["gunicorn", "copaw.cli.main:app", "--bind", "0.0.0.0:7088", "--workers", "4", "--threads", "2", "--worker-class", "sync", "--worker-connections", "1000", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-"]

# 环境变量
ENV PYTHONUNBUFFERED=1
ENV COPAW_WORKING_DIR=/root/.copaw
ENV COPAW_LOG_LEVEL=info
