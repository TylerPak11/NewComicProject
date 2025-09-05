const { spawn } = require('child_process');
const { createServer } = require('http');

// Wait for port to be available
function waitForPort(port, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    function check() {
      const req = createServer().listen(port, () => {
        req.close();
        resolve();
      });
      
      req.on('error', () => {
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Port ${port} not available after ${timeout}ms`));
        } else {
          setTimeout(check, 100);
        }
      });
    }
    
    check();
  });
}

async function startElectronDev() {
  console.log('Starting Next.js development server...');
  
  // Start Next.js dev server
  const nextProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'pipe',
    shell: true
  });
  
  let electronStarted = false;
  
  // Wait for Next.js to be ready
  nextProcess.stdout.on('data', async (data) => {
    const output = data.toString();
    console.log(output);
    
    if ((output.includes('Ready in') || output.includes('Local:')) && !electronStarted) {
      electronStarted = true;
      console.log('Next.js ready! Starting Electron...');
      
      // Start Electron
      const electronProcess = spawn('electron', ['.'], {
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, NODE_ENV: 'development' }
      });
      
      electronProcess.on('close', () => {
        console.log('Electron closed, stopping Next.js...');
        nextProcess.kill();
        process.exit(0);
      });
    }
  });
  
  nextProcess.stderr.on('data', (data) => {
    console.error('Next.js error:', data.toString());
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('Shutting down...');
    nextProcess.kill();
    process.exit(0);
  });
}

startElectronDev().catch(console.error);