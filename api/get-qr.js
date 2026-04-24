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
    // 1. Busca a instância com timeout e tratamento de erro manual
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const fetchRes = await fetch(`${EVOLUTION_URL}/instance/fetchInstances?instanceName=${instanceName}`, {
      method: 'GET',
      headers: { 
        'apikey': EVOLUTION_APIKEY,
        'Content-Type': 'application/json',
        'accept': '*/*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));
    
    if (!fetchRes.ok) {
      const errorText = await fetchRes.text();
      return res.status(fetchRes.status).json({ 
        error: `Evolution retornou erro ${fetchRes.status}`, 
        details: errorText.substring(0, 100),
        urlAttempted: EVOLUTION_URL 
      })
    }

    const data = await fetchRes.json()

    // Evolution pode retornar estrutura aninhada {instance:{instanceName}} ou flat {instanceName/name}
    const normalize = (i) => i.instance?.instanceName || i.instanceName || i.name || ''
    const found = Array.isArray(data)
      ? data.some(i => normalize(i) === instanceName)
      : (normalize(data) === instanceName || data?.id != null)

    if (!found) {
      return res.status(200).json({
        status: 'ERROR',
        message: `Instância '${instanceName}' não encontrada.`,
        _debug: { fetchInstancesResponse: JSON.stringify(data).substring(0, 300) }
      })
    }

    // 2. Checa o estado da conexão
    const stateRes = await fetch(`${EVOLUTION_URL}/instance/connectionState/${instanceName}`, {
      headers: { 'apikey': EVOLUTION_APIKEY }
    })
    const stateData = await stateRes.json()
    const isConnected = stateData.instance?.state === 'open' || stateData.status === 'open' || stateData.state === 'open'

    if (isConnected) {
      return res.status(200).json({ status: 'CONNECTED' })
    } else {
      const connectRes = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: { 'apikey': EVOLUTION_APIKEY, 'Content-Type': 'application/json' }
      })
      const connectData = await connectRes.json()

      const rawQr = connectData.base64 || connectData.qrcode?.base64 || connectData.code || ''
      const qrcode = rawQr && !rawQr.startsWith('data:') ? `data:image/png;base64,${rawQr}` : rawQr
      return res.status(200).json({
        status: qrcode ? 'QRCODE' : 'DISCONNECTED',
        qrcode: qrcode || null,
        _debug: !qrcode ? { connectResponse: JSON.stringify(connectData).substring(0, 300), stateResponse: JSON.stringify(stateData).substring(0, 200) } : undefined
      })
    }

  } catch (error) {
    console.error('Erro no get-qr:', error)
    return res.status(500).json({ 
      error: error.name === 'AbortError' ? 'Tempo de conexão esgotado (Timeout)' : 'Erro de rede', 
      details: error.message,
      urlAttempted: EVOLUTION_URL
    })
  }
}
