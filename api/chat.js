import { knowledge } from './knowledge.js';

// --- Retrieval ---
function retrieveContext(userMessage) {
  const query = userMessage.toLowerCase();

  const scored = knowledge.map(entry => {
    const tagMatches = entry.tags.filter(tag => query.includes(tag)).length;
    const textMatches = entry.text.toLowerCase().split(' ')
      .filter(word => word.length > 4 && query.includes(word)).length;
    return { entry, score: tagMatches * 3 + textMatches };
  });

  const top = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(s => s.entry.text);

  return top.length > 0 ? top.join('\n\n') : null;
}

// --- Handler ---
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  // Берём последнее сообщение пользователя для retrieval
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content ?? '';
  const context = retrieveContext(lastUserMessage);

  const systemPrompt = {
    role: 'system',
    text: `Ты — помощник по страхованию для подростков и молодёжи России. Отвечай только на вопросы про страхование.

ПРАВИЛА:
- Отвечай строго на основе блока ЗНАНИЯ если он есть — не придумывай цифры и условия
- Если в ЗНАНИЯХ нет ответа — скажи честно: "точной информации нет, лучше уточнить в страховой"
- Простой язык, короткие предложения, можно эмодзи
- Если вопрос не про страхование — мягко возвращай к теме
- Не давай юридических советов, только общая информация
- Не используй markdown-форматирование: никаких **, *, #, _, ~~. Пиши обычным текстом
- Каждую аббревиатуру расшифровывай при первом упоминании: ОСАГО (обязательное страхование автогражданской ответственности), КАСКО (комплексное автострахование), ОМС (обязательное медицинское страхование), ДМС (добровольное медицинское страхование), НС (несчастный случай), ВЗР (страхование выезжающих за рубеж)

${context ? `ЗНАНИЯ (используй как основу ответа):\n${context}` : 'ЗНАНИЯ: по этому вопросу конкретных данных нет — отвечай осторожно, только общеизвестные факты.'}`,
  };

  const yandexMessages = messages.map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    text: m.content,
  }));

  try {
    const response = await fetch(
      'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
      {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${process.env.YANDEX_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelUri: `gpt://b1ggk4augdedhkralrqs/yandexgpt-lite`,
          completionOptions: {
            stream: false,
            temperature: 0.3, // было 0.7 — снижаем галлюцинации
            maxTokens: 600,
          },
          messages: [systemPrompt, ...yandexMessages],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('YandexGPT error:', error);
      return res.status(502).json({ error: 'AI service unavailable' });
    }

    const data = await response.json();
    const reply = data.result?.alternatives?.[0]?.message?.text ?? 'Не удалось получить ответ.';

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}
