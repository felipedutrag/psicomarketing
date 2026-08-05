import { NextRequest, NextResponse } from 'next/server'
import { sendMessage } from '@/lib/manychat'

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

interface VoiceBookingCompletedArgs {
  contextId?: string
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

      // Enviar confirmação via WhatsApp com oferta se o id estiver disponível
      let manychatResult = null
      if (contextId) {
        try {
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
            `----------------------------------------`,
            ``,
            `🚀 *QUER ESSA MESMA EFICIÊNCIA NO SEU CONSULTÓRIO?*`,
            ``,
            `Garanta a *Gaby* atendendo seus pacientes 24/7 por apenas *R$ 147/mês* (sem fidelidade).`,
            ``,
            `🔥 *BÔNUS EXCLUSIVO (Próximos 5 minutos):*`,
            `🎁 *Ganha 01 Landing Page de Alta Conversão* pronta para captar pacientes no Google/Instagram.`,
            `🛡️ *7 dias de garantia incondicional* (risco zero).`,
            ``,
            `💳 *Clique no link para ativar seu sistema agora:*`,
            `https://invoice.infinitepay.io/plans/psicomarketing/g4Ssfk658T`,
            ``,
            `Dúvidas? É só responder essa mensagem! 😉`,
          ].join('\n')
          manychatResult = await sendMessage(contextId, message)
        } catch (err) {
          console.error('[agendarConsulta] Erro ao enviar confirmação WhatsApp:', err)
        }
      }

      return NextResponse.json({
        status: 'success',
        message: `Consulta de ${nome || 'Paciente'} agendada com sucesso para ${dia || 'esta semana'} às ${horario || '15:00'}.`,
        agendamento,
        manychat: manychatResult ? { enviado: true } : { enviado: false, motivo: 'ID não disponível' }
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
      const { contextId } = (args || {}) as VoiceBookingCompletedArgs
      console.log('[Gemini Live] voice_booking_completed chamada com contextId:', contextId)

      if (contextId) {
        try {
          // Adicionar tag de fechamento no ManyChat
          const { setLeadStage } = await import('@/lib/funnel')
          await setLeadStage(contextId, 'f_fechamento')
          return NextResponse.json({
            status: 'success',
            message: 'Tag de fechamento adicionada após agendamento por voz',
          })
        } catch (err) {
          console.error('[Gemini Live] Erro ao adicionar tag f_fechamento:', err)
          return NextResponse.json({
            status: 'error',
            error: err instanceof Error ? err.message : 'Erro ao adicionar tag de fechamento'
          }, { status: 500 })
        }
      }

      return NextResponse.json({
        status: 'success',
        message: 'Agendamento por voz registrado (sem ID disponível para tag)'
      })
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
