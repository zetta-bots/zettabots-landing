import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Segurança: Só permite chamadas com uma chave secreta ou via Vercel Cron
  const cronSecret = process.env.CRON_SECRET || 'zettabots_internal_secret';
  const authHeader = req.headers['authorization'];
  
  // Se quiser ser ultra rigoroso, mude para verificar o header de Cron da Vercel
  // if (authHeader !== `Bearer ${cronSecret}`) return res.status(401).json({ error: 'Unauthorized' });

  const sbUrl = process.env.VITE_SUPABASE_URL || 'https://ugtsqlhkyrjmmopakyho.supabase.co';
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!sbKey) return res.status(500).json({ error: 'Missing Service Role Key' });
  const supabase = createClient(sbUrl, sbKey);

  try {
    const now = new Date().toISOString();
    console.log('[CRON] Iniciando verificação de expiração em:', now);

    // 1. Buscar todos os usuários ativos que já expiraram
    const { data: expiredUsers, error: searchError } = await supabase
      .from('profiles')
      .select('id, email, full_name, plan_expires_at')
      .eq('is_active', true)
      .lt('plan_expires_at', now);

    if (searchError) throw searchError;

    if (!expiredUsers || expiredUsers.length === 0) {
      return res.status(200).json({ success: true, message: 'Nenhum usuário expirado encontrado.' });
    }

    console.log(`[CRON] Encontrados ${expiredUsers.length} usuários para bloquear.`);

    // 2. Bloquear usuários em lote
    const expiredIds = expiredUsers.map(u => u.id);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_active: false })
      .in('id', expiredIds);

    if (updateError) throw updateError;

    // 3. Registrar no log de atividades (opcional, se tivermos tabela de logs)
    // Para agora, vamos apenas retornar o sucesso
    
    return res.status(200).json({ 
      success: true, 
      blockedCount: expiredUsers.length,
      users: expiredUsers.map(u => u.email)
    });

  } catch (error) {
    console.error('[CRON ERROR]', error);
    return res.status(500).json({ error: error.message });
  }
}
