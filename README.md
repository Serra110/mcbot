# Minecraft AI Bot
# It is impossible to try the project without building it, I am sorry but its a bot.

A Minecraft bot powered by AIthat can chat with players, mine resources, craft items, build structures, fight mobs, and perform complex tasks automatically.

By default, the bot uses **Ollama** to run AI models locally (free). For more demanding tasks, you can optionally enable **Hack Club AI** to use larger paid models while tracking your monthly spending.

---

## Features

-  Fast built-in commands without AI
-  AI-powered command understanding
-  Automatic mining
-  Crafting support
-  Automatic combat against hostile mobs
-  Player following and navigation
-  Memory system (`!remember` / `!lembrar`)
-  Hack Club AI budget tracking (`!budget` / `!orcamento`)
- 🇵🇹 Portuguese and English command support at least on theory, if english doesnt work, use portuguese. ronaldo suuuu.

---

# Requirements


- Node.js 18+ Required to run the bot 
- Minecraft Java Server Local or remote server , i use paper 
ollama, i used the 3b model
 Hack Club AI API Key  Optional  Only if using paid AI models 

Download Node.js:

https://nodejs.org/

---

# Installation

## Clone the repository

```bash
git clone https://github.com/Serra110/mcbot.git
cd mcbot
```

### Windows

```powershell
.\scripts\setup.ps1
```

or you can use in vscode terminal with the folder mcbot open:

```bash
npm install mineflayer mineflayer-pathfinder minecraft-data dotenv @openrouter/sdk
```
### Linux / macOS

```bash
bash scripts/setup.sh
```
it will:

- Install all npm dependencies
- Create the `data/` folder

# Configuration

Edit the .env file.

env
MC_HOST=localhost
MC_PORT=25565
MC_USERNAME=YourBotName
MC_AUTH=offline

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:3b


# AI Providers

## Ollama (Free)

Ollama is the default AI provider.

Install Ollama:

https://ollama.com/

Download a model:

```bash
ollama pull llama3.1:3b
```

or

```bash
ollama pull llama3.1:8b
```

Make sure Ollama is running before starting the bot.

---

## Hack Club AI (Optional)

Hack Club AI lets the bot use larger paid models for more complex tasks.
Simple commands continue to use Ollama.
Enable it inside `.env`:
```env
HACKCLUB_ENABLED=true
HACKCLUB_API_KEY=YOUR_KEY
```
You can also set a monthly spending limit.
# Running the Bot

Start your Minecraft server.

*(Tested on Paper 1.20.1)*

Start Ollama.

Run the bot:

```bash
npm start
```

Or use the provided scripts.

### Windows

```powershell
.\scripts\start.ps1
```

### Linux / macOS

```bash
bash scripts/start.sh
```

Join the Minecraft server and chat with the bot.

---

# Commands
 follow me  Follow the nearest player 
 stop Stop the current task
 status  Show current activity 
 mine stone 10  Mine 10 stone blocks 
 build a small house  Build a small house 
 !remember Show stored memory 
!budget  Show Hack Club AI usage 

If a command isn't recognized, try translating it to Portuguese.


# Testing

## 1. Start a Minecraft server

Set:

```properties
online-mode=false
```

inside `server.properties`.

---

## 2. Start Ollama

```bash
ollama pull llama3.1:3b
```

then

```bash
ollama serve
```

---

## 3. Start the bot

```bash
npm start
```

Expected output:

```
Bot connected to localhost:25565
```

---

## 4. Join the server

Open Minecraft and connect to:

```
localhost:25565
```

---

## 5. Try these commands

```
follow me

mine stone 10

status

stop

!remember

!budget
```

---


# Troubleshooting


 ECONNREFUSED | Check that the Minecraft server is running and the host/port are correct. 
 Ollama isn't responding | Verify that Ollama is running and the selected model is installed. 
 Bot gets kicked | Set `online-mode=false` and use `MC_AUTH=offline`. 
 AI doesn't understand commands | Set `LOG_LEVEL=debug` inside `.env`. 
 Missing dependencies | Run `npm install`. 


# Dependencies

### npm packages

- mineflayer
- mineflayer-pathfinder
- minecraft-data
- dotenv
- @openrouter/sdk
 ```bash
npm install mineflayer mineflayer-pathfinder minecraft-data dotenv @openrouter/sdk
```
### External software

- Node.js 18+
- Minecraft Java Edition
- Ollama 
- Hack Club AI API Key (optional)

---
### Disclaimer
AI was used to debug and also inline was used.


