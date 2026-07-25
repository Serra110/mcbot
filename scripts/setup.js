#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const skipInstall = process.argv.includes('--skip-install');

function log(msg) {
  console.log(`[mcbot] ${msg}`);
}

function checkNode() {
  const version = process.versions.node;
  const major = parseInt(version.split('.')[0], 10);
  if (major < 18) {
    console.error(`[mcbot] ERROR: Node.js 18+ required (you have v${version})`);
    console.error('        Download from https://nodejs.org/');
    process.exit(1);
  }
  log(`Node.js v${version} detected`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`Folder "${path.relative(ROOT, dir)}/" created`);
  }
}

function ensureEnv() {
  const example = path.join(ROOT, '.env.example');
  const env = path.join(ROOT, '.env');

  if (!fs.existsSync(example)) {
    log('Warning: .env.example not found — skipping .env creation');
    return;
  }

  if (fs.existsSync(env)) {
    log('.env already exists — nothing changed');
    return;
  }

  fs.copyFileSync(example, env);
  log('.env created from .env.example');
  log('>>> Open .env and fill in your server details <<<');
}

function npmInstall() {
  try {
    log('Installing dependencies...');
    execSync('npm install', { cwd: ROOT, stdio: 'inherit' });
    log('Dependencies installed successfully');
  } catch (e) {
    console.error('[mcbot] ERROR: Failed to install dependencies');
    console.error('        Try manually: npm install');
    process.exit(1);
  }
}

function printNextSteps() {
  console.log('');
  console.log('========================================');
  console.log('  Setup completed successfully!');
  console.log('========================================');
  console.log('');
  console.log('Next steps:');
  console.log('');
  console.log('  1. Open the .env file and configure your Minecraft server host/port');
  console.log('  2. Install and start Ollama:');
  console.log('     - Download: https://ollama.com/');
  console.log('     - Run: ollama pull llama3.1:8b');
  console.log('  3. Start the bot:');
  console.log('     - Windows:   .\\scripts\\start.ps1');
  console.log('     - Linux/Mac: bash scripts/start.sh');
  console.log('     - Or simply: npm start');
  console.log('');
  console.log('Minecraft chat commands:');
  console.log('  follow me | mine stone | stop | status | !budget | !remember');
  console.log('');
}

function main() {
  log('Starting setup...');
  console.log('');
  checkNode();
  ensureDir(path.join(ROOT, 'data'));
  ensureEnv();

  if (!skipInstall) {
    npmInstall();
  }

  printNextSteps();
}

main();
