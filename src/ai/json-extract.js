function extractJson(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Resposta vazia ou invalida do LLM.');
  }

  let text = rawText.trim();

  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  text = text.replace(/^```[a-zA-Z]*\s*/,'').replace(/```\s*$/, '').trim();

  if (!/^[\{\[]/.test(text)) {
    const match = text.match(/[\{\[][\s\S]*[\}\]]/);
    if (match) {
      text = match[0];
    }
  }

  return JSON.parse(text);
}

module.exports = { extractJson };
