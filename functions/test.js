exports.handler = async () => ({
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ hasToken: !!process.env.GH_TOKEN, tokenStart: process.env.GH_TOKEN?.substring(0, 6) })
})
