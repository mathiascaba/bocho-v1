import { getStore } from '@netlify/blobs'
import crypto from 'crypto'

const ADMIN_PASSWORD = 'PEPHJ94H'
const STORE_NAME = 'bcp-activaciones'

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' }

  const auth = event.headers.authorization
  if (auth !== ADMIN_PASSWORD) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Contraseña incorrecta' }) }
  }

  const store = getStore(STORE_NAME)

  if (event.httpMethod === 'GET') {
    // List all codes
    const { blobs } = await store.list()
    const codes = []
    for (const blob of blobs) {
      const data = await store.get(blob.key, { type: 'json' })
      codes.push({ key: blob.key.replace('code:', ''), ...data })
    }
    return { statusCode: 200, headers, body: JSON.stringify({ codes }) }
  }

  if (event.httpMethod === 'POST') {
    const { action, count } = JSON.parse(event.body)

    if (action === 'generate') {
      const num = count || 1
      const generated = []
      for (let i = 0; i < num; i++) {
        const code = 'BCP-' + crypto.randomBytes(4).toString('hex').toUpperCase()
        await store.setJSON(`code:${code}`, { used: false })
        generated.push(code)
      }
      return { statusCode: 200, headers, body: JSON.stringify({ codes: generated }) }
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Acción inválida' }) }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
}
