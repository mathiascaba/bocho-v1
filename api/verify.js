const { leer } = require('./github-store.js')
const REPO = 'mathiascaba/bocho-v1'

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const dispositivo = req.query.dispositivo
    if (!dispositivo) return res.status(400).json({ error: 'Falta dispositivo' })

    const db = await leer(REPO)
    const ultimo = [...(db.dispositivos || [])].reverse().find(d => d.id === dispositivo)

    if (!ultimo) return res.status(200).json({ activado: false, bloqueado: false })

    const entry = db.codes[ultimo.codigo]
    const bloqueado = entry?.blocked || false

    res.status(200).json({ activado: true, bloqueado, data: ultimo })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
