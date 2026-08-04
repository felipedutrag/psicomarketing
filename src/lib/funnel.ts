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
  f_interessado: `### ETAPA: f_interessado (PREVIEW GRATUITO DO SITE)
**OBJETIVO:** Entregar um preview gratuito do site da psicóloga com IA generativa — ela vê o resultado na hora, sem compromisso.

**A OFERTA:**
- "Criamos uma versão do seu site com IA (textos, imagens, estrutura) — grátis, sem cadastro de cartão."
- "Você acessa o link, navega, pede ajustes por chat/voz. Se gostar, fecha. Se não gostar, **não paga nada**."

**QUANDO APLICAR:**
- Lead pergunta: "Como funciona?", "Quero ver", "Me mostra um exemplo"
- Lead responde positivamente a: "Posso gerar um preview do seu site agora?"
- Lead clica em CTA de "Ver preview grátis"

**COMO CONDUZIR:**
1. **Valide o interesse:** "Perfeito! O preview é gratuito, roda no navegador e você pede ajustes por texto ou voz."
2. **Colete o essencial:** "Qual seu WhatsApp com DDD? (ex: 11999999999)" + "Nome da clínica/psicóloga?"
3. **Gere o preview:** Chame a ferramenta de geração de site (IA) → entregue link público temporário.
4. **Aplique a tag:** \`update_funnel_stage(stage: 'f_interessado')\`

**PRÓXIMO PASSO:** Lead aprovou o preview → \`f_fechamento\`. Lead não gostou/travou → \`f_quebra_objecao\`.`,

  f_fechamento: `### ETAPA: f_fechamento (CONTRATAÇÃO APÓS APROVAÇÃO DO PREVIEW)
**OBJETIVO:** Fechar o plano IA Core + plugins após o lead **aprovar o preview do site**.

**QUANDO APLICAR:**
- Lead diz: "Gostei do site", "Quero esse site", "Como contrata?", "Manda o link de pagamento"
- Lead confirma: "Pode fazer o checkout", "Fecha pra mim"
- Lead pede proposta após ver o preview funcionando

**COMO CONDUZIR:**
1. **Recapitule o que ela aprovou:** "Site com IA + IA Core WhatsApp (R$147/mês) + plugins escolhidos."
2. **Envie checkout personalizado:** Link Stripe/Asaas com nome, WhatsApp, plano e plugins pré-preenchidos.
3. **Reforce o risco zero:** "Onboarding incluso. Cancela quando quiser. Sem fidelidade."
4. **Aplique a tag:** \`update_funnel_stage(stage: 'f_fechamento')\`

**SE TRAVAR:** Dúvida técnica → suporte. Objeção preço → \`f_quebra_objecao\`. Quer falar com humano → \`handoff_to_human\` + \`f_fechamento\`.`,

  f_quebra_objecao: `### ETAPA: f_quebra_objecao (RECUPERAÇÃO PÓS-PREVIEW)
**OBJETIVO:** Reverter hesitação **depois que o lead viu o preview** e não fechou na hora.

**QUANDO APLICAR:**
- Lead viu o preview mas diz: "Caro", "Vou pensar", "Não tenho tempo agora", "Preciso conversar com sócio"
- Lead para de responder após receber o link do preview
- Lead pede alterações infinitas no preview sem avançar

**COMO CONDUZIR (ESCOLHA A ESTRATÉGIA):**
| Objeção Real | Resposta-chave | Ação Imediata |
|--------------|----------------|---------------|
| **Preço** | "O site sozinho já traz 1-2 pacientes/mês. 1 paciente paga o plano todo." | Mostrar calculadora ROI + oferecer plano só IA Core (R$147) sem plugins |
| **Tempo/Decisão** | "Entendo. O preview fica no ar 7 dias. Quer que eu agende 10 min pra tirar dúvidas?" | Agendar call curta (Cal.com) + estender preview por +7 dias |
| **Sócio/Aprovação** | "Manda o link do preview pro seu sócio. Eu espero." | Compartilhar preview + follow-up em 48h |
| **Não gostou do design** | "A IA refaz em segundos. O que exatamente não curtiu? Cores? Textos? Estrutura?" | Pedir ajuste específico → regenerar preview na hora |
| **Técnica/Dúvida complexa** | "Chamo especialista pra resolver agora." | \`handoff_to_human\` |

**SE RECUPERAR:** Lead aceita → \`f_fechamento\`.
**SE PERDER DEFINITIVAMENTE:** Não insista. Marcar "preview não convertido" no CRM. Nutrir com cases/conteúdo (sem tag de funil).`
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
