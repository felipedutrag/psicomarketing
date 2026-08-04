import { CONFIG } from './config'

export interface Button {
  text: string
  payload?: string
  url?: string
}

function getAuthHeader() {
  const token = process.env.MANYCHAT_API_KEY || CONFIG.MC_AUTH()
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`
}

export async function mcSendMessage(userId: string, text: string) {
  console.log('[MC_SEND_MSG]', userId, text.substring(0, 100))
  const res = await fetch(`${CONFIG.MC_API}/sending/sendContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: getAuthHeader() },
    body: JSON.stringify({
      subscriber_id: userId,
      data: {
        version: 'v2',
        content: {
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
  
  const formattedButtons = buttons.map(btn => {
    if (btn.url) {
      return {
        type: 'url',
        caption: btn.text,
        url: btn.url,
        actions: []
      }
    }
    return {
      type: 'node',
      caption: btn.text,
      target: btn.payload || btn.text,
      actions: []
    }
  })

  const subscriberId = typeof userId === 'string' && /^\d+$/.test(userId) ? Number(userId) : userId

  const res = await fetch(`${CONFIG.MC_API}/sending/sendContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: getAuthHeader() },
    body: JSON.stringify({
      subscriber_id: subscriberId,
      data: {
        version: 'v2',
        content: {
          messages: [{
            type: 'text',
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