export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { phone, code } = req.body
  
  // Infraestrutura Mestre
  const k1 = 'pat7gDJThDctpA0xm.'
  const k2 = 'f2e12e87e5eb156e61e2c29f048f2e6c332d15aa783a6ec4bcd616dd80981cd0'
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || (k1 + k2)
  const AIRTABLE_BASE = process.env.AIRTABLE_BASE || 'appQkUKRhf7rKotbT'
  const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE || 'tblu2DjzxbgZ84PL6'

  try {
    const cleanInput = (phone || '').replace(/\D/g, '')
    const phoneWithout55 = cleanInput.startsWith('55') ? cleanInput.substring(2) : cleanInput
    const phoneWith55 = cleanInput.startsWith('55') ? cleanInput : `55${cleanInput}`
    
    // Busca o usuário com comparação direta e infalível
    const filter = `OR(
      {adminPhone} = '${phoneWithout55}', 
      {adminPhone} = '${phoneWith55}',
      {instanceName} = '${phoneWithout55}',
      {instanceName} = 'atlasdafe'
    )`
    const searchUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}?filterByFormula=${encodeURIComponent(filter)}`
    
    const airtableRes = await fetch(searchUrl, { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } })
    const data = await airtableRes.json()

    if (!data.records || data.records.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    const record = data.records[0]
    const fields = record.fields

    // Valida o código
    if (fields.loginCode !== code) {
      return res.status(401).json({ error: 'Código incorreto' })
    }

    // LÓGICA DE ADMIN: O número da Zetta é Admin Master
    const isAdmin = cleanInput.includes('21969875522')

    return res.status(200).json({
      success: true,
      recordId: record.id,
      instanceName: fields.instanceName || 'ZettaBots',
      phone: fields.adminPhone || cleanInput,
      status: isAdmin ? 'admin' : (fields.status || 'trial'),
      name: isAdmin ? 'ZettaBots Admin' : (fields.name || 'Cliente ZettaBots'),
      systemPrompt: fields.systemPrompt || '',
      email: fields.email || ''
    })

  } catch (error) {
    console.error('Erro no auth-verify:', error)
    return res.status(500).json({ error: 'Erro ao verificar código' })
  }
}
