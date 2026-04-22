export default async function handler(req, res) {
  // Apenas retorna as chaves para o cliente autenticado fazer a conexão direta
  // Isso resolve o problema de bloqueio de IP da Vercel
  return res.status(200).json({
    url: process.env.EVOLUTION_URL,
    apikey: process.env.EVOLUTION_APIKEY
  })
}
