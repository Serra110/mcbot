#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const skipInstall = process.argv.includes('--skip-install');

function log(msg) {
  console.log(`[setup] ${msg}`);
}

function warn(msg) {
  console.warn(`[setup] AVISO: ${msg}`);
}

function checkNode() {
  const version = process.versions.node;
  const major = parseInt(version.split('.')[0], 10);
  if (major < 18) {
    console.error(`[setup] ERRO: Node.js 18+ necessario (tens v${version}).`);
    console.error('       Descarrega em https://nodejs.org/');
    process.exit(1);
  }
  log(`Node.js v${version} OK`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`Pasta criada: ${path.relative(ROOT, dir)}`);
  }
}

function ensureEnv() {
  const example = path.join(ROOT, '.env.example');
  const env = path.join(ROOT, '.env');

  if (!fs.existsSync(example)) {
    warn('.env.example nao encontrado — salta criacao do .env');
    return;
  }

  if (fs.existsSync(env)) {
    log('.env ja existe — nao foi alterado');
    return;
  }

  fs.copyFileSync(example, env);
  log('.env criado a partir de .env.example — edita com os teus valores');
}

function npmInstall() {
  log('A instalar dependencias npm...');
  execSync('npm install', { cwd: ROOT, stdio: 'inherit' });
  log('Dependencias instaladas');
}

function printNextSteps() {
  console.log('');
  console.log('=== Setup concluido ===');
  console.log('');
  console.log('Proximos passos:');
  console.log('  1. Edita o ficheiro .env com o host/porta do teu servidor Minecraft');
  console.log('  2. Instala e arranca o Ollama: https://ollama.com/');
  console.log('     ollama pull llama3.1:8b');
  console.log('  3. Arranca o bot:');
  console.log('       npm start');
  console.log('');
  console.log('Comandos no chat do Minecraft:');
  console.log('  segue-me | minera pedra | para | status | !orcamento | !lembra');
  console.log('');
}

function main() {
  log('A iniciar setup do mcbot...');
  checkNode();
  ensureDir(path.join(ROOT, 'data'));
  ensureEnv();

  if (!skipInstall) {
    npmInstall();
  }

  printNextSteps();
}

main();
