const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

console.log('\x1b[36m%s\x1b[0m', '=======================================================');
console.log('\x1b[36m%s\x1b[0m', '  🚀 Starting Dispatch Platform Dev Environment');
console.log('\x1b[36m%s\x1b[0m', '  Backend:  http://localhost:4000/api');
console.log('\x1b[36m%s\x1b[0m', '  Swagger:  http://localhost:4000/api/docs');
console.log('\x1b[36m%s\x1b[0m', '  Frontend: http://localhost:3000');
console.log('\x1b[36m%s\x1b[0m', '=======================================================\n');

function runService(name, command, args, cwd, color) {
  const child = spawn(command, args, {
    cwd,
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' },
  });

  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.log(`${color}[${name}]\x1b[0m ${line}`);
      }
    });
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.error(`${color}[${name}]\x1b[0m ${line}`);
      }
    });
  });

  child.on('close', (code) => {
    console.log(`${color}[${name}]\x1b[0m process exited with code ${code}`);
  });

  return child;
}

const backendProcess = runService(
  'BACKEND',
  'npm',
  ['run', 'start:dev'],
  path.join(rootDir, 'backend'),
  '\x1b[34m', // Blue
);

const frontendProcess = runService(
  'FRONTEND',
  'npm',
  ['run', 'dev'],
  path.join(rootDir, 'frontend'),
  '\x1b[32m', // Green
);

function cleanup() {
  console.log('\n\x1b[33m%s\x1b[0m', 'Shutting down dev processes...');
  backendProcess.kill('SIGINT');
  frontendProcess.kill('SIGINT');
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
