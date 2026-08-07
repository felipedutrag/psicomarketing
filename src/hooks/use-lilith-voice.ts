'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { getApiUrl } from '@/lib/utils'
import { GEMINI_LIVE_CONFIG, GEMINI_LIVE_VOICES } from '@/lib/gemini-live/config'
import { TOOL_NAMES } from '@/lib/process-ai/tool-names'

const SESSION_KEY = 'lilith_voice_session'

// Trava global da página: garante que apenas UMA sessão de voz fique ativa por vez.
// Evita que as instâncias mobile/desktop do demo (ambas montadas) falem simultaneamente.
let activeVoiceInstanceId: string | null = null

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
  voiceName: string,
  key: string = SESSION_KEY
) {
  try {
    localStorage.setItem(
      key,
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

function loadSession(key: string = SESSION_KEY): SessionData | null {
  try {
    const raw = localStorage.getItem(key)
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

 
function normalizeSchemaTypes(schema: any): any {
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

const RESPONSE_SAMPLE_RATE = 24000

interface Identity {
  nome?: string | null
  id?: string | null
}

export interface VoiceOptions {
  configUrl?: string
  executeUrl?: string
  sessionKey?: string
  historyUrl?: string
}

export function useLilithVoice(identity?: Identity, options?: VoiceOptions) {
  const [isRecordingVoice, setIsRecordingVoice] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isReadyToSpeak, setIsReadyToSpeak] = useState(false)
  const [scheduledBookings, setScheduledBookings] = useState<unknown[]>([])
  const [transcripts, setTranscripts] = useState<unknown[]>([])

  const [selectedVoice, setSelectedVoice] = useState(() => {
    if (typeof window === 'undefined') return GEMINI_LIVE_CONFIG.DEFAULT_VOICE
    const saved = loadSession(options?.sessionKey)
    return saved?.voiceName || GEMINI_LIVE_CONFIG.DEFAULT_VOICE
  })

  const [sessionId] = useState(() => {
    if (typeof window === 'undefined') return 'live_session'
    const saved = loadSession(options?.sessionKey)
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
  const isSpeakingRef = useRef(false)
  const currentUtteranceRef = useRef({ userText: '', modelText: '' })
  const turnCounterRef = useRef(0)

  const lastToolCallRef = useRef<string | null>(null)
  const newTurnRef = useRef(false)
  const identityRef = useRef(identity)
  const optionsRef = useRef(options)

  const sessionIdRef = useRef(sessionId)
  const resumptionHandleRef = useRef<string | null>(null)
  const conversationHistoryRef = useRef<unknown[]>([])
  const voiceNameRef = useRef(selectedVoice)
  const startLiveDialogRef = useRef<(() => Promise<void>) | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const [instanceId] = useState(() => {
    if (typeof window === 'undefined') return 'live_instance'
    return `lilith_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  })
  const startingRef = useRef(false)

  useEffect(() => {
    sessionIdRef.current = sessionId
    voiceNameRef.current = selectedVoice
    identityRef.current = identity
    optionsRef.current = options
    console.log('[LilithVoice] Identity atualizado:', identity, 'identityRef.current:', identityRef.current)
    const savedSession = loadSession(options?.sessionKey)
    resumptionHandleRef.current = savedSession?.resumptionHandle ?? null
    conversationHistoryRef.current = savedSession?.history ?? []
  }, [sessionId, selectedVoice, identity, options])

  const persistResumptionHandle = useCallback((handle: string | null) => {
    if (handle === resumptionHandleRef.current) return
    resumptionHandleRef.current = handle
  }, [])

  const saveHistoryToSupabase = useCallback(async () => {
    if (conversationHistoryRef.current.length === 0) return
    try {
      const userId = '8024902234'
      await fetch(getApiUrl(optionsRef.current?.historyUrl || '/api/gemini-live/voice-history'), {
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
    isSpeakingRef.current = false
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
    activeVoiceInstanceId = null
    startingRef.current = false
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
      voiceNameRef.current,
      optionsRef.current?.sessionKey
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

    if (activeVoiceInstanceId !== null && activeVoiceInstanceId !== instanceId) {
      console.warn('[LilithVoice] Já existe uma sessão de voz ativa na página. Ignorando início duplicado.')
      return
    }
    if (startingRef.current) {
      console.warn('[LilithVoice] Início de sessão já em andamento. Ignorando chamada duplicada.')
      return
    }
    startingRef.current = true
    activeVoiceInstanceId = instanceId

    if (window.speechSynthesis) window.speechSynthesis.cancel()
    setIsRecordingVoice(true)
    shouldReconnectRef.current = true
    reconnectAttemptsRef.current = 0

    // Garante limpeza completa de qualquer instância anterior antes de conectar
    cleanupAudio()
    if (wsRef.current) {
      try {
        wsRef.current.onclose = null
        wsRef.current.close()
      } catch {}
      wsRef.current = null
    }

    try {
      // Capturar o identity atual diretamente no momento da chamada
      const currentIdentity = identityRef.current
      const identityParams = currentIdentity 
        ? `&nome=${encodeURIComponent(currentIdentity.nome || '')}&id=${encodeURIComponent(currentIdentity.id || '')}`
        : ''
      console.log('[LilithVoice] Chamando config API com params:', identityParams, 'identity:', currentIdentity)
      const baseConfigUrl = optionsRef.current?.configUrl || '/api/gemini-live/config'
      const res = await fetch(
        getApiUrl(
          `${baseConfigUrl}?sessionId=${sessionIdRef.current}&voiceName=${selectedVoice}${identityParams}`
        )
      )
      const { key: apiKey, tools, systemInstruction: customInstruction, voiceName } = await res.json()
      console.log('[LilithVoice] System instruction recebida:', customInstruction?.substring(0, 200))

      if (!apiKey) {
        setIsRecordingVoice(false)
        activeVoiceInstanceId = null
        startingRef.current = false
        return
      }

      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        audioCtxRef.current = new AudioCtx({ sampleRate: GEMINI_LIVE_CONFIG.AUDIO_SAMPLE_RATE })
      }
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume()
      }

      const micProcessorName = `mic-processor-${Date.now()}`
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
      URL.revokeObjectURL(workletUrl)

      micStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      const micSource = audioCtxRef.current.createMediaStreamSource(micStreamRef.current)
      const micWorkletNode = new AudioWorkletNode(audioCtxRef.current, micProcessorName)
      micWorkletNodeRef.current = micWorkletNode

      const silentGain = audioCtxRef.current.createGain()
      silentGain.gain.value = 0
      micWorkletNode.connect(silentGain)
      silentGain.connect(audioCtxRef.current.destination)

      let setupComplete = false
      let audioPipelineStarted = false

      const savedVoiceName = voiceNameRef.current
      let resumeHandleUsed = resumptionHandleRef.current
      if (savedVoiceName && voiceName && savedVoiceName !== voiceName) {
        console.log(
          '[useLilithVoice] Voz mudou de',
          savedVoiceName,
          'para',
          voiceName,
          '- descartando resumption handle.'
        )
        resumeHandleUsed = null
        resumptionHandleRef.current = null
      }
      voiceNameRef.current = voiceName || GEMINI_LIVE_CONFIG.DEFAULT_VOICE

      const startAudioPipeline = () => {
        if (audioPipelineStarted || ws.readyState !== WebSocket.OPEN) return
        audioPipelineStarted = true

        micWorkletNode.port.onmessage = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return
          const { data } = e.data
          const base64Audio = convertFloat32ToPcmBase64(data)
          ws.send(
            JSON.stringify({
              realtimeInput: {
                audio: {
                  data: base64Audio,
                  mimeType: 'audio/pcm;rate=16000',
                },
              },
            })
          )
        }
        micSource.connect(micWorkletNode)
      }

      const ws = new WebSocket(`${GEMINI_LIVE_CONFIG.WS_BASE_URL}?key=${apiKey}`)
      wsRef.current = ws

      ws.onclose = (event) => {
        if (event.code && event.code !== 1000) {
          console.warn(`WebSocket fechado (code=${event.code}, reason=${event.reason || 'n/a'})`)
        }
        if (resumeHandleUsed && !setupComplete) {
          console.warn(
            '[Native Resumption] Falha ao retomar sessão, handle descartado:',
            event.reason || event.code
          )
          resumptionHandleRef.current = null
          saveSession(conversationHistoryRef.current, false, sessionIdRef.current, null, voiceNameRef.current, optionsRef.current?.sessionKey)
        }
        setIsReadyToSpeak(false)

        if (
          shouldReconnectRef.current &&
          reconnectAttemptsRef.current < GEMINI_LIVE_CONFIG.MAX_RECONNECT_ATTEMPTS
        ) {
          const attempt = reconnectAttemptsRef.current + 1
          reconnectAttemptsRef.current = attempt
          const delay = Math.min(
            GEMINI_LIVE_CONFIG.RECONNECT_DELAY_MS * Math.pow(2, attempt - 1),
            GEMINI_LIVE_CONFIG.MAX_RECONNECT_DELAY_MS
          )
          setTimeout(() => {
            if (shouldReconnectRef.current) {
              startLiveDialogRef.current?.()
            }
          }, delay)
        } else {
          shouldReconnectRef.current = false
          setIsRecordingVoice(false)
          activeVoiceInstanceId = null
          startingRef.current = false
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      ws.onopen = () => {
         
        const normalizedTools = (tools || []).map((t: any) => ({
          ...t,
          parameters: normalizeSchemaTypes(t.parameters),
        }))

        const formattedTools = [
          {
            functionDeclarations: normalizedTools.concat([
              {
                name: 'desligar_conexao',
                description: 'Encerra a chamada.',
                parameters: { type: 'object', properties: {} },
              },
            ]),
          },
        ]

         
        const setupPayload: any = {
          model: GEMINI_LIVE_CONFIG.DEFAULT_MODEL,
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceName || GEMINI_LIVE_CONFIG.DEFAULT_VOICE },
              },
            },
          },
          tools: formattedTools,
          systemInstruction: { parts: [{ text: customInstruction }] },
          sessionResumption: resumeHandleUsed ? { handle: resumeHandleUsed } : {},
        }

        ws.send(JSON.stringify({ setup: setupPayload }))
      }

      ws.onmessage = async (event) => {
         
        const data = JSON.parse(
          typeof event.data === 'string' ? event.data : await event.data.text()
        ) as any

        if (data.setupComplete) {
          setupComplete = true
          startAudioPipeline()
          reconnectAttemptsRef.current = 0
          setIsReadyToSpeak(true)
          
          // Enviar um prompt inicial para forçar a IA a começar a falar
          console.log('[LilithVoice] Setup completo, enviando prompt inicial')
          setTimeout(() => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              // Enviar um prompt de texto simples para iniciar a conversa
              wsRef.current.send(JSON.stringify({ 
                realtimeInput: { 
                  text: 'Comece agora.' 
                } 
              }))
              console.log('[LilithVoice] Prompt inicial enviado')
            }
          }, 1000)
          return
        }

        if (data.serverContent?.interrupted) {
          stopAllPlayback()
          return
        }

        const resumptionUpdate = data.sessionResumptionUpdate
        if (resumptionUpdate?.resumable && resumptionUpdate?.newHandle) {
          persistResumptionHandle(resumptionUpdate.newHandle)
        }

        const serverContent = data.serverContent
        if (serverContent) {
          const modelTurn = serverContent.modelTurn
          const userTurn = serverContent.userTurn

          if (userTurn?.parts) {
            userTurn.parts
              .filter((p: any) => p.text)
              .forEach((p: any) => (currentUtteranceRef.current.userText += p.text))
          }

          if (modelTurn?.parts) {
            modelTurn.parts
              .filter((p: any) => p.text)
              .forEach((p: any) => (currentUtteranceRef.current.modelText += p.text))
          }
        }

        if (data.serverContent?.turnComplete) {
          newTurnRef.current = true
          const { userText, modelText } = currentUtteranceRef.current
          const displayUserText = userText || '[áudio do usuário]'

          if (userText || modelText) {
            conversationHistoryRef.current.push({
              role: 'user',
              content: displayUserText,
              timestamp: new Date(),
            })
            conversationHistoryRef.current.push({
              role: 'model',
              content: modelText || '[áudio da Lilith]',
              timestamp: new Date(),
            })

            turnCounterRef.current++
            if (turnCounterRef.current >= 4) {
              saveHistoryToSupabase()
              turnCounterRef.current = 0
            }

            saveSession(
              conversationHistoryRef.current,
              true,
              sessionIdRef.current,
              resumptionHandleRef.current,
              voiceNameRef.current,
              optionsRef.current?.sessionKey
            )
          }
          currentUtteranceRef.current = { userText: '', modelText: '' }
        }

        const modelParts = data.serverContent?.modelTurn?.parts || []
        const toolCall = data.toolCall || data.tool_call
        const functionCalls = [
          ...(toolCall?.functionCalls || toolCall?.function_calls || []),
          ...modelParts.filter((p: any) => p.functionCall).map((p: any) => p.functionCall),
        ]

        if (functionCalls.length > 0) {
          console.log(
            '[ToolFunction]',
            functionCalls.map((f: any) => f.name).join(', ')
          )
           
          ;(async () => {
             
            const dedupKey = JSON.stringify(
              functionCalls.map((f: any) => ({ name: f.name, args: f.args }))
            )
            if (lastToolCallRef.current === dedupKey) {
              console.warn('[ToolFunction] Duplicate call ignored')
              return
            }
            lastToolCallRef.current = dedupKey
            setTimeout(() => {
              lastToolCallRef.current = null
            }, 10000)

            const responses = await Promise.all(
              functionCalls.map(async (f: any) => {
                if (f.name === 'desligar_conexao') {
                  setTimeout(stopLiveDialog, 400)
                  return { name: f.name, id: f.id, response: { status: 'success' } }
                }
                if (f.name === TOOL_NAMES.voiceBookingCompleted) {
                  console.log('[LilithVoice] voice_booking_completed chamada')
                  // Registra que o usuário completou agendamento por voz
                  return { name: f.name, id: f.id, response: { status: 'success', message: 'Agendamento por voz registrado' } }
                }
                 
                let finalResponse: any
                try {
                  // Adicionar contexto de identificação aos argumentos
                  const enrichedArgs = {
                    ...f.args,
                    contextId: identityRef.current?.id || null
                  }
                  
                  const res = await fetch(getApiUrl(optionsRef.current?.executeUrl || '/api/gemini-live/tools/execute'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: f.name, args: enrichedArgs }),
                  })
                  const result = await res.json()
                  if (result.agendamento) {
                    setScheduledBookings((prev) => [...prev, result.agendamento])
                  }
                  finalResponse =
                    result.status === 'success'
                      ? result
                      : { error: result.message || result.error || 'Erro desconhecido' }
                } catch (e) {
                  finalResponse = {
                    error: `Falha ao executar ferramenta ${f.name}: ${
                      e instanceof Error ? e.message : 'Erro desconhecido'
                    }`,
                  }
                }
                return { name: f.name, id: f.id, response: finalResponse }
              })
            )
            ws.send(JSON.stringify({ toolResponse: { functionResponses: responses } }))
          })().catch((e) => console.error('[ToolFunction] Erro na execução:', e))
          return
        }

        const audioPart = modelParts.find((p: any) => p.inlineData?.data)
        if (audioPart) {
          if (newTurnRef.current) {
            stopAllPlayback()
            newTurnRef.current = false
          }
          const binaryString = window.atob(audioPart.inlineData.data)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i)
          const int16 = new Int16Array(bytes.buffer)
          const float32 = new Float32Array(int16.length)
          for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768.0
          const buffer = audioCtxRef.current!.createBuffer(1, float32.length, RESPONSE_SAMPLE_RATE)
          buffer.getChannelData(0).set(float32)
          const source = audioCtxRef.current!.createBufferSource()
          source.buffer = buffer
          source.connect(audioCtxRef.current!.destination)
          const now = audioCtxRef.current!.currentTime
          if (nextPlaybackTimeRef.current < now) nextPlaybackTimeRef.current = now + 0.04
          source.start(nextPlaybackTimeRef.current)
          nextPlaybackTimeRef.current += buffer.duration
          activeSourcesRef.current.push(source)
          setIsSpeaking(true)
          isSpeakingRef.current = true
          source.onended = () => {
            activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source)
            if (activeSourcesRef.current.length === 0) {
              setIsSpeaking(false)
              isSpeakingRef.current = false
            }
          }
        }
      }

      startingRef.current = false
    } catch (error) {
      console.error('[useLilithVoice] Erro:', error)
      setIsRecordingVoice(false)
      setIsReadyToSpeak(false)
      activeVoiceInstanceId = null
      startingRef.current = false
    }
  }, [
    selectedVoice,
    cleanupAudio,
    stopAllPlayback,
    stopLiveDialog,
    persistResumptionHandle,
    convertFloat32ToPcmBase64,
    saveHistoryToSupabase,
    instanceId,
  ])

  useEffect(() => {
    startLiveDialogRef.current = startLiveDialog
  }, [startLiveDialog])

  const sendTextToVoice = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return false
    const textInput = {
      clientContent: {
        turns: [
          {
            role: 'user',
            parts: [{ text }],
          },
        ],
        turnComplete: true,
      },
    }
    currentUtteranceRef.current = {
      userText: currentUtteranceRef.current.userText + text,
      modelText: currentUtteranceRef.current.modelText,
    }
    wsRef.current.send(JSON.stringify(textInput))
    return true
  }, [])

  const toggleVoiceRecording = useCallback(() => {
    if (isRecordingVoice) {
      stopLiveDialog()
    } else {
      startLiveDialog()
    }
  }, [isRecordingVoice, startLiveDialog, stopLiveDialog])

  useEffect(() => {
    const handleBeforeUnload = () => {
      saveSession(
        conversationHistoryRef.current,
        isRecordingVoice,
        sessionIdRef.current,
        resumptionHandleRef.current,
        voiceNameRef.current,
        optionsRef.current?.sessionKey
      )
      saveHistoryToSupabase()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isRecordingVoice, saveHistoryToSupabase])

  return {
    isRecordingVoice,
    isSpeaking,
    isReadyToSpeak: isReadyToSpeak && !isSpeaking,
    scheduledBookings,
    transcripts,
    selectedVoice,
    setSelectedVoice,
    sessionId,
    startLiveDialog,
    stopLiveDialog,
    toggleVoiceRecording,
    sendTextToVoice,
    GEMINI_LIVE_VOICES,
  }
}
