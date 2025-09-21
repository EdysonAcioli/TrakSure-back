module.exports = {
  apps: [
    {
      name: "traksure-api",
      script: "dist/index.js",
      cwd: "/home/ubuntu/TrakSure/backend",
      instances: 1,
      exec_mode: "fork",

      // Environment
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },

      // Restart policy
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      restart_delay: 5000,

      // Logs
      log_file: "/home/ubuntu/logs/traksure-api.log",
      out_file: "/home/ubuntu/logs/traksure-api-out.log",
      error_file: "/home/ubuntu/logs/traksure-api-error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,

      // Process management
      min_uptime: "10s",
      max_restarts: 10,

      // Advanced
      node_args: "--max-old-space-size=1024",
    },
  ],
};
