// PM2 多实例配置 - WebChat 项目

module.exports = {
  apps: [
    // 原有 CoPaw 实例（生产环境）- 继续使用 8088 端口
    {
      name: 'copaw-prod',           // ✅ 唯一实例名
      script: '/home/alex/CoPaw/src/copaw/cli/main.py',
      args: 'app --host 0.0.0.0 --port 8088',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      // ✅ 独立的日志路径
      log_file: '/home/alex/Webchat-Dev/logs/copaw-prod/combined.log',
      out_file: '/home/alex/Webchat-Dev/logs/copaw-prod/out.log',
      error_file: '/home/alex/Webchat-Dev/logs/copaw-prod/error.log',
      // ✅ 独立的 PID 文件
      pid_file: '/home/alex/Webchat-Dev/logs/copaw-prod/copaw.pid',
      env: {
        PYTHONUNBUFFERED: '1',
        COPAW_WORKING_DIR: '/home/alex/.copaw-prod',
        COPAW_LOG_LEVEL: 'info',
      },
    },
    
    // WebChat 开发实例 - 使用 7088 端口（避开原有 8088）
    {
      name: 'copaw-webchat-dev',
      script: '/home/alex/Webchat-Dev/copaw_runner.py',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      log_file: '/home/alex/Webchat-Dev/logs/copaw-webchat-dev/combined.log',
      out_file: '/home/alex/Webchat-Dev/logs/copaw-webchat-dev/out.log',
      error_file: '/home/alex/Webchat-Dev/logs/copaw-webchat-dev/error.log',
      pid_file: '/home/alex/Webchat-Dev/logs/copaw-webchat-dev/copaw.pid',
    },
    
    // WebChat 测试实例 - 使用 7098 端口
    {
      name: 'copaw-webchat-test',   // ✅ 唯一实例名
      script: '/home/alex/Webchat-Dev/CoPaw/src/copaw/cli/main.py',
      args: 'app --host 0.0.0.0 --port 7098',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      // ✅ 独立的日志路径
      log_file: '/home/alex/Webchat-Dev/logs/copaw-webchat-test/combined.log',
      out_file: '/home/alex/Webchat-Dev/logs/copaw-webchat-test/out.log',
      error_file: '/home/alex/Webchat-Dev/logs/copaw-webchat-test/error.log',
      // ✅ 独立的 PID 文件
      pid_file: '/home/alex/Webchat-Dev/logs/copaw-webchat-test/copaw.pid',
      env: {
        PYTHONUNBUFFERED: '1',
        COPAW_WORKING_DIR: '/home/alex/Webchat-Dev/data/copaw-test',
        COPAW_LOG_LEVEL: 'info',
      },
    },
  ],
};
