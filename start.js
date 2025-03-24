const { spawn } = require('child_process');

// Spawn node process with increased memory limit
const child = spawn('node', ['--max-old-space-size=4096', 'app.js'], {
  stdio: 'inherit'
});

child.on('error', (err) => {
  console.error('Failed to start child process:', err);
});

child.on('exit', (code, signal) => {
  if (code) console.log(`Child process exited with code ${code}`);
  if (signal) console.log(`Child process killed with signal ${signal}`);
}); 