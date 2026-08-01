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
