// PM2 Ecosystem Configuration for Production Deployment

export default {
  apps: [
    {
      name: 'sentia-dashboard',
      script: './server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_test: {
        NODE_ENV: 'test',
        PORT: 5001
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      max_memory_restart: '1G',
      max_restarts: 10,
      min_uptime: '10s',
      
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Auto-restart on file changes (development only)
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'dist', '.git'],
      
      // Advanced features
      merge_logs: true,
      autorestart: true,
      vizion: true
    },
    {
      name: 'agent-orchestrator',
      script: './agents/autonomous-orchestrator.js',
      instances: 1,
      exec_mode: 'fork',
      cron_restart: '0 */6 * * *', // Restart every 6 hours
      env: {
        NODE_ENV: 'production',
        AGENT_MODE: 'autonomous',
        CYCLE_INTERVAL: 300000 // 5 minutes
      },
      error_file: './logs/agents-err.log',
      out_file: './logs/agents-out.log',
      time: true,
      max_memory_restart: '500M',
      autorestart: true
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: 'railway',
      ref: 'origin/production',
      repo: 'git@github.com:The-social-drink-company/sentia-manufacturing-dashboard.git',
      path: '/app',
      'post-deploy': 'npm install --production && pm2 reload ecosystem.config.js --env production',
      'pre-deploy-local': 'npm test'
    },
    test: {
      user: 'deploy',
      host: 'railway',
      ref: 'origin/test',
      repo: 'git@github.com:The-social-drink-company/sentia-manufacturing-dashboard.git',
      path: '/app',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env test'
    },
    development: {
      user: 'deploy',
      host: 'railway',
      ref: 'origin/development',
      repo: 'git@github.com:The-social-drink-company/sentia-manufacturing-dashboard.git',
      path: '/app',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env development'
    }
  }
};