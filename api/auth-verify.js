export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { phone, code } = req.body
  
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
  const AIRTABLE_BASE = process.env.AIRTABLE_BASE
  const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE || 'tblu2DjzxbgZ84PL6'

  try {
    // 1. Buscar o cliente pelo telefone
    const searchUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}?filterByFormula=OR({instanceName}='${phone}', {adminPhone}='${phone}')`
    const airtableRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    })
    const data = await airtableRes.json()

    if (!data.records || data.records.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    const record = data.records[0]
    const fields = record.fields

    // 2. Validar o código (Bypass para o número de teste do cliente)
    const cleanPhone = phone.replace(/\D/g, '')
    const isAtlasDaFe = cleanPhone === '1197737283' || cleanPhone === '551197737283'
    const isCodeValid = fields.loginCode === code || (isAtlasDaFe && code === '1234')

    if (!isCodeValid) {
      return res.status(401).json({ error: 'Código de acesso incorreto' })
    }

    // 3. Retornar dados reais para o Dashboard
    return res.status(200).json({
      success: true,
      recordId: record.id,
      instanceName: fields.instanceName || phone,
      phone: fields.adminPhone || phone,
      status: fields.status || 'trial',
      name: fields.name || 'Cliente ZettaBots',
      systemPrompt: fields.systemPrompt || '',
      email: fields.email || '',
      expiryDate: fields.trialEndDate || ''
    })

  } catch (error) {
    console.error('Erro no auth-verify:', error)
    return res.status(500).json({ error: 'Erro ao verificar código' })
  }
}
