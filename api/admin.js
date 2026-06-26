const crypto = require('crypto')
const { leer, guardar } = require('./github-store.js')

const REPO = 'mathiascaba/bocho-v1'
const ADMIN_PASS = '72586048'

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-admin-pass')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(204).end()

  const pass = req.headers['x-admin-pass'] ||
    (typeof req.body === 'string' ? JSON.parse(req.body) : req.body)?.password
  if (pass !== ADMIN_PASS) return res.status(401).json({ error: 'wrong password' })
  if (!process.env.GH_TOKEN) return res.status(500).json({ error: 'GH_TOKEN not set' })

  try {
    const db = await leer(REPO)

    if (req.method === 'GET') {
      const action = req.query.action || 'codigos'
      if (action === 'codigos') return res.status(200).json(Object.entries(db.codes).map(([k, v]) => ({ codigo: k, ...v })))
      if (action === 'dispositivos') return res.status(200).json(db.dispositivos || [])
      if (action === 'intentos') return res.status(200).json(db.intentos_fallidos || [])
      return res.status(400).json({ error: 'Invalid action' })
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body

    if (body.action === 'generar') {
      const num = Math.min(body.cantidad || 1, 50)
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      const generated = []
      for (let i = 0; i < num; i++) {
        let code = ''
        for (let j = 0; j < 8; j++) code += chars[crypto.randomInt(chars.length)]
        db.codes[code] = { used: false, blocked: false, creado: new Date().toISOString(), dispositivo: null, fecha_uso: null, nombre: null }
        generated.push(code)
      }
      await guardar(REPO, db)
      return res.status(200).json({ codes: generated })
    }

    if (body.action === 'block') {
      if (!db.codes[body.codigo]) return res.status(400).json({ error: 'Code not found' })
      db.codes[body.codigo].blocked = true
      await guardar(REPO, db)
      return res.status(200).json({ success: true })
    }

    if (body.action === 'unblock') {
      if (!db.codes[body.codigo]) return res.status(400).json({ error: 'Code not found' })
      db.codes[body.codigo].blocked = false
      await guardar(REPO, db)
      return res.status(200).json({ success: true })
    }

    return res.status(400).json({ error: 'Invalid action' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
