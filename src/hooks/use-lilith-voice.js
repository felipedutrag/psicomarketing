"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { getApiUrl } from "@/lib/utils";

const SESSION_KEY = "lilith_voice_session";

export const GEMINI_LIVE_VOICES = [
  { id: "Leda", name: "Leda", gender: "Feminina", style: "Grave & Firme (Padrão Lilith)" },
  { id: "Aoede", name: "Aoede", gender: "Feminina", style: "Suave & Acolhedora" },
  { id: "Kore", name: "Kore", gender: "Feminina", style: "Expressiva & Fluida" },
  { id: "Puck", name: "Puck", gender: "Masculina", style: "Energética & Dinâmica" },
  { id: "Charon", name: "Charon", gender: "Masculina", style: "Profunda & Séria" },
  { id: "Fenrir", name: "Fenrir", gender: "Masculina", style: "Autoritária & Ponderada" },
  { id: "Orpheus", name: "Orpheus", gender: "Masculina", style: "Suave & Calma" },
];

function saveSession(history, isActive, sessionId, resumptionHandle, voiceName) {
  try {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        history: (history || []).slice(-20),
        isActive,
        sessionId,
        resumptionHandle,
        voiceName,
        timestamp: Date.now(),
      })
    );
  } catch {}
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.timestamp > 7200_000) {
      return { ...data, isActive: false, resumptionHandle: null };
    }
    return data;
  } catch {
    return null;
  }
}

function normalizeSchemaTypes(schema) {
  if (!schema || typeof schema !== "object") return schema;
  if (Array.isArray(schema)) return schema.map(normalizeSchemaTypes);
  const result = {};
  for (const [key, value] of Object.entries(schema)) {
    if (key === "type" && typeof value === "string") {
      result[key] = value.toLowerCase();
    } else if (typeof value === "object" && value !== null) {
      result[key] = normalizeSchemaTypes(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function useLilithVoice() {
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isReadyToSpeak, setIsReadyToSpeak] = useState(false);
  const [scheduledBookings, setScheduledBookings] = useState([]);
  const [transcripts, setTranscripts] = useState([]);
  
  const [selectedVoice, setSelectedVoice] = useState(() => {
    if (typeof window === "undefined") return "Leda";
    const saved = loadSession();
    return saved?.voiceName || "Leda";
  });

  const [sessionId] = useState(() => {
    if (typeof window === "undefined") return "live_session";
    const saved = loadSession();
    return (
      saved?.sessionId ??
      `live_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    );
  });

  const wsRef = useRef(null);
  const audioCtxRef = useRef(null);
  const micStreamRef = useRef(null);
  const micWorkletNodeRef = useRef(null);
  const shouldReconnectRef = useRef(false);
  const nextPlaybackTimeRef = useRef(0);
  const activeSourcesRef = useRef([]);
  const currentUtteranceRef = useRef({ userText: "", modelText: "" });
  const turnCounterRef = useRef(0);

  const lastToolCallRef = useRef(null);
  const newTurnRef = useRef(false);

  const sessionIdRef = useRef(sessionId);
  const resumptionHandleRef = useRef(null);
  const conversationHistoryRef = useRef([]);
  const voiceNameRef = useRef(selectedVoice);
  const startLiveDialogRef = useRef(null);

  useEffect(() => {
    sessionIdRef.current = sessionId;
    voiceNameRef.current = selectedVoice;
    const savedSession = loadSession();
    resumptionHandleRef.current = savedSession?.resumptionHandle ?? null;
    conversationHistoryRef.current = savedSession?.history ?? [];
  }, [sessionId, selectedVoice]);

  const persistResumptionHandle = useCallback((handle) => {
    if (handle === resumptionHandleRef.current) return;
    resumptionHandleRef.current = handle;
  }, []);

  const saveHistoryToSupabase = useCallback(async () => {
    try {
      const userId = "8024902234";
      await fetch(getApiUrl("/api/config/voice-history"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          history: conversationHistoryRef.current.slice(-20),
          sessionId: sessionIdRef.current,
        }),
      });
    } catch {}
  }, []);

  const stopAllPlayback = useCallback(() => {
    activeSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch {}
    });
    activeSourcesRef.current = [];
    nextPlaybackTimeRef.current = 0;
    setIsSpeaking(false);
  }, []);

  const cleanupAudio = useCallback(() => {
    stopAllPlayback();
    if (micWorkletNodeRef.current) {
      try {
        micWorkletNodeRef.current.disconnect();
      } catch {}
      micWorkletNodeRef.current = null;
    }
    if (micStreamRef.current) {
      try {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch {}
      micStreamRef.current = null;
    }
  }, [stopAllPlayback]);

  const stopLiveDialog = useCallback(() => {
    shouldReconnectRef.current = false;
    cleanupAudio();
    if (wsRef.current) {
      try {
        wsRef.current.onclose = null;
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }
    setIsRecordingVoice(false);
    setIsReadyToSpeak(false);
    saveSession(
      conversationHistoryRef.current,
      false,
      sessionIdRef.current,
      resumptionHandleRef.current,
      voiceNameRef.current
    );
  }, [cleanupAudio]);

  const convertFloat32ToPcmBase64 = useCallback((inputData) => {
    const pcmData = new Int16Array(inputData.length);
    for (let i = 0; i < inputData.length; i++) {
      const s = Math.max(-1, Math.min(1, inputData[i]));
      pcmData[i] = s < 0 ? s * 32768 : s * 32767;
    }
    const bytes = new Uint8Array(pcmData.buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }, []);

  const startLiveDialog = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsRecordingVoice(true);
    shouldReconnectRef.current = true;

    cleanupAudio();
    if (wsRef.current) {
      try {
        wsRef.current.onclose = null;
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }

    try {
      const res = await fetch(
        getApiUrl(
          `/api/config/gemini-live-setup?sessionId=${sessionIdRef.current}&voiceName=${selectedVoice}`
        )
      );
      const { key: apiKey, tools, systemInstruction: customInstruction, voiceName } =
        await res.json();

      if (!apiKey) {
        setIsRecordingVoice(false);
        return;
      }

      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = new AudioCtx({ sampleRate: 16000 });
      }
      if (audioCtxRef.current.state === "suspended") {
        await audioCtxRef.current.resume();
      }

      const micProcessorName = `mic-processor-${Math.random().toString(36).substring(2, 9)}`;
      const workletCode = `
        class MicProcessor extends AudioWorkletProcessor {
          process(inputs, outputs, parameters) {
            const input = inputs[0];
            if (input && input.length > 0 && input[0] && input[0].length > 0) {
              let isTalking = false;
              for (let i = 0; i < input[0].length; i += 10) {
                if (Math.abs(input[0][i]) > 0.05) { isTalking = true; break; }
              }
              this.port.postMessage({ data: input[0], isTalking });
            }
            return true;
          }
        }
        registerProcessor('${micProcessorName}', MicProcessor);
      `;
      const blob = new Blob([workletCode], { type: "application/javascript" });
      const workletUrl = URL.createObjectURL(blob);
      await audioCtxRef.current.audioWorklet.addModule(workletUrl);
      URL.revokeObjectURL(workletUrl);

      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = micStream;
      const micSource = audioCtxRef.current.createMediaStreamSource(micStream);
      const micWorkletNode = new AudioWorkletNode(
        audioCtxRef.current,
        micProcessorName
      );
      micWorkletNodeRef.current = micWorkletNode;

      const silentGain = audioCtxRef.current.createGain();
      silentGain.gain.value = 0;
      micWorkletNode.connect(silentGain);
      silentGain.connect(audioCtxRef.current.destination);

      let setupComplete = false;
      let audioPipelineStarted = false;

      const savedVoiceName = voiceNameRef.current;
      let resumeHandleUsed = resumptionHandleRef.current;
      if (savedVoiceName && voiceName && savedVoiceName !== voiceName) {
        resumeHandleUsed = null;
        resumptionHandleRef.current = null;
      }
      voiceNameRef.current = voiceName || selectedVoice || "Leda";

      const startAudioPipeline = () => {
        if (audioPipelineStarted || ws.readyState !== WebSocket.OPEN) return;
        audioPipelineStarted = true;

        micWorkletNode.port.onmessage = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          const { data } = e.data;

          const base64Audio = convertFloat32ToPcmBase64(data);
          ws.send(
            JSON.stringify({
              realtimeInput: {
                audio: { data: base64Audio, mimeType: "audio/pcm;rate=16000" },
              },
            })
          );
        };
        micSource.connect(micWorkletNode);
      };

      const ws = new WebSocket(
        `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`
      );
      wsRef.current = ws;

      ws.onclose = () => {
        if (resumeHandleUsed && !setupComplete) {
          resumptionHandleRef.current = null;
          saveSession(
            conversationHistoryRef.current,
            false,
            sessionIdRef.current,
            null,
            voiceNameRef.current
          );
        }
        setIsReadyToSpeak(false);

        if (shouldReconnectRef.current) {
          cleanupAudio();
          setTimeout(() => {
            if (shouldReconnectRef.current && startLiveDialogRef.current) {
              startLiveDialogRef.current();
            }
          }, 3000);
        }
      };

      ws.onopen = () => {
        const normalizedTools = (tools || []).map((t) => ({
          ...t,
          parameters: normalizeSchemaTypes(t.parameters),
        }));

        const formattedTools = [
          {
            functionDeclarations: normalizedTools.concat([
              {
                name: "desligar_conexao",
                description: "Encerra a chamada.",
                parameters: { type: "object", properties: {} },
              },
            ]),
          },
        ];

        const setupPayload = {
          model: "models/gemini-3.1-flash-live-preview",
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice || "Leda" } },
            },
          },
          tools: formattedTools,
          systemInstruction: { parts: [{ text: customInstruction || "Você é Lilith..." }] },
          sessionResumption: resumeHandleUsed ? { handle: resumeHandleUsed } : {},
        };

        ws.send(JSON.stringify({ setup: setupPayload }));
      };

      ws.onmessage = async (event) => {
        const data = JSON.parse(
          typeof event.data === "string" ? event.data : await event.data.text()
        );

        if (data.setupComplete) {
          setupComplete = true;
          startAudioPipeline();
          setIsReadyToSpeak(true);
          // Send kickoff prompt so AI starts speaking first immediately upon connection
          ws.send(
            JSON.stringify({
              clientContent: {
                turns: [
                  {
                    role: "user",
                    parts: [
                      {
                        text: "Olá Lilith! Inicie nossa conversa apresentando-se brevemente.",
                      },
                    ],
                  },
                ],
                turnComplete: true,
              },
            })
          );
          return;
        }

        if (data.serverContent?.interrupted) {
          stopAllPlayback();
          return;
        }

        const resumptionUpdate = data.sessionResumptionUpdate;
        if (resumptionUpdate?.resumable && resumptionUpdate?.newHandle) {
          persistResumptionHandle(resumptionUpdate.newHandle);
        }

        const serverContent = data.serverContent;
        if (serverContent) {
          const modelTurn = serverContent.modelTurn;
          const userTurn = serverContent.userTurn;

          if (userTurn?.parts) {
            userTurn.parts
              .filter((p) => p.text)
              .forEach((p) => (currentUtteranceRef.current.userText += p.text));
          }

          if (modelTurn?.parts) {
            modelTurn.parts
              .filter((p) => p.text)
              .forEach((p) => (currentUtteranceRef.current.modelText += p.text));
          }
        }

        if (data.serverContent?.turnComplete) {
          newTurnRef.current = true;
          const { userText, modelText } = currentUtteranceRef.current;
          const displayUserText = userText || "[áudio do usuário]";
          const displayModelText = modelText || "[áudio da Lilith]";

          if (userText || modelText) {
            conversationHistoryRef.current.push({
              role: "user",
              content: displayUserText,
              timestamp: new Date(),
            });
            conversationHistoryRef.current.push({
              role: "model",
              content: displayModelText,
              timestamp: new Date(),
            });

            setTranscripts((prev) => [
              ...prev,
              { role: "user", text: displayUserText },
              { role: "model", text: displayModelText },
            ]);

            fetch(getApiUrl("/api/docs/live-chat-log"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userText: displayUserText,
                modelText: displayModelText,
                sessionId: sessionIdRef.current,
              }),
            }).catch(() => {});

            turnCounterRef.current++;
            if (turnCounterRef.current >= 4) {
              saveHistoryToSupabase();
              turnCounterRef.current = 0;
            }

            saveSession(
              conversationHistoryRef.current,
              true,
              sessionIdRef.current,
              resumptionHandleRef.current,
              voiceNameRef.current
            );
          }
          currentUtteranceRef.current = { userText: "", modelText: "" };
        }

        const modelParts = data.serverContent?.modelTurn?.parts || [];
        const toolCall = data.toolCall || data.tool_call;
        const functionCalls = [
          ...(toolCall?.functionCalls || toolCall?.function_calls || []),
          ...modelParts.filter((p) => p.functionCall).map((p) => p.functionCall),
        ];

        if (functionCalls.length > 0) {
          (async () => {
            const dedupKey = JSON.stringify(
              functionCalls.map((f) => ({ name: f.name, args: f.args }))
            );
            if (lastToolCallRef.current === dedupKey) {
              return;
            }
            lastToolCallRef.current = dedupKey;
            setTimeout(() => {
              lastToolCallRef.current = null;
            }, 10000);

            const responses = await Promise.all(
              functionCalls.map(async (f) => {
                if (f.name === "desligar_conexao") {
                  setTimeout(stopLiveDialog, 400);
                  return { name: f.name, id: f.id, response: { status: "success" } };
                }
                let finalResponse;
                try {
                  const res = await fetch(getApiUrl("/api/tools/execute"), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: f.name, args: f.args }),
                  });
                  const result = await res.json();
                  finalResponse =
                    result.status === "success"
                      ? result
                      : { error: result.message || result.error || "Erro desconhecido" };

                  if (f.name === "agendarConsulta" && result.agendamento) {
                    setScheduledBookings((prev) => [result.agendamento, ...prev]);
                  }
                } catch (e) {
                  finalResponse = {
                    error: `Falha ao executar ferramenta ${f.name}: ${
                      e instanceof Error ? e.message : "Erro desconhecido"
                    }`,
                  };
                }
                return { name: f.name, id: f.id, response: finalResponse };
              })
            );

            ws.send(JSON.stringify({ toolResponse: { functionResponses: responses } }));
          })().catch(() => {});
          return;
        }

        const audioPart = modelParts.find((p) => p.inlineData?.data);
        if (audioPart) {
          if (newTurnRef.current) {
            stopAllPlayback();
            newTurnRef.current = false;
          }
          const binaryString = window.atob(audioPart.inlineData.data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++)
            bytes[i] = binaryString.charCodeAt(i);
          const int16 = new Int16Array(bytes.buffer);
          const float32 = new Float32Array(int16.length);
          for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768.0;

          if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            audioCtxRef.current = new AudioCtx({ sampleRate: 24000 });
          }

          const buffer = audioCtxRef.current.createBuffer(
            1,
            float32.length,
            24000
          );
          buffer.getChannelData(0).set(float32);
          const source = audioCtxRef.current.createBufferSource();
          source.buffer = buffer;
          source.connect(audioCtxRef.current.destination);
          const now = audioCtxRef.current.currentTime;
          if (nextPlaybackTimeRef.current < now) nextPlaybackTimeRef.current = now + 0.04;
          source.start(nextPlaybackTimeRef.current);
          nextPlaybackTimeRef.current += buffer.duration;
          activeSourcesRef.current.push(source);
          setIsSpeaking(true);
          source.onended = () => {
            activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
            if (activeSourcesRef.current.length === 0) {
              setIsSpeaking(false);
            }
          };
        }
      };
    } catch (err) {
      console.error("[useLilithVoice] Erro ao iniciar live dialog:", err);
    }
  }, [cleanupAudio, convertFloat32ToPcmBase64, persistResumptionHandle, saveHistoryToSupabase, selectedVoice, stopAllPlayback, stopLiveDialog]);

  useEffect(() => {
    startLiveDialogRef.current = startLiveDialog;
  }, [startLiveDialog]);

  const sendTextToVoice = useCallback((text) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const textInput = {
        clientContent: {
          turns: [
            {
              role: "user",
              parts: [{ text }],
            },
          ],
          turnComplete: true,
        },
      };
      currentUtteranceRef.current = {
        userText: currentUtteranceRef.current.userText + text,
        modelText: currentUtteranceRef.current.modelText,
      };
      wsRef.current.send(JSON.stringify(textInput));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      saveSession(
        conversationHistoryRef.current,
        isRecordingVoice,
        sessionIdRef.current,
        resumptionHandleRef.current,
        voiceNameRef.current
      );
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isRecordingVoice]);

  const toggleVoiceRecording = useCallback(() => {
    if (isRecordingVoice) {
      stopLiveDialog();
    } else {
      startLiveDialog();
    }
  }, [isRecordingVoice, startLiveDialog, stopLiveDialog]);

  return {
    isRecordingVoice,
    isReadyToSpeak: isReadyToSpeak && !isSpeaking,
    isSpeaking,
    startLiveDialog,
    stopLiveDialog,
    toggleVoiceRecording,
    sendTextToVoice,
    sessionId,
    selectedVoice,
    setSelectedVoice,
    scheduledBookings,
    transcripts,
  };
}
