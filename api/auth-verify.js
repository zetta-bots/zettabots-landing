export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { phone, code } = req.body
  
  // BYPASS PARA TESTE DO ATLAS DA FÉ
  if ((phone === '1197737283' || phone === '551197737283') && code === '1234') {
    return res.status(200).json({
      success: true,
      recordId: 'mock-id',
      instanceName: 'atlasdafe', // NOME EXATO QUE APARECE NO SEU PRINT
      phone: '551197737283',
      status: 'pago',
      name: 'Atlas da Fé',
      systemPrompt: 'Você é a Sarah, especialista em vendas...'
    })
  }

  return res.status(401).json({ error: 'Código inválido' })
}
