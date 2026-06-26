const { leer, guardar } = require('./github-store.js')
const REPO = 'mathiascaba/bocho-v1'

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { codigo, dispositivo, nombre } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    if (!codigo || !dispositivo) return res.status(400).json({ error: 'Faltan datos' })

    const db = await leer(REPO)
    const c = codigo.toUpperCase()
    const entry = db.codes[c]

    if (!entry) {
      db.intentos_fallidos.push({ codigo: c, dispositivo, fecha: new Date().toISOString(), motivo: 'codigo_invalido' })
      await guardar(REPO, db)
      return res.status(400).json({ error: 'Codigo invalido' })
    }

    if (entry.blocked) {
      db.intentos_fallidos.push({ codigo: c, dispositivo, fecha: new Date().toISOString(), motivo: 'codigo_bloqueado' })
      await guardar(REPO, db)
      return res.status(400).json({ error: 'Codigo bloqueado' })
    }

    if (entry.used) {
      if (entry.dispositivo === dispositivo) {
        db.intentos_fallidos.push({ codigo: c, dispositivo, fecha: new Date().toISOString(), motivo: 'reintento_mismo' })
        await guardar(REPO, db)
        return res.status(400).json({ error: 'Codigo ya usado' })
      } else {
        entry.blocked = true
        db.intentos_fallidos.push({ codigo: c, dispositivo, fecha: new Date().toISOString(), motivo: 'compartido_a_otro' })
        await guardar(REPO, db)
        return res.status(400).json({ error: 'Codigo bloqueado' })
      }
    }

    // Filtrar entrada vieja del dispositivo si ya existia
    db.dispositivos = db.dispositivos.filter(d => d.id !== dispositivo)

    entry.used = true
    entry.dispositivo = dispositivo
    entry.nombre = nombre || 'Desconocido'
    entry.fecha_uso = new Date().toISOString()
    db.dispositivos.push({ id: dispositivo, codigo: c, fecha: entry.fecha_uso, nombre: entry.nombre })

    await guardar(REPO, db)
    res.status(200).json({ success: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
