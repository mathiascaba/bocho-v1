export default async (req, context) => {
  try {
    const store = context.blobs
    await store.setJSON('test:hello', { msg: 'world' })
    const val = await store.get('test:hello', { type: 'json' })
    return new Response(JSON.stringify({ success: true, value: val }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message, name: e.name, hasBlobs: !!context.blobs }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
