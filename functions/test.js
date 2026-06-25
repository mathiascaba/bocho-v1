exports.handler = async () => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ BLOBS_CONTEXT: process.env.NETLIFY_BLOBS_CONTEXT })
  }
}
