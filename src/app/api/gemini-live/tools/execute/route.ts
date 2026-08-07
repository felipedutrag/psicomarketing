import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { sendMessage } from '@/lib/manychat'
import { executeTool } from '@/lib/process-ai/tool-executors'
import { setLeadStage } from '@/lib/funnel'
import { upsertAnalytics, getConvertingMessage } from '@/lib/analytics'

interface ToolRequestBody {
  name: string
  args?: Record<string, unknown>
}

interface AgendarConsultaArgs {
  nome?: string
  dia?: string
  horario?: string
  tipoConsulta?: string
  contextId?: string
}

interface ExplicarPluginArgs {
  plugin?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as ToolRequestBody
    const { name, args } = body

    if (name === 'agendarConsulta') {
      const { nome, dia, horario, tipoConsulta } = (args || {}) as AgendarConsultaArgs

      // Tentar obter id dos parâmetros de contexto da URL
      const contextId = args?.contextId as string | undefined

      // Criar o objeto de agendamento
      const agendamento = {
        id: `b-${Date.now()}`,
        nome: nome || 'Paciente',
        dia: dia || 'Quinta-feira',
        horario: horario || '15:00',
        tipoConsulta: tipoConsulta || 'Sessão de Acolhimento',
        status: 'Confirmado via IA Live',
      }

      // Enviar confirmação via WhatsApp e tracking (tag + analytics) em background
      // com `after()`, que mantém o trabalho rodando DEPOIS da resposta — sem bloquear
      // a IA de voz. O `after` garante que as promises não são mortas quando o handler retorna.
      const hasContextId = Boolean(contextId)
      if (contextId) {
        const message = [
          `✨ *AGENDAMENTO REALIZADO COM SUCESSO!* (Demonstração)`,
          ``,
          `Olá, *${nome || 'Doutor(a)'}*! Veja como seu cliente recebe a confirmação enviada pela *Gaby*:`,
          ``,
          `📋 *Resumo da Sessão:*`,
          `• *Serviço:* ${tipoConsulta || 'Sessão de Acolhimento'}`,
          `• *Data:* ${dia || 'Quinta-feira'}`,
          `• *Horário:* ${horario || '15:00'}`,
          ``,
          `💻 *Link da consulta (Google Meet):*`,
          `https://meet.google.com/mme-pfzs-fer`,
          ``,
          `----------------------------------------`,
          ``,
          `🚀 *QUER ESSA MESMA EFICIÊNCIA NO SEU CONSULTÓRIO?*`,
        ].join('\n')

        after(async () => {
          // 1. Confirmação WhatsApp
          try {
            await sendMessage(contextId, message)
          } catch (err) {
            console.error('[agendarConsulta] Erro ao enviar confirmação WhatsApp:', err)
          }
          // 2. Analytics (fire-and-forget dentro do after)
          try {
            const convertingMessage = await getConvertingMessage(contextId)
            await upsertAnalytics({
              mcUserId: contextId,
              nome: nome || null,
              event: 'agendamento',
              convertingMessage,
            })
          } catch (analyticsErr) {
            console.error('[agendarConsulta] Erro ao registrar analytics de agendamento:', analyticsErr)
          }
          // 3. Tag f_fechamento
          try {
            await setLeadStage(contextId, 'f_fechamento')
          } catch (tagErr) {
            console.error('[agendarConsulta] Erro ao marcar tag f_fechamento:', tagErr)
          }
        })
      }

      return NextResponse.json({
        status: 'success',
        message: `Consulta de ${nome || 'Paciente'} agendada com sucesso para ${dia || 'esta semana'} às ${horario || '15:00'}.`,
        agendamento,
        manychat: { enviado: hasContextId }
      })
    }

    if (name === 'explicarPlugin') {
      const { plugin } = (args || {}) as ExplicarPluginArgs
      return NextResponse.json({
        status: 'success',
        message: `O plugin ${plugin || 'selecionado'} automatiza a captação e atendimento de pacientes com máxima conformidade ética.`,
      })
    }

    if (name === 'voice_booking_completed') {
      const contextId = args?.contextId as string | undefined
      console.log('[Gemini Live] voice_booking_completed chamada com contextId:', contextId)

      if (!contextId) {
        return NextResponse.json({
          status: 'success',
          message: 'Agendamento por voz registrado (sem ID disponível para tag)'
        })
      }

      const { response } = await executeTool(name, args || {}, contextId)
      if (!response.success) {
        return NextResponse.json({
          status: 'error',
          error: response.error
        }, { status: 500 })
      }

      return NextResponse.json({ status: 'success', ...response })
    }

    return NextResponse.json({
      status: 'success',
      message: `Ferramenta ${name} executada com sucesso.`,
      args,
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Erro na execução da ferramenta',
      },
      { status: 500 }
    )
  }
}
