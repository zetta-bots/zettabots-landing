import { Groq } from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, systemPrompt, history = [] } = req.body;

  try {
    const messages = [
      {
        role: "system",
        content: systemPrompt || "Você é um assistente prestativo da ZettaBots.",
      },
      ...history,
      {
        role: "user",
        content: message,
      },
    ];

    const completion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
    });

    const response = completion.choices[0]?.message?.content || "Desculpe, não consegui processar sua resposta.";

    return res.status(200).json({ response });
  } catch (error) {
    console.error('Erro no Chat Test:', error);
    return res.status(500).json({ error: 'Erro ao processar a inteligência artificial.' });
  }
}
