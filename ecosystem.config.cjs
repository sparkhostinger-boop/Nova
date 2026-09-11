module.exports = {
  apps: [
    {
      name: "nova-panel",
      script: "npm",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1024M",
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || 6767
      }
    }
  ]
};
