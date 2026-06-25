import { getStore } from '@netlify/blobs'

const ADMIN_PASSWORD = 'PEPHJ94H'
const STORE_NAME = 'bcp-activaciones'

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }

  try {
    const { code, deviceId } = JSON.parse(event.body)

    if (!code || !deviceId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Faltan código o dispositivo' }) }
    }

    const codeKey = `code:${code.toUpperCase()}`
    const store = getStore(STORE_NAME)
    const existing = await store.get(codeKey, { type: 'json' })

    if (!existing) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Código inválido' }) }
    }

    if (existing.used) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Este código ya fue usado' }) }
    }

    await store.setJSON(codeKey, { used: true, deviceId, activatedAt: new Date().toISOString() })

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) }
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Error interno' }) }
  }
}
