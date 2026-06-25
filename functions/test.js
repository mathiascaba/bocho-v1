export const handler = async (event) => {
  let blobs = 'not available'
  try {
    const mod = await import('@netlify/blobs')
    blobs = Object.keys(mod).join(', ')
  } catch (e) {
    blobs = 'error: ' + e.message
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      node: process.version,
      blobs: blobs,
      cwd: process.cwd(),
      envKeys: Object.keys(process.env).filter(k => !k.toLowerCase().includes('key') && !k.toLowerCase().includes('pass') && !k.toLowerCase().includes('secret') && !k.toLowerCase().includes('token'))
    })
  }
}
