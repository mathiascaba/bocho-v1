const crypto = require('crypto')

const REPO = 'mathiascaba/bpc-clon'
const PATH = 'data/codes.json'
const BRANCH = 'main'

async function getCodes(token) {
  const url = `https://api.github.com/repos/${REPO}/contents/${PATH}?ref=${BRANCH}`
  const res = await fetch(url, {
    headers: { Authorization: `token ${token}`, 'User-Agent': 'bcp-activate' }
  })
  if (res.status === 404) return { codes: {}, sha: null }
  const data = await res.json()
  const content = JSON.parse(Buffer.from(data.content, 'base64').toString())
  return { codes: content, sha: data.sha }
}

async function saveCodes(codes, sha, token) {
  const url = `https://api.github.com/repos/${REPO}/contents/${PATH}`
  const body = {
    message: 'activate code',
    content: Buffer.from(JSON.stringify(codes, null, 2)).toString('base64'),
    branch: BRANCH
  }
  if (sha) body.sha = sha
  const res = await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `token ${token}`, 'User-Agent': 'bcp-activate', 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return res.ok
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
    const { code, deviceId } = body
    if (!code || !deviceId) {
      return res.status(400).json({ error: 'Missing code or device' })
    }

    const { codes, sha } = await getCodes(token)
    const normalizedCode = code.toUpperCase()
    const entry = codes[normalizedCode]

    if (!entry) {
      if (!codes._attempts) codes._attempts = []
      codes._attempts.push({ code: normalizedCode, deviceId, reason: 'Invalid code', time: new Date().toISOString() })
      await saveCodes(codes, sha, token)
      return res.status(400).json({ error: 'Invalid code' })
    }

    if (entry.used) {
      if (!codes._attempts) codes._attempts = []
      codes._attempts.push({ code: normalizedCode, deviceId, reason: 'Code already used', time: new Date().toISOString() })
      await saveCodes(codes, sha, token)
      return res.status(400).json({ error: 'Code already used' })
    }

    entry.used = true
    entry.deviceId = deviceId
    entry.activatedAt = new Date().toISOString()

    const ok = await saveCodes(codes, sha, token)
    if (!ok) return res.status(500).json({ error: 'save failed' })

    res.status(200).json({ success: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
