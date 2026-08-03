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
  f_interessado: `### ETAPA: f_interessado (CAPTAÇÃO DE INTERESSE)
**OBJETIVO:** Detectar e qualificar leads que demonstram interesse real no preview gratuito.

**QUANDO APLICAR:**
- Lead pergunta: "Como funciona?", "Quanto custa?", "Quero testar", "Me mostra"
- Lead responde positivamente a: "Posso te mostrar um preview do bot no seu WhatsApp?"
- Lead clica em CTA de agendamento/preview

**COMO CONDUZIR:**
1. **Valide o interesse:** "Perfeito! O preview é 100% gratuito e roda no seu WhatsApp agora."
2. **Colete o WhatsApp:** "Qual seu WhatsApp com DDD? (ex: 11999999999)"
3. **Agende/Entregue:** Se tiver Cal.com integrado → gere link. Se não → diga que a equipe entrará em contato em minutos.
4. **Aplique a tag:** \`update_funnel_stage(stage: 'f_interessado')\`

**PRÓXIMO PASSO:** Lead testou o preview → \`f_fechamento\`. Lead travou/dúvida → \`f_quebra_objecao\`.`,

  f_fechamento: `### ETAPA: f_fechamento (CONVERSÃO)
**OBJETIVO:** Fechar a venda após o lead experimentar o preview e gostar.

**QUANDO APLICAR:**
- Lead diz: "Gostei", "Quero contratar", "Como faço pra pagar?", "Manda o link"
- Lead pede proposta/orçamento após testar
- Lead confirma dados para checkout

**COMO CONDUZIR:**
1. **Confirme o plano:** Recapitule IA Core (R$147) + plugins escolhidos.
2. **Envie checkout personalizado:** Link Stripe/Asaas com nome, WhatsApp e plano pré-preenchidos.
3. **Crie urgência suave:** "Vaga de onboarding essa semana — link expira em 24h."
4. **Aplique a tag:** \`update_funnel_stage(stage: 'f_fechamento')\`

**SE TRAVAR:** Dúvida técnica → suporte. Objeção preço → \`f_quebra_objecao\`. Quer falar com humano → \`handoff_to_human\` + \`f_fechamento\`.`,

  f_quebra_objecao: `### ETAPA: f_quebra_objecao (RECUPERAÇÃO)
**OBJETIVO:** Reverter "não" ou dúvidas que travam o fechamento.

**QUANDO APLICAR:**
- Lead diz: "Caro demais", "Não tenho tempo", "Vou pensar", "Não preciso agora"
- Lead para de responder após preview
- Lead faz pergunta técnica complexa que a IA não resolve

**COMO CONDUZIR (ESCOLHA A ESTRATÉGIA):**
| Objeção | Resposta-chave | Ação |
|---------|----------------|------|
| Preço | "O ROI é X pacientes/mês. 1 paciente já paga o plano." | Mostrar calculadora de ROI |
| Tempo | "Onboarding é 15 min. A IA economiza 10h/semana." | Agendar call rápida 10 min |
| Confiança | "Teste grátis 7 dias. Cancela quando quiser." | Estender trial |
| Técnica | "Especialista resolve agora." | \`handoff_to_human\` |

**SE RECUPERAR:** Lead aceita → \`f_fechamento\`.
**SE PERDER:** Marcar como perdida no CRM, nutrir com conteúdo (não tag de funil).`
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
