const MANYCHAT_AUTH = `4893318:6124c375829053829537d02892ea7ce8`
const MC_API = 'https://api.manychat.com/fb'

export function getAuthHeader() {
  const envToken = process.env.MANYCHAT_API_KEY?.trim()
  if (envToken) {
    const clean = envToken.replace(/^Bearer\s+/i, '').trim()
    // Valid ManyChat tokens follow format: <account_id>:<hash> (ex: 4893318:6124c3758...)
    if (/^\d+:[a-zA-Z0-9_-]+$/.test(clean)) {
      return `Bearer ${clean}`
    }
  }
  return `Bearer ${MANYCHAT_AUTH}`
}

export async function getSubscriber(userId: string | number) {
  console.log('[MANYCHAT] getSubscriber:', userId)
  const res = await fetch(`${MC_API}/subscriber/getInfo?subscriber_id=${userId}`, {
    headers: { Authorization: getAuthHeader() },
  })
  const json = await res.json()
  console.log('[MANYCHAT] getSubscriber response:', res.status, json)
  return json
}

export async function setCustomField(userId: string | number, fieldName: string, fieldValue: string) {
  console.log('[MANYCHAT] setCustomField:', userId, fieldName, fieldValue)
  const res = await fetch(`${MC_API}/subscriber/setCustomField`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: getAuthHeader() },
    body: JSON.stringify({ subscriber_id: userId, field_name: fieldName, field_value: fieldValue }),
  })
  const json = await res.json()
  console.log('[MANYCHAT] setCustomField response:', res.status, json)
  return json
}

export async function sendMessage(userId: string | number, text: string) {
  console.log('[MANYCHAT] sendMessage:', userId, text.substring(0, 100))
  const subscriberId = typeof userId === 'string' && /^\d+$/.test(userId) ? Number(userId) : userId
  const res = await fetch(`${MC_API}/sending/sendContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: getAuthHeader() },
    body: JSON.stringify({
      subscriber_id: subscriberId,
      data: {
        version: 'v2',
        content: {
          type: 'whatsapp',
          messages: [{ type: 'text', text }]
        }
      }
    }),
  })
  const json = await res.json()
  console.log('[MANYCHAT] sendMessage response:', res.status, json)
  if (!res.ok || json.status !== 'success') {
    const errMsg = json.message || `HTTP ${res.status}`
    console.error('[MANYCHAT] sendMessage ERR', res.status, errMsg, JSON.stringify(json.details?.messages || json.details))
    throw new Error(`ManyChat API Error: ${errMsg}`)
  }
  return json
}

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
  
  // Format buttons for ManyChat WhatsApp v2 Content API (WhatsApp limit: 20 chars for caption, max 3 buttons, omit empty actions)
  const formattedButtons = buttons.slice(0, 3).map(btn => {
    const caption = (btn.text || 'Clique aqui').trim().substring(0, 20)
    if (btn.url) {
      let cleanUrl = btn.url.trim()
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = `https://${cleanUrl}`
      }
      return {
        type: 'url',
        caption,
        url: cleanUrl
      }
    }
    return {
      type: 'node',
      caption,
      target: (btn.payload || btn.text || 'ok').trim().substring(0, 50)
    }
  })

  const subscriberId = typeof userId === 'string' && /^\d+$/.test(userId) ? Number(userId) : userId

  const payload = {
    subscriber_id: subscriberId,
    data: {
      version: 'v2',
      content: {
        type: 'whatsapp',
        messages: [{
          type: 'text',
          text,
          buttons: formattedButtons
        }]
      }
    }
  }

  console.log('[MANYCHAT] sendMessageWithButtons payload:', JSON.stringify(payload))

  const res = await fetch(`${MC_API}/sending/sendContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: getAuthHeader() },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  console.log('[MANYCHAT] sendMessageWithButtons response:', res.status, json)
  if (!res.ok || json.status !== 'success') {
    const errMsg = json.message || `HTTP ${res.status}`
    const details = JSON.stringify(json.details?.messages || json.details || json)
    console.error('[MANYCHAT] sendMessageWithButtons ERR', res.status, errMsg, details)
    throw new Error(`ManyChat API Error: ${errMsg} - ${details}`)
  }
  return json
}

export async function addTagByName(userId: string | number, tagName: string) {
  console.log('[MANYCHAT] addTagByName:', userId, tagName)
  const res = await fetch(`${MC_API}/subscriber/addTagByName`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: getAuthHeader() },
    body: JSON.stringify({ subscriber_id: userId, tag_name: tagName }),
  })
  const json = await res.json()
  console.log('[MANYCHAT] addTagByName response:', res.status, json)
  return json
}

export async function addTagById(userId: string | number, tagId: number | string) {
  console.log('[MANYCHAT] addTagById:', userId, tagId)
  const res = await fetch(`${MC_API}/subscriber/addTag`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: getAuthHeader() },
    body: JSON.stringify({ subscriber_id: userId, tag_id: Number(tagId) }),
  })
  const json = await res.json()
  console.log('[MANYCHAT] addTagById response:', res.status, json)
  return json
}

export async function removeTagByName(userId: string | number, tagName: string) {
  console.log('[MANYCHAT] removeTagByName:', userId, tagName)
  const res = await fetch(`${MC_API}/subscriber/removeTagByName`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: getAuthHeader() },
    body: JSON.stringify({ subscriber_id: userId, tag_name: tagName }),
  })
  const json = await res.json()
  console.log('[MANYCHAT] removeTagByName response:', res.status, json)
  return json
}

export async function findSubscriberByPhone(phone: string) {
  console.log('[MANYCHAT] findSubscriberByPhone searching:', phone)
  if (!phone) return null

  // Clean digits
  const cleanDigits = phone.replace(/\D/g, '')
  if (!cleanDigits) return null

  // If already numeric ID (8 to 10 digits that starts with non-55 or is short)
  if (/^\d{8,10}$/.test(cleanDigits) && !cleanDigits.startsWith('55')) {
    try {
      const info = await getSubscriber(cleanDigits)
      if (info?.status === 'success' && info?.data?.id) {
        return info.data.id
      }
    } catch { }
  }

  const candidates: string[] = []
  
  // Try various formats
  if (cleanDigits.length >= 10) {
      // 5513988658518
      candidates.push(cleanDigits)
      candidates.push(`+${cleanDigits}`)
      // 13988658518 (remove 55)
      if (cleanDigits.startsWith('55')) {
          const without55 = cleanDigits.substring(2)
          candidates.push(without55)
          candidates.push(`+${without55}`)
      }
  } else {
      candidates.push(cleanDigits)
      candidates.push(`+${cleanDigits}`)
  }

  // Remove duplicates
  const uniqueCandidates = [...new Set(candidates)]

  for (const p of uniqueCandidates) {
    try {
      const url = `${MC_API}/subscriber/findBySystemField?phone=${encodeURIComponent(p)}`
      const res = await fetch(url, {
        headers: { Authorization: getAuthHeader() },
      })
      const json = await res.json()
      console.log(`[MANYCHAT] findBySystemField phone=${p} response:`, res.status, JSON.stringify(json))
      if (json?.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
        const foundId = json.data[0].id
        console.log('[MANYCHAT] Found subscriber ID by phone:', foundId)
        return foundId
      }
    } catch (err) {
      console.error('[MANYCHAT] Error in findSubscriberByPhone candidate:', p, err)
    }
  }

  return null
}

export async function findSubscriberByEmail(email: string) {
  console.log('[MANYCHAT] findSubscriberByEmail searching:', email)
  if (!email || !email.includes('@')) return null

  try {
    const url = `${MC_API}/subscriber/findBySystemField?email=${encodeURIComponent(email)}`
    const res = await fetch(url, {
      headers: { Authorization: getAuthHeader() },
    })
    const json = await res.json()
    console.log(`[MANYCHAT] findBySystemField email=${email} response:`, res.status, JSON.stringify(json))
    if (json?.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
      const foundId = json.data[0].id
      console.log('[MANYCHAT] Found subscriber ID by email:', foundId)
      return foundId
    }
  } catch (err) {
    console.error('[MANYCHAT] Error in findSubscriberByEmail:', email, err)
  }

  return null
}