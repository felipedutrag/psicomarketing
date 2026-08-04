const MC_API = 'https://api.manychat.com/fb'

export interface Button {
  text: string
  payload?: string
  url?: string
}

export async function sendMessageWithButtons(
  userId: string | number,
  text: string,
  buttons: Button[]
) {
  console.log('[MANYCHAT] sendMessageWithButtons:', userId, text.substring(0, 100), buttons)
  
  // Format buttons for ManyChat WhatsApp API
  const formattedButtons = buttons.map(btn => ({
    type: btn.url ? 'url' : 'postback',
    title: btn.text,
    ...(btn.url ? { url: btn.url } : { payload: btn.payload || btn.text })
  }))

  const res = await fetch(`${MC_API}/sending/sendContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer 4893318:6124c375829053829537d02892ea7ce8` },
    body: JSON.stringify({
      subscriber_id: userId,
      data: {
        version: 'v2',
        content: {
          type: 'whatsapp',
          messages: [{
            type: 'buttons',
            text,
            buttons: formattedButtons
          }]
        }
      }
    }),
  })
  const json = await res.json()
  console.log('[MANYCHAT] sendMessageWithButtons response:', res.status, json)
  if (!res.ok || json.status !== 'success') {
    console.error('[MANYCHAT] sendMessageWithButtons ERR', res.status, json.message, JSON.stringify(json.details?.messages || json.details))
  }
  return json
}