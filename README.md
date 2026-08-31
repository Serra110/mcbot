# Minecraft AI Bot

A minecraft companion bot that uses mineflayer and ollama plus hackclub API key (optional).  

Uses Ollama by default, free but local.If you want to play without using a lot of your pc resources you can use the hackclub API key if you are -19 at https://ai.hackclub.com/

---

## Features

-some commands pre built like follow and mine that use mineflayer and no AI.
-ai that reads and processes the request if isnt undesrtood by the first layer, the prebuilt as said.
-automatic mining if sent by the user (using cheats tho and can see blocks even if not seen by default)
-combats mobs if they come near the bot (since its considered a player as well)
-Follows the player if sent as well, can bug sometimes and go through a bad path and end up stuck but thats the plugin, mineflayer fault and I couldnt find a good fix, only to reset if it doesnt move.
-memory system, !remember 
-checks the budget that you have with the api key of hackclub AI, probably works with OpenRouter as well (!budget)
Portuguese and english support, since the bot was first made with portuguese, because I am portuguese but then i synced with english, but there might be a few problems, if something doesnt work, try doing it in portuguese, even tho i dont think anything bad will happen.

---

## Requirements

- Node.js 18+ — [Download](https://nodejs.org/)
- Minecraft Java Server (tested on Paper 1.20.1)
- Ollama — [Download](https://ollama.com/) (required)
- Hack Club AI API Key (optional, only for paid models)

---

## Installation

### Easiest way:

1. Go to [Releases](https://github.com/Serra110/mcbot/releases)
2. Download the file for your platform:
   - **Windows**: `mcbot-vX.X.X.zip`
   - **Linux/Mac**: `mcbot-vX.X.X.tar.gz`
4. Run the all-in-one script:
   - **Windows**: double-click `setup-and-run.bat`
   - **Linux/Mac**: `bash setup-and-run.sh`
this will:
- Check you have Node.js 18+
- Install all npm packages, like mineflayer
- Create .env from the example
- Pull the AI model (llama3.1:8b)
- Start the bot 

### Manual setup

#### Clone the repository

```bash
git clone https://github.com/Serra110/mcbot.git
cd mcbot
```

#### Windows

```powershell
.\scripts\setup.ps1
```

#### Linux / macOS

```bash
bash scripts/setup.sh
```

---

## Configuration

Open the `.env` file and configure. (All the API keys, ips etc go here)

---

## AI Providers

### Ollama
Download a model:
   ```bash
   ollama pull llama3.1:8b
   ```
Run it before the bot too if you get any problems and it doesnt start for you.

### Hack Club AI (Optional)

Enable in `.env`:

```env
HACKCLUB_ENABLED=true
HACKCLUB_API_KEY=YOUR_KEY
```
You can also set a limit.

---

## Running the Bot
Make sure the server is on
1.Start Ollama
2.Run the bot:

```bash
npm start
```

Or use the scripts said above.

---

## Commands

| Command | Description |
|---------|-------------|
| `follow me` | self explanatory |
| `stop` | also self explanatory  |
| `status` | show current activity |
| `mine x value` | self explanatory |
| `build X` | probably works but not very well most of the times |
| `!remember` | show memory |
| `!budget` | as said before checks the budget that you have at Hackclub AI |

if something doesnt work remember that as I said this was programmed first in portuguese so that might work, for what i tested everything works tho.

---
When you run the bot you should receive this at the terminal:

```
Bot connected to localhost:25565
```
if it doesnt something is very wrong :) and it probably wont join the server, if it does maybe it was a cosmic ra that flipped a bit or some dark magic

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ECONNREFUSED` | check that server is on or if you put the right stuff at the env file |
| Ollama not responding | check if its running and installed, if both are its probably cause you have a bad pc |
| Bot gets kicked | the bot is considered as a pirate cause he doesnt have legitimate minecraft so u gotta put online mode false, note that it does violate the minecraft EULA |
| AI doesn't understand commands | Set `LOG_LEVEL=debug` in `.env` |
| Missing dependencies | Run `npm install` |

---

## Dependencies

npm packages:

- mineflayer (the minecraft part of the bot)
- mineflayer-pathfinder (pathfinder)
- minecraft-data (yes)
- dotenv ( for env file)
- @openrouter/sdk (cause hackclub ai uses this normally)

### External software

- Node.js 18+
- Minecraft Java 
- Ollama
- Hack Club AI API Key (optional as said)

---

### Disclaimer

This project was developed with the help of AI tools for debugging and programming.
