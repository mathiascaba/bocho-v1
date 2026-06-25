const ADMIN_PASSWORD = 'PEPHJ94H'

// Simple file-based storage using /tmp (persists across warm invocations)
import { readFileSync, writeFileSync, existsSync } from 'fs'

const DATA = '/tmp/bcp_activaciones.json'

function load() {
  if (!existsSync(DATA)) return { codes: {} }
  try { return JSON.parse(readFileSync(DATA, 'utf-8')) } catch { return { codes: {} } }
}

function save(data) {
  writeFileSync(DATA, JSON.stringify(data))
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
    const { code, deviceId } = JSON.parse(event.body)

    if (!code || !deviceId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Faltan código o dispositivo' }) }
    }

    const codeKey = code.toUpperCase()
    const store = load()

    if (!store.codes[codeKey]) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Código inválido' }) }
    }

    if (store.codes[codeKey].used) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Este código ya fue usado' }) }
    }

    store.codes[codeKey] = { used: true, deviceId, activatedAt: new Date().toISOString() }
    save(store)

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) }
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Error interno' }) }
  }
}
