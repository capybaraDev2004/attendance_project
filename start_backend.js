const { spawn } = require('child_process');
const path = require('path');

console.log('Starting backend server...');

const backendPath = path.join(__dirname, 'backend');
const child = spawn('npm', ['start'], {
    cwd: backendPath,
    stdio: 'inherit',
    shell: true
});

child.on('error', (error) => {
    console.error('Error starting backend:', error);
});

child.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
    console.log('\nStopping backend...');
    child.kill('SIGINT');
    process.exit(0);
});
