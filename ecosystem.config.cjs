module.exports = {
  apps: [
    {
      name: 'linklift-backend',
      cwd: '/home/ec2-user/url-shortener/backend',
      script: 'src/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
