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

    // 3. Chamar a Groq
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: finalPrompt },
          ...(history || []).map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: message }
        ],
        temperature: 0.7
      })
    });

    const data = await groqRes.json();
    
    if (data.choices && data.choices[0]) {
      return res.status(200).json({ response: data.choices[0].message.content });
    } else {
      console.error('Groq Error:', data);
      return res.status(500).json({ error: 'Erro na resposta da Groq' });
    }

  } catch (error) {
    console.error('Chat Test Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
