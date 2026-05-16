module.exports = {
  apps: [
    {
      name: "ap",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      cwd: "/var/www/ap",
      env: {
        NODE_ENV: "production",
      },
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
};
