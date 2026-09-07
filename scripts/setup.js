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
    console.error('Download from https://nodejs.org/');
    process.exit(1);
  }
  log(`Node.js v${version} detected`);
}
npm 
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
    log('Warning: .env.example not found, skipping .env creation');
    return;
  }

  if (fs.existsSync(env)) {
    log('.env already exists');
    return;
  }

  fs.copyFileSync(example, env);
  log('.env created from .env.example');
  log('>>> Open .env and configure it <<<');
}

function npmInstall() {
  try {
    log('Installing dependencies...');
    execSync('npm install', { cwd: ROOT, stdio: 'inherit' });
    log('Dependencies installed successfully');  
  } catch (e) {
    console.error('[mcbot] ERROR: Failed to install dependencies');
    console.error('Try manually: npm install');
    process.exit(1);
  }
}

function printNextSteps() {
  console.log('');
  console.log('  Setup completed successfully');
  console.log('');
  console.log('Next steps:');
  console.log('');
  console.log('Open the .env file and configure it');
  console.log('Install Ollama and:');
  console.log('Download: https://ollama.com/');
  console.log('Run: ollama pull llama3.1:8b');
  console.log('Then Start the bot:');
  console.log('- Windows:   .\\scripts\\start.ps1');
  console.log('- Linux/Mac: bash scripts/start.sh');
  console.log('or npm start');
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
