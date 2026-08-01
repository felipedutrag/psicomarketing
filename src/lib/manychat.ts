const MANYCHAT_AUTH = `4893318:6124c375829053829537d02892ea7ce8`
const MC_API = 'https://api.manychat.com/fb'

export async function getSubscriber(userId: string | number) {
  console.log('[MANYCHAT] getSubscriber:', userId)
  const res = await fetch(`${MC_API}/subscriber/getInfo?subscriber_id=${userId}`, {
    headers: { Authorization: `Bearer ${MANYCHAT_AUTH}` },
  })
  const json = await res.json()
  console.log('[MANYCHAT] getSubscriber response:', res.status, json)
  return json
}

export async function setCustomField(userId: string | number, fieldName: string, fieldValue: string) {
  console.log('[MANYCHAT] setCustomField:', userId, fieldName, fieldValue)
  const res = await fetch(`${MC_API}/subscriber/setCustomField`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${MANYCHAT_AUTH}` },
    body: JSON.stringify({ subscriber_id: userId, field_name: fieldName, field_value: fieldValue }),
  })
  const json = await res.json()
  console.log('[MANYCHAT] setCustomField response:', res.status, json)
  return json
}

export async function sendMessage(userId: string | number, text: string) {
  console.log('[MANYCHAT] sendMessage:', userId, text.substring(0, 100))
  const res = await fetch(`${MC_API}/sending/sendContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${MANYCHAT_AUTH}` },
    body: JSON.stringify({
      subscriber_id: userId,
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
  return json
}

export async function addTagByName(userId: string | number, tagName: string) {
  console.log('[MANYCHAT] addTagByName:', userId, tagName)
  const res = await fetch(`${MC_API}/subscriber/addTagByName`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${MANYCHAT_AUTH}` },
    body: JSON.stringify({ subscriber_id: userId, tag_name: tagName }),
  })
  const json = await res.json()
  console.log('[MANYCHAT] addTagByName response:', res.status, json)
  return json
}

export async function removeTagByName(userId: string | number, tagName: string) {
  console.log('[MANYCHAT] removeTagByName:', userId, tagName)
  const res = await fetch(`${MC_API}/subscriber/removeTagByName`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${MANYCHAT_AUTH}` },
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
    } catch {
      // Ignore error and try search
    }
  }

  const candidates: string[] = []
  if (cleanDigits.startsWith('55') && cleanDigits.length >= 12) {
    candidates.push(`+${cleanDigits}`)
    candidates.push(cleanDigits)
  } else if (cleanDigits.length === 10 || cleanDigits.length === 11) {
    candidates.push(`+55${cleanDigits}`)
    candidates.push(`55${cleanDigits}`)
  } else {
    candidates.push(`+${cleanDigits}`)
    candidates.push(cleanDigits)
  }

  for (const p of candidates) {
    try {
      const url = `${MC_API}/subscriber/findBySystemField?phone=${encodeURIComponent(p)}`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${MANYCHAT_AUTH}` },
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
      headers: { Authorization: `Bearer ${MANYCHAT_AUTH}` },
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
