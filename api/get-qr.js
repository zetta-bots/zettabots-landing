export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { instanceName } = req.body
  if (!instanceName) {
    return res.status(400).json({ error: 'Nome da instância obrigatório' })
  }

  let EVOLUTION_URL = process.env.EVOLUTION_URL
  const EVOLUTION_APIKEY = process.env.EVOLUTION_APIKEY

  if (!EVOLUTION_URL || !EVOLUTION_APIKEY) {
    return res.status(500).json({ error: 'Configuração pendente na Vercel (URL ou APIKEY)' })
  }

  // Normalização da URL
  EVOLUTION_URL = EVOLUTION_URL.trim().replace(/\/$/, '')
  if (!EVOLUTION_URL.startsWith('http')) {
    EVOLUTION_URL = `https://${EVOLUTION_URL}`
  }

  try {
    const headers = { 'apikey': EVOLUTION_APIKEY, 'Content-Type': 'application/json' }

    // 1. Checa estado da conexão diretamente (sem fetchInstances que pode dar 404)
    const stateRes = await fetch(`${EVOLUTION_URL}/instance/connectionState/${instanceName}`, { headers })

    if (!stateRes.ok) {
      return res.status(200).json({
        status: 'NOT_FOUND',
        message: 'Instância não encontrada no servidor. Refaça o cadastro.',
        _debug: { stateStatus: stateRes.status }
      })
    }

    const stateData = await stateRes.json()
    const isConnected = stateData.instance?.state === 'open' || stateData.status === 'open' || stateData.state === 'open'

    if (isConnected) {
      return res.status(200).json({ status: 'CONNECTED' })
    }

    // 2. Gera QR code
    const connectRes = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, { method: 'GET', headers })
    const connectData = await connectRes.json()

    const rawQr = connectData.base64 || connectData.qrcode?.base64 || ''
    const qrcode = rawQr && !rawQr.startsWith('data:') ? `data:image/png;base64,${rawQr}` : rawQr
    return res.status(200).json({
      status: qrcode ? 'QRCODE' : 'DISCONNECTED',
      qrcode: qrcode || null,
      _debug: !qrcode ? { connectResponse: JSON.stringify(connectData).substring(0, 300) } : undefined
    })

  } catch (error) {
    console.error('Erro no get-qr:', error)
    return res.status(500).json({ 
      error: error.name === 'AbortError' ? 'Tempo de conexão esgotado (Timeout)' : 'Erro de rede', 
      details: error.message,
      urlAttempted: EVOLUTION_URL
    })
  }
}
