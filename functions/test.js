export default async (req, context) => {
  return new Response(JSON.stringify({ env: Object.keys(process.env).sort() }), {
    headers: { 'Content-Type': 'application/json' }
  })
}
