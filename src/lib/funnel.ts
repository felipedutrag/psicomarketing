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
  f_interessado: `Adicione a [TAG: f_interessado] assim que o cliente demonstrar interesse em obter o link do site ou concordar em receber uma demonstração/preview gratuito do site (ex: "quero ver", "pode mandar", "como fica?", "manda o link", "tenho interesse", "sim, manda"). Use a ferramenta send_message_with_buttons para enviar o botão interativo quando solicitado.`,

  f_fechamento: `Adicione a [TAG: f_fechamento] quando o cliente fizer o agendamento por voz na landing page, aprovar o preview enviado, fizer perguntas sobre contratação, formas de pagamento, valores ou demonstrar intenção clara de fechar o serviço (ex: "gostei", "como faço pra ter esse site?", "quanto custa pra ficar comigo?", "qual o PIX?", agendamento concluído na IA de voz).`,

  f_quebra_objecao: `Adicione a [TAG: f_quebra_objecao] se o cliente recusar a oferta, apresentar dúvidas/objeções, dizer que não precisa, achar caro ou demonstrar desinteresse no momento após a oferta pós agendamento (ex: "não tenho interesse", "já tenho site", "agora não", "achei caro", "vou pensar sobre", "deixa pra depois").`
};

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

// Move o lead para uma nova etapa: remove todas as outras tags do funil e aplica a nova.
// Remove em paralelo (Promise.all) sem consultar a etapa anterior — as funções do ManyChat
// ignoram remoção de tags que o usuário não possui, evitando tag fantasma e chamadas extras.
export async function setLeadStage(userId: string | number, newStage: FunnelStage) {
  console.log('[FUNNEL] setLeadStage:', userId, newStage)
  const key = `funnel:${userId}`

  // Só remove a tag anterior se for diferente da nova (evita chamadas desnecessárias ao ManyChat)
  try {
    const previousStage = await redis.get<string>(key)
    if (previousStage && previousStage !== newStage && FUNNEL_STAGES.includes(previousStage as FunnelStage)) {
      await removeTagByName(userId, previousStage)
    }
  } catch (err) {
    console.error('[FUNNEL] Erro ao remover tag anterior:', err)
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
