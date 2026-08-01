const GROQ_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions'
const GROQ_MODEL = process.env.GROQ_STT_MODEL || 'whisper-large-v3'

// Detecta se uma mensagem do usuário é uma URL de áudio (áudio do WhatsApp via ManyChat)
export function isAudioMessage(text: string): boolean {
  const audioExt = /\.(ogg|mp3|m4a|wav|opus|aac|amr|oga|mp4)(\?.*)?$/i
  return /^https?:\/\//i.test(text.trim()) && audioExt.test(text.trim())
}

// Baixa o áudio da URL do ManyChat e transcreve via Whisper (Groq)
export async function transcribeAudio(url: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY missing para transcrição de áudio')

  console.log('[STT] Baixando áudio:', url)
  const audioRes = await fetch(url, { cache: 'no-store' })
  if (!audioRes.ok) {
    throw new Error(`Falha ao baixar áudio: ${audioRes.status}`)
  }
  const arrayBuffer = await audioRes.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  console.log('[STT] Áudio baixado:', buffer.length, 'bytes')

  // Groq exige o nome do arquivo com extensão
  const urlObj = new URL(url)
  const fileName = urlObj.pathname.split('/').pop() || 'audio.ogg'
  const mimeType = fileName.endsWith('.ogg') ? 'audio/ogg' : 'audio/mpeg'

  const form = new FormData()
  form.append('file', new Blob([buffer], { type: mimeType }), fileName)
  form.append('model', GROQ_MODEL)
  form.append('language', 'pt')

  console.log('[STT] Enviando para Whisper:', GROQ_MODEL)
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(`Whisper falhou: ${res.status} ${JSON.stringify(json)}`)
  }
  const text = (json.text || '').trim()
  console.log('[STT] Transcrição:', text)
  return text
}
