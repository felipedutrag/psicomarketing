'use client'

import { useLilithVoice, type VoiceOptions } from '@/hooks/use-lilith-voice'

const DASHBOARD_VOICE_OPTIONS: VoiceOptions = {
  configUrl: '/api/dashboard/voice/config',
  executeUrl: '/api/dashboard/voice/tools/execute',
  sessionKey: 'dashboard_voice_session',
  historyUrl: '/api/dashboard/voice/history',
}

export function useDashboardVoice() {
  return useLilithVoice(undefined, DASHBOARD_VOICE_OPTIONS)
}
