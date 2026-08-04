import { CONFIG } from './config'

export interface Button {
  text: string
  payload?: string
  url?: string
}

export async function mcSendMessage(userId: string, text: string) {
  console.log('[MC_SEND_MSG]', userId, text.substring(0, 100))
  const res = await fetch(`${CONFIG.MC_API}/sending/sendContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `******` },
    body: JSON.stringify({
      subscriber_id: userId,
      data: {
        version: 'v2',
        content: {
          type: 'whatsapp',
          messages: [{ type: 'text', text }]
        }
      }
    })
  })
  const json = await res.json()
  console.log('[MC_SEND_MSG] response:', res.status, json)
  if (!res.ok || json.status !== 'success') {
    console.error('MC_SEND_MSG_ERR', res.status, json.message, JSON.stringify(json.details?.messages || json.details))
  }
  return json
}

export async function mcSendMessageWithButtons(userId: string, text: string, buttons: Button[]) {
  console.log('[MC_SEND_MSG_BTNS]', userId, text.substring(0, 100), buttons)
  
  const formattedButtons = buttons.map(btn => ({
    type: btn.url ? 'url' : 'postback',
    title: btn.text,
    ...(btn.url ? { url: btn.url } : { payload: btn.payload || btn.text })
  }))

  const res = await fetch(`${CONFIG.MC_API}/sending/sendContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `******` },
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
    })
  })
  const json = await res.json()
  console.log('[MC_SEND_MSG_BTNS] response:', res.status, json)
  if (!res.ok || json.status !== 'success') {
    console.error('[MC_SEND_MSG_BTNS_ERR]', res.status, json.message, JSON.stringify(json.details?.messages || json.details))
  }
  return json
}