import { getStore } from '@netlify/blobs'

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
    const { deviceId } = JSON.parse(event.body)

    if (!deviceId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Falta dispositivo' }) }
    }

    const store = getStore(STORE_NAME)
    const { blobs } = await store.list()

    for (const blob of blobs) {
      const data = await store.get(blob.key, { type: 'json' })
      if (data && data.used && data.deviceId === deviceId) {
        return { statusCode: 200, headers, body: JSON.stringify({ activated: true }) }
      }
    }

    return { statusCode: 200, headers, body: JSON.stringify({ activated: false }) }
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Error interno' }) }
  }
}
