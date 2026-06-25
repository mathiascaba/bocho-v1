import { readFileSync, writeFileSync, existsSync } from 'fs'
import crypto from 'crypto'

const ADMIN_PASSWORD = 'PEPHJ94H'
const DATA = '/tmp/bcp_activaciones.json'

function load() {
  if (!existsSync(DATA)) return { codes: {} }
  try { return JSON.parse(readFileSync(DATA, 'utf-8')) } catch { return { codes: {} } }
}

function save(data) {
  writeFileSync(DATA, JSON.stringify(data, null, 2))
}

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' }

  const auth = event.headers.authorization
  if (auth !== ADMIN_PASSWORD) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Contraseña incorrecta' }) }
  }

  if (event.httpMethod === 'GET') {
    const store = load()
    const codes = Object.entries(store.codes).map(([key, data]) => ({ key, ...data }))
    return { statusCode: 200, headers, body: JSON.stringify({ codes }) }
  }

  if (event.httpMethod === 'POST') {
    try {
      const { action, count } = JSON.parse(event.body)

      if (action === 'generate') {
        const num = count || 1
        const generated = []
        const store = load()

        for (let i = 0; i < num; i++) {
          const code = 'BCP-' + crypto.randomBytes(4).toString('hex').toUpperCase()
          store.codes[code] = { used: false }
          generated.push(code)
        }

        save(store)
        return { statusCode: 200, headers, body: JSON.stringify({ codes: generated }) }
      }

      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Acción inválida' }) }
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Error interno' }) }
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
}
