# Minecraft AI Bot

Bot de Minecraft com IA que conversa com jogadores, minera recursos, fabrica itens, constroi estruturas, luta contra mobs e executa tarefas complexas automaticamente.

Usa **Ollama** por padrao (gratuito, modelos locais). Para tarefas mais exigentes, podes ativar opcionalmente o **Hack Club AI** (modelos pagos maiores com tracking de gastos).

---

## Features

- Comandos rapidos integrados (sem IA)
- Compreensao de comandos por IA
- Mineração automatica
- Fabricacao de itens
- Combate automatico contra mobs hostis
- Seguimento de jogadores e navegacao
- Sistema de memoria (`!remember` / `!lembrar`)
- Tracking de gastos Hack Club AI (`!budget` / `!orcamento`)
- Suporte a comandos em portugues e ingles

---

## Requirements

- Node.js 18+ — [Descarregar](https://nodejs.org/)
- Minecraft Java Edition Server (local ou remoto, testado em Paper 1.20.1)
- Ollama — [Descarregar](https://ollama.com/) (obrigatorio)
- Hack Club AI API Key (opcional, apenas para modelos pagos)

---

## Installation

### Opcao 1: Download direto (sem git)

1. Vai a [Releases](https://github.com/Serra110/mcbot/releases)
2. Descarrega o ficheiro para a tua plataforma:
   - **Windows**: `mcbot-vX.X.X.zip`
   - **Linux/Mac**: `mcbot-vX.X.X.tar.gz`
3. Descompacta e entra na pasta

### Opcao 2: Clonar o repositorio

```bash
git clone https://github.com/Serra110/mcbot.git
cd mcbot
```

### Setup (ambas as opcoes)

#### Windows

```powershell
.\scripts\setup.ps1
```

#### Linux / macOS

```bash
bash scripts/setup.sh
```

O setup vai:
- Verificar que tens Node.js 18+
- Criar a pasta `data/`
- Criar o ficheiro `.env` a partir do exemplo
- Instalar todas as dependencias npm

---

## Configuration

Abre o ficheiro `.env` e configura os dados do teu servidor:

```env
MC_HOST=localhost
MC_PORT=25565
MC_USERNAME=YourBotName
MC_AUTH=offline

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
```

---

## AI Providers

### Ollama (Gratuito)

Ollama e o provider de IA por padrao.

1. Instala o Ollama: https://ollama.com/
2. Descarrega um modelo:
   ```bash
   ollama pull llama3.1:8b
   ```
3. Garante que o Ollama esta a correr antes de iniciar o bot

### Hack Club AI (Opcional)

Usa modelos pagos maiores para tarefas mais complexas. Comandos simples continuam a usar Ollama.

Ativa no `.env`:

```env
HACKCLUB_ENABLED=true
HACKCLUB_API_KEY=YOUR_KEY
```

Tambem podes definir um limite mensal de gastos.

---

## Running the Bot

1. Inicia o teu servidor Minecraft
2. Inicia o Ollama
3. Corre o bot:

```bash
npm start
```

Ou usa os scripts:

#### Windows

```powershell
.\scripts\start.ps1
```

#### Linux / macOS

```bash
bash scripts/start.sh
```

Entra no servidor Minecraft e conversa com o bot no chat.

---

## Commands

| Comando | Descricao |
|---------|-----------|
| `follow me` | Segue o jogador mais proximo |
| `stop` | Para a tarefa atual |
| `status` | Mostra atividade atual |
| `mine stone 10` | Minera 10 blocos de pedra |
| `build a small house` | Constroi uma casa pequena |
| `!remember` | Mostra memoria guardada |
| `!budget` | Mostra gastos Hack Club AI |

Se um comando nao for reconhecido, tenta traduzi-lo para portugues.

---

## Testing

### 1. Inicia o servidor Minecraft

Ativa no `server.properties`:

```properties
online-mode=false
```

### 2. Inicia o Ollama

```bash
ollama pull llama3.1:8b
ollama serve
```

### 3. Inicia o bot

```bash
npm start
```

Saida esperada:

```
Bot connected to localhost:25565
```

### 4. Entra no servidor

Abre o Minecraft e liga-se a:

```
localhost:25565
```

### 5. Testa estes comandos

```
follow me
mine stone 10
status
stop
!remember
!budget
```

---

## Troubleshooting

| Problema | Solucao |
|----------|---------|
| `ECONNREFUSED` | Verifica se o servidor Minecraft esta a correr e se host/porta estao corretos |
| Ollama nao responde | Verifica se o Ollama esta a correr e se o modelo esta instalado |
| Bot e expulso | Ativa `online-mode=false` e usa `MC_AUTH=offline` |
| IA nao entende comandos | Ativa `LOG_LEVEL=debug` no `.env` |
| Dependencias em falta | Corre `npm install` |

---

## Dependencies

### npm packages

- mineflayer
- mineflayer-pathfinder
- minecraft-data
- dotenv
- @openrouter/sdk

### External software

- Node.js 18+
- Minecraft Java Edition
- Ollama
- Hack Club AI API Key (opcional)

---

### Disclaimer

Este projeto foi desenvolvido com auxilio de ferramentas de IA para debugging e programacao.
