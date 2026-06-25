const REPO = 'mathiascaba/bpc-clon'
const PATH = 'data/codes.json'
const BRANCH = 'main'

async function getCodes(token) {
  const url = `https://api.github.com/repos/${REPO}/contents/${PATH}?ref=${BRANCH}`
  const res = await fetch(url, {
    headers: { Authorization: `token ${token}`, 'User-Agent': 'bcp-verify' }
  })
  if (res.status === 404) return {}
  const data = await res.json()
  return JSON.parse(Buffer.from(data.content, 'base64').toString())
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = process.env.GH_TOKEN
  if (!token) return res.status(500).json({ error: 'GH_TOKEN not set' })

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { deviceId } = body
    if (!deviceId) return res.status(400).json({ error: 'Missing device' })

    const codes = await getCodes(token)
    const activated = Object.values(codes).some(v => v.used && v.deviceId === deviceId)
    res.status(200).json({ activated })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
