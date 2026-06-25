import { getStore } from '@netlify/blobs'

exports.handler = async (event, context) => {
  try {
    const store = getStore('bcp-activaciones', {
      siteID: process.env.SITE_ID,
      token: process.env.NETLIFY_FUNCTIONS_TOKEN
    })
    await store.setJSON('test:hello', { msg: 'world' })
    const val = await store.get('test:hello', { type: 'json' })
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, value: val })
    }
  } catch (e) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: e.message, name: e.name, code: e.code })
    }
  }
}
