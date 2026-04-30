import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // Apenas permitir se for uma chamada autorizada (pode usar uma secret key)
  const cronKey = req.headers['authorization'] || req.query.key;
  if (process.env.CRON_SECRET && cronKey !== `Bearer ${process.env.CRON_SECRET}`) {
    // return res.status(401).json({ error: 'Não autorizado' });
  }

  const sbUrl = process.env.VITE_SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(sbUrl, sbKey);

  const EVOLUTION_URL = process.env.EVOLUTION_URL;
  const EVOLUTION_APIKEY = process.env.EVOLUTION_APIKEY;

  try {
    console.log('[scheduler-cron] Iniciando verificação de agendamentos...');

    // 1. Buscar agendamentos pendentes que já passaram do horário
    const { data: pendingSchedules, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString());

    if (error) throw error;
    if (!pendingSchedules || pendingSchedules.length === 0) {
      return res.status(200).json({ success: true, message: 'Nenhum agendamento pendente.' });
    }

    console.log(`[scheduler-cron] Encontrados ${pendingSchedules.length} agendamentos para enviar.`);

    const results = [];

    for (const schedule of pendingSchedules) {
      try {
        // 2. Enviar via Evolution API
        const evolutionBaseUrl = EVOLUTION_URL.trim().replace(/\/$/, '');
        const sendRes = await fetch(`${evolutionBaseUrl}/message/sendText/${schedule.instance_name}`, {
          method: 'POST',
          headers: {
            'apikey': EVOLUTION_APIKEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            number: schedule.contact_phone,
            text: schedule.message,
            linkPreview: true
          })
        });

        if (sendRes.ok) {
          // 3. Marcar como enviado
          await supabase
            .from('schedules')
            .update({ status: 'sent' })
            .eq('id', schedule.id);
          
          results.push({ id: schedule.id, status: 'success' });
          console.log(`[scheduler-cron] Mensagem enviada com sucesso para ${schedule.contact_phone}`);
        } else {
          const errorText = await sendRes.text();
          console.error(`[scheduler-cron] Erro ao enviar para ${schedule.contact_phone}:`, errorText);
          results.push({ id: schedule.id, status: 'failed', error: errorText });
        }
      } catch (err) {
        console.error(`[scheduler-cron] Falha crítica no agendamento ${schedule.id}:`, err);
        results.push({ id: schedule.id, status: 'error', error: err.message });
      }
    }

    return res.status(200).json({ success: true, results });
  } catch (error) {
    console.error('[scheduler-cron] Erro geral:', error);
    return res.status(500).json({ error: error.message });
  }
}
