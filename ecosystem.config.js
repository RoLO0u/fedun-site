module.exports = {
  apps: [
    {
      name: 'fedun-site',
      script: 'server.js',
      cwd: '/home/ubuntu/my-app',
      instances: 1,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
