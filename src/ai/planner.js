const router = require('./llm-router');
const { extractJson } = require('./json-extract');
const logger = require('../utils/logger');

const SYSTEM_PROMPT = `Es o planeador de tarefas de um bot de Minecraft.
Recebes uma descricao de algo que o jogador quer (ex: "constroi uma casinha simples")
e deves devolver uma lista de passos simples, cada um sendo um comando ja suportado pelo bot.

Comandos suportados por passo:
- {"action":"mine","block":"<bloco_ingles>","amount":<num>}
- {"action":"craft","item":"<item_ingles>","amount":<num>}
- {"action":"goto","x":<num>,"y":<num>,"z":<num>}
- {"action":"place","block":"<bloco_ingles>","x":<num>,"y":<num>,"z":<num>}

Responde APENAS com JSON no formato: {"steps": [ {...}, {...} ]}
Mantem o plano curto (max 8 passos) e realista para o Minecraft vanilla.`;

async function makePlan(description, context = {}) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Pedido: "${description}"\nContexto atual do bot: ${JSON.stringify(context)}`,
    },
  ];

  try {
    const raw = await router.ask(messages, {
      tier: 'complex',
      jsonMode: true,
      temperature: 0.5,
      maxTokens: 700,
    });
    const parsed = extractJson(raw);
    return Array.isArray(parsed.steps) ? parsed.steps : [];
  } catch (err) {
    logger.warn('[planner] falha ao gerar plano:', err.message);
    return [];
  }
}

module.exports = { makePlan };
