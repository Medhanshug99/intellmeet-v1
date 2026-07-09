const { execSync } = require('child_process');

function killPort(port) {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`).toString();
    const lines = output.split('\n').filter(line => line.includes(`LISTENING`));
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') {
        console.log(`Killing PID ${pid} for port ${port}`);
        try {
          execSync(`taskkill /F /PID ${pid}`);
        } catch (err) {

        }
      }
    }
  } catch (e) {
    console.log(`No process found on port ${port} or failed to kill.`);
  }
}

[3000, 3005, 5000, 5005].forEach(killPort);
