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

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }

  const token = process.env.GH_TOKEN
  if (!token) return { statusCode: 500, headers, body: JSON.stringify({ error: 'GH_TOKEN not set' }) }

  try {
    const { deviceId } = JSON.parse(event.body)
    if (!deviceId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing device' }) }

    const codes = await getCodes(token)
    const activated = Object.values(codes).some(v => v.used && v.deviceId === deviceId)
    return { statusCode: 200, headers, body: JSON.stringify({ activated }) }
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) }
  }
}
