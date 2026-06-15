const { spawn, exec } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = 5173;
const MAX_RETRIES = 20;
const RETRY_INTERVAL = 500;

function checkServer() {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${PORT}`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => { req.destroy(); resolve(false); });
  });
}

async function waitForServer() {
  for (let i = 0; i < MAX_RETRIES; i++) {
    if (await checkServer()) return true;
    await new Promise((r) => setTimeout(r, RETRY_INTERVAL));
  }
  return false;
}

function openApp() {
  const url = `http://localhost:${PORT}`;
  const platform = process.platform;

  let cmd;
  if (platform === 'win32') {
    const chromePaths = [
      process.env.CHROME_PATH,
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
    ].filter(Boolean);

    let chromePath = null;
    const fs = require('fs');
    for (const p of chromePaths) {
      try { if (fs.existsSync(p)) { chromePath = p; break; } } catch {}
    }

    if (chromePath) {
      cmd = `"${chromePath}" --app=${url} --window-size=1440,900`;
    } else {
      cmd = `start "" "${url}"`;
    }
  } else if (platform === 'darwin') {
    const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    const fs = require('fs');
    if (fs.existsSync(chromePath)) {
      cmd = `"${chromePath}" --app=${url} --window-size=1440,900`;
    } else {
      cmd = `open "${url}"`;
    }
  } else {
    cmd = `xdg-open "${url}"`;
  }

  exec(cmd, (err) => {
    if (err) {
      console.log('请手动在浏览器中打开:', url);
    }
  });
}

async function main() {
  console.log('============================================');
  console.log('  材料样本管理系统 - 桌面启动器');
  console.log('============================================');
  console.log();

  const vite = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['vite', '--port', PORT.toString()],
    { stdio: 'inherit', cwd: path.resolve(__dirname) }
  );

  vite.on('error', (err) => {
    console.error('启动失败:', err.message);
    process.exit(1);
  });

  console.log('正在启动服务...');
  const ready = await waitForServer();

  if (ready) {
    console.log('服务已就绪，正在打开应用窗口...');
    openApp();
    console.log('按 Ctrl+C 停止服务');
  } else {
    console.error('服务启动超时，请手动访问 http://localhost:5173');
  }

  process.on('SIGINT', () => {
    vite.kill();
    process.exit(0);
  });
}

main();
