# Minecraft AI Bot

A Minecraft bot powered by AI that can chat with players, mine resources, craft items, build structures, fight mobs, and perform complex tasks automatically.

Uses **Ollama** by default (free, local models). For more demanding tasks, you can optionally enable **Hack Club AI** (larger paid models with spending tracking).

---

## Features

- Fast built-in commands (no AI needed)
- AI-powered command understanding
- Automatic mining
- Crafting support
- Automatic combat against hostile mobs
- Player following and navigation
- Memory system (`!remember`)
- Hack Club AI budget tracking (`!budget`)
- Portuguese and English command support. If English doesn't work, use Portuguese. ronaldo suuuu.

---

## Requirements

- Node.js 18+ — [Download](https://nodejs.org/)
- Minecraft Java Edition Server (local or remote, tested on Paper 1.20.1)
- Ollama — [Download](https://ollama.com/) (required)
- Hack Club AI API Key (optional, only for paid models)

---

## Installation

### Easiest way: one script does everything

1. Go to [Releases](https://github.com/Serra110/mcbot/releases)
2. Download the file for your platform:
   - **Windows**: `mcbot-vX.X.X.zip`
   - **Linux/Mac**: `mcbot-vX.X.X.tar.gz`
3. Extract and enter the folder
4. Run the all-in-one script:
   - **Windows**: double-click `setup-and-run.bat`
   - **Linux/Mac**: `bash setup-and-run.sh`

The script will:
- Check you have Node.js 18+
- Install all npm packages (mineflayer, pathfinder, etc.)
- Create `.env` from the example
- Install Ollama if needed
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

Open the `.env` file and configure your server details:

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

### Ollama (Free)

Ollama is the default AI provider.

1. Install Ollama: https://ollama.com/
2. Download a model:
   ```bash
   ollama pull llama3.1:8b
   ```
3. Make sure Ollama is running before starting the bot

### Hack Club AI (Optional)

Uses larger paid models for more complex tasks. Simple commands still use Ollama.

Enable in `.env`:

```env
HACKCLUB_ENABLED=true
HACKCLUB_API_KEY=YOUR_KEY
```

You can also set a monthly spending limit.

---

## Running the Bot

1. Start your Minecraft server
2. Start Ollama
3. Run the bot:

```bash
npm start
```

Or use the scripts:

#### Windows

```powershell
.\scripts\start.ps1
```

#### Linux / macOS

```bash
bash scripts/start.sh
```

Join the Minecraft server and chat with the bot.

---

## Commands

| Command | Description |
|---------|-------------|
| `follow me` | Follow the nearest player |
| `stop` | Stop the current task |
| `status` | Show current activity |
| `mine stone 10` | Mine 10 stone blocks |
| `build a small house` | Build a small house |
| `!remember` | Show stored memory |
| `!budget` | Show Hack Club AI spending |

If a command isn't recognized, try translating it to Portuguese.

---

## Testing

### 1. Start a Minecraft server

Enable in `server.properties`:

```properties
online-mode=false
```

### 2. Start Ollama

```bash
ollama pull llama3.1:8b
ollama serve
```

### 3. Start the bot

```bash
npm start
```

Expected output:

```
Bot connected to localhost:25565
```

### 4. Join the server

Open Minecraft and connect to:

```
localhost:25565
```

### 5. Try these commands

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

| Problem | Solution |
|---------|----------|
| `ECONNREFUSED` | Check that the Minecraft server is running and host/port are correct |
| Ollama not responding | Verify that Ollama is running and the model is installed |
| Bot gets kicked | Enable `online-mode=false` and use `MC_AUTH=offline` |
| AI doesn't understand commands | Set `LOG_LEVEL=debug` in `.env` |
| Missing dependencies | Run `npm install` |

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
- Hack Club AI API Key (optional)

---

### Disclaimer

This project was developed with the help of AI tools for debugging and programming.
