import { Redis } from '@upstash/redis'
import { getNextAvailableSlots, createBooking, cancelBooking, formatSlot } from '@/lib/calcom'
import { getLeadStage, setLeadStage, getStageScript, type FunnelStage } from '@/lib/funnel'
import { sendMessageWithButtons } from '@/lib/manychat-buttons'
import { TOOL_NAMES } from './tools'

const redis = Redis.fromEnv()

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  userId: string,
  context?: { firstName?: string; webhookUserId?: string; webhookFirstName?: string }
): Promise<{ response: Record<string, unknown> }> {
  if (name === TOOL_NAMES.getLeadStage) {
    console.log('[PROCESS-AI] Function get_lead_stage chamada')
    const stage = await getLeadStage(userId)
    return { response: { stage, stageScript: getStageScript(stage) } }
  }

  if (name === TOOL_NAMES.updateFunnelStage) {
    const { stage } = args as { stage?: string }
    console.log('[PROCESS-AI] Function update_funnel_stage chamada:', stage)
    if (!stage) {
      return { response: { success: false, error: 'Etapa não informada' } }
    }
    const newStage = await setLeadStage(userId, stage as FunnelStage)
    return { response: { success: true, stage: newStage } }
  }

  if (name === TOOL_NAMES.voiceBookingCompleted) {
    console.log('[PROCESS-AI] Function voice_booking_completed chamada')
    // Adicionar tag de fechamento quando usuário fizer agendamento por voz
    try {
      await setLeadStage(userId, 'f_fechamento')
      return { response: { success: true, message: 'Tag de fechamento adicionada após agendamento por voz' } }
    } catch (err) {
      console.error('[PROCESS-AI] voice_booking_completed falhou:', err)
      return { response: { success: false, error: err instanceof Error ? err.message : 'Erro ao adicionar tag de fechamento' } }
    }
  }

  if (name === TOOL_NAMES.saveLeadData) {
    console.log('[PROCESS-AI] Function save_lead_data chamada:', JSON.stringify(args))
    const { email, perfil, volume_atendimentos, principal_dor } = args as {
      email?: string; perfil?: string; volume_atendimentos?: string; principal_dor?: string
    }
    await redis.set(`lead:${userId}`, JSON.stringify({ email, perfil, volume_atendimentos, principal_dor }))
    return { response: { success: true } }
  }

  if (name === TOOL_NAMES.getAvailability) {
    console.log('[PROCESS-AI] Function get_availability chamada')
    const slots = await getNextAvailableSlots()
    const formatted = slots.map(s => ({ start: s, label: formatSlot(s) }))
    console.log('[PROCESS-AI] Horários disponíveis:', JSON.stringify(formatted))
    return { response: { slots: formatted } }
  }

  if (name === TOOL_NAMES.bookAppointment) {
    const { start, attendeeName, attendeeEmail } = args as { start?: string; attendeeName?: string; attendeeEmail?: string }
    console.log('[PROCESS-AI] Function book_appointment chamada:', JSON.stringify(args))
    try {
      if (!start || !attendeeName || !attendeeEmail) {
        throw new Error('Parâmetros incompletos para agendamento')
      }
      const booking = await createBooking(start, attendeeName, attendeeEmail)
      // Persiste o agendamento no Redis para o modelo saber que a reunião já foi confirmada
      await redis.set(`booking:${userId}`, JSON.stringify({
        uid: booking.uid,
        start: booking.start,
        meetingUrl: booking.meetingUrl,
        attendeeName,
        attendeeEmail
      }))

      // Resgata o lead do Redis para capturar o telefone, se disponível
      let phone = ''
      const leadRaw = await redis.get<unknown>(`lead:${userId}`)
      if (leadRaw) {
        try {
          const leadObj = typeof leadRaw === 'string' ? JSON.parse(leadRaw) : leadRaw as { phone?: string; telefone?: string }
          phone = leadObj.phone || leadObj.telefone || ''
        } catch { }
      }

      const checkoutParams = new URLSearchParams({
        mc_subscriber_id: userId,
        name: attendeeName || '',
        email: attendeeEmail || '',
        ...(phone ? { phone } : {}),
        date: start || ''
      })

      return {
        response: {
          success: true,
          start: booking.start,
          meetingUrl: booking.meetingUrl,
          checkout_url: `https://psicomarketing.online/checkout?${checkoutParams.toString()}`
        }
      }
    } catch (err) {
      console.error('[PROCESS-AI] book_appointment falhou:', err)
      return {
        response: { success: false, error: err instanceof Error ? err.message : 'Erro ao agendar' }
      }
    }
  }

  if (name === TOOL_NAMES.handoffToHuman) {
    console.log('[PROCESS-AI] Function handoff_to_human chamada')
    await setLeadStage(userId, 'f_fechamento')
    return { response: { success: true, message: 'Lead transferido para o humano (Felipe).' } }
  }

  if (name === TOOL_NAMES.cancelAppointment) {
    console.log('[PROCESS-AI] Function cancel_appointment chamada')
    const { reason } = args as { reason?: string }
    try {
      const bookingRaw = await redis.get<unknown>(`booking:${userId}`)
      if (!bookingRaw) {
        return { response: { success: false, error: 'Nenhum agendamento encontrado para cancelar.' } }
      }
      const booking = typeof bookingRaw === 'string' ? JSON.parse(bookingRaw) : bookingRaw as { uid?: string }
      if (!booking.uid) {
        return { response: { success: false, error: 'Agendamento sem UID, não é possível cancelar automaticamente.' } }
      }
      await cancelBooking(booking.uid, reason)
      await redis.del(`booking:${userId}`)
      console.log('[PROCESS-AI] Booking cancelado e removido do Redis')
      return { response: { success: true, message: 'Reunião cancelada com sucesso.' } }
    } catch (err) {
      console.error('[PROCESS-AI] cancel_appointment falhou:', err)
      return {
        response: { success: false, error: err instanceof Error ? err.message : 'Erro ao cancelar agendamento' }
      }
    }
  }

  if (name === TOOL_NAMES.sendMessageWithButtons) {
    console.log('[PROCESS-AI] Function send_message_with_buttons chamada:', JSON.stringify(args))
    const { text, buttons } = args as { text?: string; buttons?: Array<{ text: string; payload?: string; url?: string }> }
    if (!text) {
      return { response: { success: false, error: 'Texto da mensagem é obrigatório' } }
    }
    try {
      const firstName = context?.webhookFirstName || context?.firstName || 'Lead'
      const id = context?.webhookUserId || userId

      // Forçar sempre exatamente 1 botão de URL do site com os parâmetros do lead
      const firstBtn = (buttons && Array.isArray(buttons) && buttons.length > 0) ? buttons[0] : { text: 'Conhecer IA de Voz' }
      const rawUrl = firstBtn.url || `http://psicomarketing.online/?nome={firstname}&id={id}`
      const url = rawUrl
        .replace('{firstname}', encodeURIComponent(firstName))
        .replace('{first_name}', encodeURIComponent(firstName))
        .replace('{id}', encodeURIComponent(id))
        .replace('{user_id}', encodeURIComponent(id))

      const processedButtons = [{
        text: (firstBtn.text || 'Conhecer IA de Voz').substring(0, 20),
        url
      }]
      
      const result = await sendMessageWithButtons(userId, text, processedButtons)
      return { response: { success: true, result, message_sent: true } }
    } catch (err) {
      console.error('[PROCESS-AI] send_message_with_buttons falhou:', err)
      return {
        response: { success: false, error: err instanceof Error ? err.message : 'Erro ao enviar mensagem com botões' }
      }
    }
  }

  return { response: { success: false, error: `Tool desconhecida: ${name}` } }
}
