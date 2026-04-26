export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { action } = req.body;
  const sbUrl = process.env.VITE_SUPABASE_URL || 'https://ugtsqlhkyrjmmopakyho.supabase.co';
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  try {
    if (action === 'check-tables') {
      const tables = ['knowledge_base', 'leads', 'instances'];
      const results = {};
      
      for (const table of tables) {
        try {
          const res = await fetch(`${sbUrl}/rest/v1/${table}?select=count()&limit=1`, {
            headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
          });
          const data = await res.json();
          results[table] = data.length > 0 ? `✅ Existe (${data[0]?.count || 0} registros)` : '⚠️ Vazio';
        } catch (e) {
          results[table] = `❌ Erro: ${e.message}`;
        }
      }
      return res.status(200).json({ success: true, tables: results });
    }

    if (action === 'check-knowledge-base') {
      const { userId } = req.body;
      const res = await fetch(`${sbUrl}/rest/v1/knowledge_base?user_id=eq.${userId}&select=*`, {
        headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
      });
      const data = await res.json();
      return res.status(200).json({ success: true, records: data, count: data.length });
    }

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
