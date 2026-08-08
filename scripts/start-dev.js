import { spawn } from 'child_process';

console.log('[SimTrace] Launching backend API (port 4000) & Next.js frontend (port 3000)...');

const backend = spawn('npx', ['tsx', 'backend/server.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: '4000',
    JWT_SECRET: process.env.JWT_SECRET || 'simtrace_secret_dev_key_2026',
    MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/simtrace',
  },
});

const frontend = spawn('npx', ['next', 'dev', '-p', '3000', '-H', '0.0.0.0'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: '3000',
  },
});

process.on('SIGINT', () => {
  backend.kill('SIGINT');
  frontend.kill('SIGINT');
  process.exit();
});

process.on('SIGTERM', () => {
  backend.kill('SIGTERM');
  frontend.kill('SIGTERM');
  process.exit();
});
