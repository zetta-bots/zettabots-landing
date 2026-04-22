export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { instanceName } = req.body
  if (!instanceName) {
    return res.status(400).json({ error: 'Instance name required' })
  }

  const EVOLUTION_URL = process.env.EVOLUTION_URL
  const EVOLUTION_APIKEY = process.env.EVOLUTION_APIKEY

  try {
    // Busca estatísticas básicas da instância
    const fetchRes = await fetch(`${EVOLUTION_URL}/instance/fetchInstances?instanceName=${instanceName}`, {
      headers: { 'apikey': EVOLUTION_APIKEY }
    })
    
    if (!fetchRes.ok) throw new Error('Falha ao conectar com Evolution')
    
    const data = await fetchRes.json()
    const instance = data.find(i => i.instance.instanceName === instanceName)

    if (!instance) {
      return res.status(404).json({ error: 'Instância não encontrada' })
    }

    // Retorna dados que o usuário viu no painel da Evolution
    return res.status(200).json({
      success: true,
      owner: instance.instance.owner,
      profileName: instance.instance.profileName,
      profilePicture: instance.instance.profilePicture,
      status: instance.instance.status
    })

  } catch (error) {
    console.error('Erro no get-stats:', error)
    return res.status(500).json({ error: 'Erro ao buscar estatísticas' })
  }
}
