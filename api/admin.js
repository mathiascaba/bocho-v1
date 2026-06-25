const crypto = require('crypto')

const REPO = 'mathiascaba/bpc-clon'
const PATH = 'data/codes.json'
const BRANCH = 'main'

async function getCodes(token) {
  const url = `https://api.github.com/repos/${REPO}/contents/${PATH}?ref=${BRANCH}`
  const res = await fetch(url, {
    headers: { Authorization: `token ${token}`, 'User-Agent': 'bcp-admin' }
  })
  if (res.status === 404) return { codes: {}, sha: null }
  const data = await res.json()
  const content = JSON.parse(Buffer.from(data.content, 'base64').toString())
  return { codes: content, sha: data.sha }
}

async function saveCodes(codes, sha, token) {
  const url = `https://api.github.com/repos/${REPO}/contents/${PATH}`
  const body = {
    message: 'update codes',
    content: Buffer.from(JSON.stringify(codes, null, 2)).toString('base64'),
    branch: BRANCH
  }
  if (sha) body.sha = sha
  const res = await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `token ${token}`, 'User-Agent': 'bcp-admin', 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return res.ok
}

const ADMIN_PASSWORD = 'PEPHJ94H'

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')

  if (req.method === 'OPTIONS') return res.status(204).end()

  const auth = req.headers.authorization
  if (auth !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'wrong password' })
  }

  const token = process.env.GH_TOKEN
  if (!token) return res.status(500).json({ error: 'GH_TOKEN not set' })

  try {
    if (req.method === 'GET') {
      const { codes } = await getCodes(token)
      const attempts = codes._attempts || []
      delete codes._attempts
      const list = Object.entries(codes).map(([key, val]) => ({ key, ...val }))
      return res.status(200).json({ codes: list, attempts })
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const { action, count } = body

      if (action === 'generate') {
        const num = count || 1
        const { codes, sha } = await getCodes(token)
        const generated = []
        for (let i = 0; i < num; i++) {
          const code = 'BCP-' + crypto.randomBytes(4).toString('hex').toUpperCase()
          codes[code] = { used: false, deviceId: null, activatedAt: null }
          generated.push(code)
        }
        const ok = await saveCodes(codes, sha, token)
        if (!ok) return res.status(500).json({ error: 'save failed' })
        return res.status(200).json({ codes: generated })
      }

      return res.status(400).json({ error: 'Invalid action' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
