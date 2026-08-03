'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { getApiUrl } from '@/lib/utils'
import { GEMINI_LIVE_CONFIG, GEMINI_LIVE_VOICES } from '@/lib/gemini-live/config'

const SESSION_KEY = 'lilith_voice_session'

export type Voice = typeof GEMINI_LIVE_VOICES[number]

// Re-exportar para compatibilidade com componentes existentes
export { GEMINI_LIVE_VOICES }

interface SessionData {
  history: unknown[]
  isActive: boolean
  sessionId: string
  resumptionHandle: string | null
  voiceName: string
  timestamp: number
}

function saveSession(
  history: unknown[],
  isActive: boolean,
  sessionId: string,
  resumptionHandle: string | null,
  voiceName: string
) {
  try {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        history: (history || []).slice(-GEMINI_LIVE_CONFIG.MAX_HISTORY_SIZE),
        isActive,
        sessionId,
        resumptionHandle,
        voiceName,
        timestamp: Date.now(),
      })
    )
  } catch {}
}

function loadSession(): SessionData | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as SessionData
    if (Date.now() - data.timestamp > GEMINI_LIVE_CONFIG.SESSION_EXPIRY_MS) {
      return { ...data, isActive: false, resumptionHandle: null }
    }
    return data
  } catch {
    return null
  }
}

function normalizeSchemaTypes(schema: unknown): unknown {
  if (!schema || typeof schema !== 'object') return schema
  if (Array.isArray(schema)) return schema.map(normalizeSchemaTypes)
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(schema)) {
    if (key === 'type' && typeof value === 'string') {
      result[key] = value.toLowerCase()
    } else if (typeof value === 'object' && value !== null) {
      result[key] = normalizeSchemaTypes(value)
    } else {
      result[key] = value
    }
  }
  return result
}

export function useLilithVoice() {
  const [isRecordingVoice, setIsRecordingVoice] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isReadyToSpeak, setIsReadyToSpeak] = useState(false)
  const [scheduledBookings, setScheduledBookings] = useState<unknown[]>([])
  const [transcripts, setTranscripts] = useState<unknown[]>([])

  const [selectedVoice, setSelectedVoice] = useState(() => {
    if (typeof window === 'undefined') return GEMINI_LIVE_CONFIG.DEFAULT_VOICE
    const saved = loadSession()
    return saved?.voiceName || GEMINI_LIVE_CONFIG.DEFAULT_VOICE
  })

  const [sessionId] = useState(() => {
    if (typeof window === 'undefined') return 'live_session'
    const saved = loadSession()
    return (
      saved?.sessionId ??
      `live_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    )
  })

  const wsRef = useRef<WebSocket | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const micWorkletNodeRef = useRef<AudioWorkletNode | null>(null)
  const shouldReconnectRef = useRef(false)
  const nextPlaybackTimeRef = useRef(0)
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([])
  const currentUtteranceRef = useRef({ userText: '', modelText: '' })
  const turnCounterRef = useRef(0)

  const lastToolCallRef = useRef<unknown>(null)
  const newTurnRef = useRef(false)

  const sessionIdRef = useRef(sessionId)
  const resumptionHandleRef = useRef<string | null>(null)
  const conversationHistoryRef = useRef<unknown[]>([])
  const voiceNameRef = useRef(selectedVoice)
  const startLiveDialogRef = useRef<(() => Promise<void>) | null>(null)

  useEffect(() => {
    sessionIdRef.current = sessionId
    voiceNameRef.current = selectedVoice
    const savedSession = loadSession()
    resumptionHandleRef.current = savedSession?.resumptionHandle ?? null
    conversationHistoryRef.current = savedSession?.history ?? []
  }, [sessionId, selectedVoice])

  const persistResumptionHandle = useCallback((handle: string | null) => {
    if (handle === resumptionHandleRef.current) return
    resumptionHandleRef.current = handle
  }, [])

  const saveHistoryToSupabase = useCallback(async () => {
    try {
      const userId = '8024902234'
      await fetch(getApiUrl('/api/gemini-live/voice-history'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          history: conversationHistoryRef.current.slice(-GEMINI_LIVE_CONFIG.MAX_HISTORY_SIZE),
          sessionId: sessionIdRef.current,
        }),
      })
    } catch {}
  }, [])

  const stopAllPlayback = useCallback(() => {
    activeSourcesRef.current.forEach((source) => {
      try {
        source.stop()
      } catch {}
    })
    activeSourcesRef.current = []
    nextPlaybackTimeRef.current = 0
    setIsSpeaking(false)
  }, [])

  const cleanupAudio = useCallback(() => {
    stopAllPlayback()
    if (micWorkletNodeRef.current) {
      try {
        micWorkletNodeRef.current.disconnect()
      } catch {}
      micWorkletNodeRef.current = null
    }
    if (micStreamRef.current) {
      try {
        micStreamRef.current.getTracks().forEach((track) => track.stop())
      } catch {}
      micStreamRef.current = null
    }
  }, [stopAllPlayback])

  const stopLiveDialog = useCallback(() => {
    shouldReconnectRef.current = false
    cleanupAudio()
    if (wsRef.current) {
      try {
        wsRef.current.onclose = null
        wsRef.current.close()
      } catch {}
      wsRef.current = null
    }
    setIsRecordingVoice(false)
    setIsReadyToSpeak(false)
    saveSession(
      conversationHistoryRef.current,
      false,
      sessionIdRef.current,
      resumptionHandleRef.current,
      voiceNameRef.current
    )
  }, [cleanupAudio])

  const convertFloat32ToPcmBase64 = useCallback((inputData: Float32Array): string => {
    const pcmData = new Int16Array(inputData.length)
    for (let i = 0; i < inputData.length; i++) {
      const s = Math.max(-1, Math.min(1, inputData[i]))
      pcmData[i] = s < 0 ? s * 32768 : s * 32767
    }
    const bytes = new Uint8Array(pcmData.buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }, [])

  const startLiveDialog = useCallback(async () => {
    if (typeof window === 'undefined') return
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    setIsRecordingVoice(true)
    shouldReconnectRef.current = true

    cleanupAudio()
    if (wsRef.current) {
      try {
        wsRef.current.onclose = null
        wsRef.current.close()
      } catch {}
      wsRef.current = null
    }

    try {
      const res = await fetch(
        getApiUrl(
          `/api/gemini-live/config?sessionId=${sessionIdRef.current}&voiceName=${selectedVoice}`
        )
      )
      const { key: apiKey, tools, systemInstruction: customInstruction, voiceName } =
        await res.json()

      if (!apiKey) {
        setIsRecordingVoice(false)
        return
      }

      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        audioCtxRef.current = new AudioCtx({ sampleRate: GEMINI_LIVE_CONFIG.AUDIO_SAMPLE_RATE })
      }
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume()
      }

      const micProcessorName = `mic-processor-${Math.random().toString(36).substring(2, 9)}`
      const workletCode = `
        class MicProcessor extends AudioWorkletProcessor {
          process(inputs, outputs, parameters) {
            const input = inputs[0];
            if (input && input.length > 0 && input[0] && input[0].length > 0) {
              let isTalking = false;
              for (let i = 0; i < input[0].length; i += 10) {
                if (Math.abs(input[0][i]) > ${GEMINI_LIVE_CONFIG.VOICE_THRESHOLD}) { isTalking = true; break; }
              }
              this.port.postMessage({ data: input[0], isTalking });
            }
            return true;
          }
        }
        registerProcessor('${micProcessorName}', MicProcessor);
      `
      const blob = new Blob([workletCode], { type: 'application/javascript' })
      const workletUrl = URL.createObjectURL(blob)
      await audioCtxRef.current.audioWorklet.addModule(workletUrl)

      micStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })
      const source = audioCtxRef.current.createMediaStreamSource(micStreamRef.current)
      micWorkletNodeRef.current = new AudioWorkletNode(audioCtxRef.current, micProcessorName)
      source.connect(micWorkletNodeRef.current)

      wsRef.current = new WebSocket(
        `${GEMINI_LIVE_CONFIG.WS_BASE_URL}?key=${apiKey}`
      )

      wsRef.current.onopen = () => {
        setIsReadyToSpeak(true)
        const setupMessage = {
          setup: {
            model: GEMINI_LIVE_CONFIG.DEFAULT_MODEL,
            generation_config: {
              response_modalities: ['AUDIO', 'TEXT'],
              speech_config: {
                voice_config: {
                  prebuilt_voice_config: { voice_name: voiceName },
                },
              },
            },
            system_instruction: {
              parts: [{ text: customInstruction }],
            },
            tools: tools.map((t: unknown) => normalizeSchemaTypes(t)),
          },
        }
        if (resumptionHandleRef.current) {
          // @ts-ignore
          setupMessage.setup.session = { resumption_handle: resumptionHandleRef.current }
        }
        wsRef.current?.send(JSON.stringify(setupMessage))
      }

      wsRef.current.onmessage = async (event) => {
        const data = JSON.parse(event.data)
        
        if (data.setupComplete) {
          persistResumptionHandle(data.session?.resumption_handle || null)
          return
        }

        if (data.toolCall) {
          lastToolCallRef.current = data.toolCall
          const f = data.toolCall.functionCall
          try {
            const res = await fetch(getApiUrl('/api/gemini-live/tools/execute'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: f.name, args: f.args }),
            })
            const result = await res.json()
            if (wsRef.current) {
              wsRef.current.send(
                JSON.stringify({
                  toolResponse: {
                    id: data.toolCall.id,
                    response: { response: result },
                  },
                })
              )
            }
          } catch {}
          return
        }

        if (data.serverContent) {
          const content = data.serverContent
          if (content.modelTurn) {
            const parts = content.modelTurn.parts || []
            let textResponse = ''
            for (const part of parts) {
              if (part.text) textResponse += part.text
              if (part.functionCall) {
                // Handle function call
              }
            }
            
            if (content.modelTurn?.audioData) {
              const audioData = content.modelTurn.audioData
              if (audioData.data && Array.isArray(audioData.data)) {
                for (const chunk of audioData.data) {
                  if (chunk.data) {
                    const pcmBytes = Uint8Array.from(atob(chunk.data), (c) => c.charCodeAt(0))
                    const audioBuffer = await audioCtxRef.current?.decodeAudioData(
                      pcmBytes.buffer.slice(0)
                    )
                    if (audioBuffer && audioCtxRef.current) {
                      const source = audioCtxRef.current.createBufferSource()
                      source.buffer = audioBuffer
                      source.connect(audioCtxRef.current.destination)
                      activeSourcesRef.current.push(source)
                      source.start(nextPlaybackTimeRef.current)
                      nextPlaybackTimeRef.current += audioBuffer.duration
                      setIsSpeaking(true)
                      source.onended = () => {
                        const idx = activeSourcesRef.current.indexOf(source)
                        if (idx > -1) activeSourcesRef.current.splice(idx, 1)
                        if (activeSourcesRef.current.length === 0) {
                          setIsSpeaking(false)
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      wsRef.current.onclose = () => {
        if (shouldReconnectRef.current) {
          setTimeout(() => {
            if (shouldReconnectRef.current) {
              startLiveDialog()
            }
          }, GEMINI_LIVE_CONFIG.RECONNECT_DELAY_MS)
        } else {
          setIsRecordingVoice(false)
          setIsReadyToSpeak(false)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      micWorkletNodeRef.current.port.onmessage = async (event) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
        
        const { data, isTalking } = event.data
        if (isTalking && !isRecordingVoice) {
          setIsRecordingVoice(true)
        }
        
        const base64Audio = convertFloat32ToPcmBase64(data)
        wsRef.current.send(
          JSON.stringify({
            realtimeInput: {
              mediaChunks: [
                {
                  mimeType: 'audio/pcm',
                  data: base64Audio,
                },
              ],
            },
          })
        )
      }
    } catch (error) {
      console.error('Error starting live dialog:', error)
      setIsRecordingVoice(false)
      setIsReadyToSpeak(false)
    }
  }, [selectedVoice, cleanupAudio, persistResumptionHandle, convertFloat32ToPcmBase64, isRecordingVoice])

  useEffect(() => {
    const handleBeforeUnload = () => {
      saveHistoryToSupabase()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [saveHistoryToSupabase])

  return {
    isRecordingVoice,
    isSpeaking,
    isReadyToSpeak,
    scheduledBookings,
    transcripts,
    selectedVoice,
    setSelectedVoice,
    sessionId,
    startLiveDialog,
    stopLiveDialog,
    GEMINI_LIVE_VOICES,
  }
}
