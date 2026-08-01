import { Redis } from '@upstash/redis'
import { getSubscriber, addTagByName, removeTagByName } from '@/lib/manychat'

const redis = Redis.fromEnv()

export type FunnelStage = 'f_novo_contato' | 'f_interessado' | 'f_reuniao_agendada' | 'f_fechamento' | 'f_cliente' | 'f_nutricao'

export const FUNNEL_STAGES: FunnelStage[] = [
  'f_novo_contato',
  'f_interessado',
  'f_reuniao_agendada',
  'f_fechamento',
  'f_cliente',
  'f_nutricao',
]

export const STAGE_SCRIPTS: Record<FunnelStage, string> = {
  f_novo_contato: `Etapa: NOVO CONTATO. O lead acaba de chegar. Apresente nossa automação de WhatsApp com IA para psicólogos, mostre os recursos e convide-o a agendar um teste gratuito (uma reunião curta para ver funcionando). Não pergunte se ele é psicólogo.`,
  f_interessado: `Etapa: INTERESSADO. O lead demonstrou interesse e conhece os recursos. Destaque o valor do atendimento imediato 24h (aumenta conversão de clientes) e reforce o convite ao agendamento de teste gratuito.`,
  f_reuniao_agendada: `Etapa: REUNIÃO AGENDADA. O lead já agendou a reunião de teste. NÃO ofereça agendar novamente. Apenas confirme o dia/hora e que o link chegará por e-mail. Reforce a expectativa do que será mostrado na demo.`,
  f_fechamento: `Etapa: FECHAMENTO. O lead quer fechar/contratar. Avise que você vai passar o contato para um humano (Felipe) e use a função handoff_to_human para avisar a equipe. Não negocie valores nem prometa descontos.`,
  f_cliente: `Etapa: CLIENTE. O lead já é cliente. Atenda dúvidas de uso, suporte e manutenção com foco em satisfação.`,
  f_nutricao: `Etapa: NUTRIÇÃO. O lead não agendou ainda, mas segue no funil. Reforce os benefícios, responda dúvidas e, no máximo uma vez, volte a convidar para o agendamento de teste.`,
}

// Lê a etapa atual do funil do lead.
// Fonte da verdade: tags do ManyChat. Fallback/cache: Redis `funnel:{userId}`.
export async function getLeadStage(userId: string | number): Promise<FunnelStage> {
  console.log('[FUNNEL] getLeadStage:', userId)
  const key = `funnel:${userId}`

  // 1) Redis primeiro (rápido e evita chamada ao ManyChat em toda mensagem)
  try {
    const cached = await redis.get<string>(key)
    if (cached && FUNNEL_STAGES.includes(cached as FunnelStage)) {
      console.log('[FUNNEL] Stage do Redis:', cached)
      return cached as FunnelStage
    }
  } catch (err) {
    console.error('[FUNNEL] Erro ao ler Redis:', err)
  }

  // 2) ManyChat: tags do subscriber
  try {
    const info = await getSubscriber(userId)
    const tags: Array<{ name: string }> = info?.data?.tags || []
    for (const tag of tags) {
      if (FUNNEL_STAGES.includes(tag.name as FunnelStage)) {
        await redis.set(key, tag.name)
        console.log('[FUNNEL] Stage do ManyChat:', tag.name)
        return tag.name as FunnelStage
      }
    }
  } catch (err) {
    console.error('[FUNNEL] Erro ao ler tags do ManyChat:', err)
  }

  return 'f_novo_contato'
}

// Move o lead para uma nova etapa: remove a tag da etapa anterior e aplica a nova.
export async function setLeadStage(userId: string | number, newStage: FunnelStage) {
  console.log('[FUNNEL] setLeadStage:', userId, newStage)
  const key = `funnel:${userId}`

  // Remove todas as outras tags do funil e aplica a nova
  const current = await getLeadStage(userId)
  const others = FUNNEL_STAGES.filter(s => s !== newStage)
  for (const stage of others) {
    if (stage === current) {
      try {
        await removeTagByName(userId, stage)
      } catch (err) {
        console.error('[FUNNEL] Erro ao remover tag:', stage, err)
      }
    }
  }
  try {
    await addTagByName(userId, newStage)
  } catch (err) {
    console.error('[FUNNEL] Erro ao adicionar tag:', newStage, err)
  }
  await redis.set(key, newStage)
  console.log('[FUNNEL] Stage atualizado para:', newStage)
  return newStage
}

export function getStageScript(stage: FunnelStage): string {
  return STAGE_SCRIPTS[stage] || STAGE_SCRIPTS.f_novo_contato
}
