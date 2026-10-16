// scripts/dev.js - Root development runner for AI Career Coach
const { spawn } = require('child_process');
const path = require('path');
const net = require('net');

console.log('====================================================');
console.log(' 🚀 AI Career Coach Runner');
console.log('====================================================\n');

function isPortInUse(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(400);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function main() {
  const backendInUse = await isPortInUse(3001) || await isPortInUse(3001, '::1');
  const frontendInUse = await isPortInUse(5173) || await isPortInUse(5173, '::1');

  if (backendInUse) {
    console.log('✅ Backend API is already active on http://localhost:3001');
  } else {
    console.log('📡 Starting Backend API on http://localhost:3001...');
    const backend = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, '..', 'server'),
      shell: true,
      stdio: 'inherit'
    });
    backend.on('error', (err) => console.error('Backend process error:', err));
  }

  if (frontendInUse) {
    console.log('✅ Frontend UI is already active on http://localhost:5173');
  } else {
    console.log('💻 Starting Frontend UI on http://localhost:5173...');
    const frontend = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, '..', 'client'),
      shell: true,
      stdio: 'inherit'
    });
    frontend.on('error', (err) => console.error('Frontend process error:', err));
  }

  console.log('\n====================================================');
  console.log(' ✨ AI Career Coach is Ready!');
  console.log(' 👉 Open your web browser: http://localhost:5173');
  console.log('====================================================\n');
}

main().catch(console.error);
