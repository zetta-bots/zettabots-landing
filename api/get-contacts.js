export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { instanceName } = req.body;
  if (!instanceName) {
    return res.status(400).json({ error: 'instanceName required' });
  }

  const url = (process.env.EVOLUTION_URL || 'https://seriousokapi-evolution.cloudfy.live').replace(/\/$/, '');
  const key = process.env.EVOLUTION_APIKEY || '1V1stsMi2TBi2qNY4sk6Ze74Gcv6g2Pk';
  const sbUrl = process.env.VITE_SUPABASE_URL || 'https://ugtsqlhkyrjmmopakyho.supabase.co';
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  try {
    // Get instance info from Evolution API to extract contact count
    const listRes = await fetch(`${url}/instance/fetchInstances`, {
      headers: { 'apikey': key, 'Content-Type': 'application/json' },
      timeout: 8000
    });
    const instances = await listRes.json();
    const data = Array.isArray(instances) ? instances : (instances.data || []);
    const found = data.find(i => (i.name && i.name.toLowerCase() === instanceName.toLowerCase()) || (i.name && i.name.toLowerCase().includes(instanceName.toLowerCase())));

    if (!found) {
      return res.status(200).json({
        success: true,
        contacts: [],
        contactCount: 0,
        message: 'Instance not found'
      });
    }

    const contactCount = found._count?.Contact || 0;

    // Try to get from Supabase first
    const instRes = await fetch(`${sbUrl}/rest/v1/instances?instance_name=eq.${encodeURIComponent(found.name)}&select=id`, {
      headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
    });
    const instData = await instRes.json();

    let contacts = [];
    if (instData && instData.length > 0) {
      const contactsRes = await fetch(`${sbUrl}/rest/v1/leads?instance_id=eq.${instData[0].id}&limit=50&order=created_at.desc`, {
        headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` }
      });
      const sbContacts = await contactsRes.json() || [];
      contacts = sbContacts.map(c => ({
        id: c.id,
        name: c.name || c.phone || 'Contato',
        phone: c.phone || '---',
        status: c.status || 'Novo',
        date: c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : 'Recente',
        source: 'supabase'
      }));
    }

    // If no contacts in Supabase but Evolution says there are contacts, create placeholder
    if (contacts.length === 0 && contactCount > 0) {
      return res.status(200).json({
        success: true,
        contacts: [],
        contactCount,
        message: `${contactCount} contato${contactCount > 1 ? 's' : ''} aguardando sincronização. Eles aparecerão aqui quando enviarem a primeira mensagem.`,
        hasData: true,
        totalContactsFromApi: contactCount
      });
    }

    return res.status(200).json({
      success: true,
      contacts,
      contactCount: contacts.length || contactCount,
      totalContactsFromApi: contactCount
    });

  } catch (error) {
    console.error('[get-contacts] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      contacts: []
    });
  }
}
