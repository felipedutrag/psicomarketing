import { Redis } from '@upstash/redis'
import { getSubscriber, addTagByName, removeTagByName } from '@/lib/manychat'

const redis = Redis.fromEnv()

export type FunnelStage = 'f_interessado' | 'f_fechamento' | 'f_quebra_objecao'

export const FUNNEL_STAGES: FunnelStage[] = [
  'f_interessado',
  'f_fechamento',
  'f_quebra_objecao'
]

export const FUNNEL_TAG_IDS: Record<FunnelStage, number> = {
  f_interessado: 93221479,
  f_fechamento: 93221481,
  f_quebra_objecao: 93221484, // ID da tag f_nutricao usada como quebra de objeção no ManyChat
}

export const STAGE_SCRIPTS: Record<FunnelStage, string> = {
  f_interessado: `adicione a [TAG: f_interessado] se o cliente manifestar o interesse em um preview gratuito.`,

  f_fechamento: `adicione a [TAG: f_fechamento] se o usuaio gostar do preview e quise fazer o fechamento.`,

  f_quebra_objecao: `adicione a tag [TAG: f_quebra_objecao] se o usuario dizer que não tem interesse no serviço`
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

  return 'f_interessado'
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
  return STAGE_SCRIPTS[stage] || STAGE_SCRIPTS.f_interessado
}
