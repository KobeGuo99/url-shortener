module.exports = {
  apps: [
    {
      name: 'linklift-backend',
      cwd: '/home/ec2-user/url-shortener/backend',
      script: 'src/server.js',
      instances: 1,
      exec_mode: 'fork',
      exp_backoff_restart_delay: 1000,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
