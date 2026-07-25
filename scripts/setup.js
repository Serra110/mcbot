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
    console.error(`[mcbot] ERRO: Node.js 18+ necessario (tens v${version})`);
    console.error('        Descarrega em https://nodejs.org/');
    process.exit(1);
  }
  log(`Node.js v${version} detectado`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`Pasta "${path.relative(ROOT, dir)}/" criada`);
  }
}

function ensureEnv() {
  const example = path.join(ROOT, '.env.example');
  const env = path.join(ROOT, '.env');

  if (!fs.existsSync(example)) {
    log('Aviso: .env.example nao encontrado — salta criacao do .env');
    return;
  }

  if (fs.existsSync(env)) {
    log('.env ja existe — nada alterado');
    return;
  }

  fs.copyFileSync(example, env);
  log('.env criado a partir de .env.example');
  log('>>> Abre o .env e preenche os dados do teu servidor <<<');
}

function npmInstall() {
  try {
    log('A instalar dependencias...');
    execSync('npm install', { cwd: ROOT, stdio: 'inherit' });
    log('Dependencias instaladas com sucesso');
  } catch (e) {
    console.error('[mcbot] ERRO: Falhou ao instalar dependencias');
    console.error('        Tenta manualmente: npm install');
    process.exit(1);
  }
}

function printNextSteps() {
  console.log('');
  console.log('========================================');
  console.log('  Setup concluido com sucesso!');
  console.log('========================================');
  console.log('');
  console.log('Proximos passos:');
  console.log('');
  console.log('  1. Abre o ficheiro .env e configura o host/porta do teu servidor Minecraft');
  console.log('  2. Instala e arranca o Ollama:');
  console.log('     - Descarrega: https://ollama.com/');
  console.log('     - Corre: ollama pull llama3.1:8b');
  console.log('  3. Arranca o bot:');
  console.log('     - Windows:   .\\scripts\\start.ps1');
  console.log('     - Linux/Mac: bash scripts/start.sh');
  console.log('     - Ou simplesmente: npm start');
  console.log('');
  console.log('Comandos no chat do Minecraft:');
  console.log('  segue-me | minera pedra | para | status | !orcamento | !lembra');
  console.log('');
}

function main() {
  log('A iniciar setup...');
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
