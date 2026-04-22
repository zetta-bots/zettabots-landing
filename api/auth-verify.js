export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { phone, code } = req.body
  
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
  const AIRTABLE_BASE = process.env.AIRTABLE_BASE
  const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE || 'tblu2DjzxbgZ84PL6'

  try {
    // Normalização Inteligente
    const rawPhone = phone.replace(/\D/g, '')
    const phoneWith55 = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`
    const phoneWithout55 = rawPhone.startsWith('55') ? rawPhone.substring(2) : rawPhone

    // 1. Buscar o cliente por qualquer uma das variações
    const searchUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}?filterByFormula=OR({phone}='${phoneWith55}', {phone}='${phoneWithout55}', {adminPhone}='${phoneWith55}', {adminPhone}='${phoneWithout55}')`
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
    const isAtlasDaFe = phoneWithout55 === '1197737283' || phoneWithout55 === '1197737283'
    const isCodeValid = fields.loginCode === code || (isAtlasDaFe && code === '1234')

    if (!isCodeValid) {
      return res.status(401).json({ error: 'Código de acesso incorreto' })
    }

    // 3. Retornar dados reais para o Dashboard
    return res.status(200).json({
      success: true,
      recordId: record.id,
      instanceName: fields.instanceName || phoneWith55,
      phone: fields.adminPhone || phoneWith55,
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
