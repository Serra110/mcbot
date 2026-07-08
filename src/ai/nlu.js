const router = require('./llm-router');
const { extractJson } = require('./json-extract');
const logger = require('../utils/logger');

const SYSTEM_PROMPT = `Es o cerebro de um bot de Minecraft. A tua unica funcao e converter
o que um jogador escreve no chat numa acao estruturada em JSON.

Acoes possiveis (usa exatamente estes nomes):
- "follow"   {action:"follow", target:"<nome_do_jogador_ou_vazio>"}
- "goto"     {action:"goto", x:<num>, y:<num>, z:<num>}
- "mine"     {action:"mine", block:"<nome_do_bloco_em_ingles_minecraft>", amount:<num>}
- "craft"    {action:"craft", item:"<nome_do_item_em_ingles_minecraft>", amount:<num>}
- "stop"     {action:"stop"}
- "status"   {action:"status"}
- "build"    {action:"build", description:"<descricao_curta_do_que_construir>"}
- "chat"     {action:"chat", reply:"<resposta_curta_e_simpatica_em_portugues>"}
- "unknown"  {action:"unknown"}

Regras:
- Responde APENAS com um objeto JSON valido, nada mais.
- Nomes de blocos/itens devem ser os nomes internos do Minecraft em ingles (ex: "oak_log", "cobblestone", "iron_ore").
- Se o pedido for so conversa/pergunta sem intencao de acao no jogo, usa "chat".
- Se nao perceberes a intencao, usa "unknown".
- "amount" por defeito e 1 se nao for especificado.`;


async function parseIntent(playerMessage, playerName) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `Jogador "${playerName}" disse: "${playerMessage}"` },
  ];

  try {
    const raw = await router.ask(messages, { tier: 'simple', jsonMode: true, temperature: 0.2 });
    const parsed = extractJson(raw);
    if (!parsed || typeof parsed.action !== 'string') {
      throw new Error('JSON devolvido nao tem o formato esperado (falta "action").');
    }
    logger.debug('[nlu] intent:', parsed);
    return parsed;
  } catch (err) {
    logger.warn('[nlu] falha ao interpretar mensagem, a usar fallback "unknown":', err.message);
    return { action: 'unknown' };
  }
}

module.exports = { parseIntent };
