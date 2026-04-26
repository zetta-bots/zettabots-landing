import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, systemPrompt, history, instanceName } = req.body;
  const GROQ_KEY = process.env.GROQ_API_KEY;
  const SB_URL = process.env.VITE_SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  try {
    const supabase = createClient(SB_URL, SB_KEY);
    
    // 1. Buscar base de conhecimento se houver uma instância selecionada
    let knowledgeBase = '';
    if (instanceName) {
      const { data: kbData } = await supabase
        .from('knowledge_base')
        .select('extracted_text')
        .eq('instance_name', instanceName)
        .eq('status', 'active');
      
      if (kbData && kbData.length > 0) {
        knowledgeBase = kbData.map(item => item.extracted_text).join('\n---\n');
      }
    }

    // 2. Montar o Contexto Final
    let finalPrompt = systemPrompt || 'Você é a Sarah, assistente virtual da ZettaBots.';
    if (knowledgeBase) {
      finalPrompt += '\n\nBASE DE CONHECIMENTO (Use estes dados para responder):\n' + knowledgeBase;
    }

    // 3. Chamar a Groq com lógica de Retry e Fallback
    const callGroq = async (modelName, attempt = 1) => {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: 'system', content: finalPrompt },
              ...(history || []).map(m => ({ role: m.role, content: m.content })),
              { role: 'user', content: message }
            ],
            temperature: 0.7,
            max_tokens: 1024
          })
        });

        const data = await groqRes.json();

        // Se for erro de Rate Limit (429) e tivermos tentativas
        if (groqRes.status === 429 && attempt <= 3) {
          const waitTime = attempt * 2000; // Espera 2s, 4s, 6s...
          console.warn(`Rate limit atingido. Tentativa ${attempt}. Esperando ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          
          // Se for a última tentativa, tenta o modelo menor que tem limite maior
          const nextModel = attempt === 3 ? 'llama-3.1-8b-instant' : modelName;
          return callGroq(nextModel, attempt + 1);
        }

        if (data.choices && data.choices[0]) {
          return { response: data.choices[0].message.content, modelUsed: modelName };
        } else {
          throw new Error(data.error?.message || 'Erro na resposta da Groq');
        }
      } catch (err) {
        if (attempt <= 2) return callGroq(modelName, attempt + 1);
        throw err;
      }
    };

    const result = await callGroq('llama-3.3-70b-versatile');
    return res.status(200).json(result);

  } catch (error) {
    console.error('Chat Test Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
