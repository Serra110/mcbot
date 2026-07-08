Minecraft AI Bot
YOU NEED NODE.JS https://nodejs.org/pt/download

A Minecraft bot that connects to a server, reads chat messages, and performs actions like following players, mining blocks, crafting items, and building structures using natural language commands.

By default, it uses Ollama for local AI processing. You can also enable Hack Club AI for more complex tasks, with an optional monthly spending limit.

Features
Natural language commands
Fast built-in commands (follow me, mine stone, stop, status) without using AI
AI-powered command understanding for more complex requests
Multi-step planning for building and larger tasks
Automatic combat against hostile mobs
Memory system (!remember or !lembrar since i programmed for portuguese use) to store useful information
API budget tracking (!budget, maybe !orcamento since i programmed this on portuguese) for Hack Club AI usage
Requirements

-Node.js	version 18+	
-Minecraft Server	Any	Local or online (online-mode=false for offline authentication)
Ollama	Any	Recommended local AI ( i used 3b since my pc aint that good)
Hack Club AI API Key	Optional	Required only if HACKCLUB_ENABLED=true
Installation
# Windows (PowerShell):
git clone https://github.com/Serra110/mcbot.git |
cd mcbot |
.\scripts\setup.ps1
# Linux / macOS
git clone https://github.com/Serra110/mcbot.git |
cd mcbot | 
bash scripts/setup.sh


The setup script installs dependencies, creates the data/ folder, and copies .env.example to .env.

Configuration

Edit the .env file:

MC_HOST=localhost
MC_PORT=25565
MC_USERNAME= change 
MC_AUTH=offline

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:3b
# IF Using Ollama
Install Ollama.
Download a model:
ollama pull llama3.1:3b
Make sure Ollama is running.
# IF using hack club AI
check .env file since it explains it well.

Hack Club AI is only used for more demanding tasks such as planning large builds. Regular commands continue to use Ollama.

# Running the Bot

Start your Minecraft server. ( i used paper 1.20.1)

Start Ollama.

## Run the bot:

npm start

Or use the provided scripts.

Windows:

.\scripts\start.ps1

Linux/macOS:

bash scripts/start.sh

Then join the server and type commands in chat.

Command	Description, if it doesnt work translate to portuguese
follow me	Follow the nearest player
mine stone 10	Mine 10 stone blocks
stop	Cancel the current task
status	Show the bot's current activity
build a small house	Generate and execute a building plan
!budget	Show this month's API usage
!remember	Display stored memory






Troubleshooting
Problem	Solution
ECONNREFUSED	Check that the Minecraft server is running and the host/port are correct.
Ollama isn't responding	Make sure Ollama is running and the selected model is installed.
Bot gets kicked	Use MC_AUTH=offline and set online-mode=false in server.properties.
AI doesn't understand commands	Set LOG_LEVEL=debug in .env to view detailed logs.
License:

MIT
