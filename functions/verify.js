import { readFileSync, existsSync } from 'fs'

const DATA = '/tmp/bcp_activaciones.json'

function load() {
  if (!existsSync(DATA)) return { codes: {} }
  try { return JSON.parse(readFileSync(DATA, 'utf-8')) } catch { return { codes: {} } }
}

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
    if (!deviceId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Falta dispositivo' }) }

    const store = load()
    for (const [code, data] of Object.entries(store.codes)) {
      if (data.used && data.deviceId === deviceId) {
        return { statusCode: 200, headers, body: JSON.stringify({ activated: true }) }
      }
    }

    return { statusCode: 200, headers, body: JSON.stringify({ activated: false }) }
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Error interno' }) }
  }
}
