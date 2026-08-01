const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const localDataPath = path.join(__dirname, '../data/psicologos_leads.json');
const rootDataPath = path.join(__dirname, '../../data/psicologos_leads.json');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

if (!GROQ_API_KEY) {
    console.error('ERRO: GROQ_API_KEY não encontrada no arquivo .env ou .env.local');
    process.exit(1);
}

// Função para chamar a API da Groq com retry para tratar rate limit (429) e fallback
async function generatePersonalizedMessage(lead, index = 0, retryCount = 0) {
    const rawName = lead.rawName || lead.nome || 'Colega';
    const cleanName = lead.nome || 'Colega';
    const websiteInfo = lead.website && lead.website !== 'N/A' ? `Site informado: ${lead.website}` : 'Sem site cadastrado';

    // Lista de variações de abertura para garantir variação natural sem repetir padrões idênticos
    const openingStyles = [
        "Foque em uma abordagem elegante sobre a presença no Google Maps e o tempo de resposta em sessão.",
        "Foque na questão de acolhimento imediato e na autoridade clínica versus silêncio no WhatsApp.",
        "Foque no contraste entre investir em divulgação e perder o contato por atraso no retorno."
    ];
    const selectedStyle = openingStyles[index % openingStyles.length];

    const systemPrompt = `Você é uma inteligência geradora de abordagens B2B hiper-personalizadas de alta conversão para psicólogos.

REGRAS CRÍTICAS DE TRATAMENTO DE NOME / DADOS:
1. NOME COMPLETO/CADASTRO: "${rawName}" (Nome Limpo extraído: "${cleanName}")
2. SE FOR NOME DE PESSOA (ex: 'Maria', 'Juliana', 'Eliana Alves'): Cumprimente pelo primeiro nome de forma natural (ex: 'Olá, Maria', 'Olá, Juliana').
3. SE FOR NOME DE CLÍNICA/INSTITUTO/EMPRESA/LOCAL (ex: 'ACM Psicologia', 'Psicólogos Berrini', 'Espaço Mente'): NUNCA trate o nome da clínica ou bairro como se fosse o primeiro nome de um médico (NÃO diga "Olá, Berrini" nem "Olá, ACM"). Em vez disso, use "Olá, Dr(a)." ou "Olá, equipe da [Nome da Clínica]".

DIRETRIZES ANTI-ALUCINAÇÃO (RIGOROSAMENTE OBRIGATÓRIAS):
1. NUNCA invente especialidades (NÃO diga "vi que você atende TCC/Casal/Infantil" a menos que esteja escrito explicitamente nos dados).
2. NUNCA invente falsas indicações, reuniões anteriores ou dados falsos.

PROPOSTA DE VALOR OBRIGATÓRIA DA PRIMEIRA MENSAGEM (NOVO CONCEITO SECRETÁRIA IA 24H):
Entregue a proposta COMPLETA na primeira mensagem com foco em praticidade e controle total pelo WhatsApp:
1. **Gancho de Liberdade & Mobilidade:**
   "Já pensou estar na rua, precisar cancelar ou remarca uma sessão, enviar um simples áudio e nossa IA reorganizar toda a sua agenda de acordo com o que você sugerir?"
2. **Apresentação da Secretária Virtual Especializada:**
   - Automação desenhada exclusivamente para consultórios de psicologia.
   - A secretária mais eficiente do mundo 24h por dia: cobra pagamentos/PIX, consulta sua agenda e acolhe novos pacientes.
   - Dá conselhos e insights práticos sobre gestão de leads e marketing digital para o seu nicho clínico.
3. **Chamada para Ação (CTA):** Convide o psicólogo a responder com a palavra 'teste' para simular e ver a IA funcionando ao vivo em 15 segundos.

DIRETRIZES DE ESTILO E ANTI-BAN:
1. Mensagem curta, direta e incisiva (máximo de 3 parágrafos curtos, ideal para ler no WhatsApp).
2. Linguagem elegante, profissional e fluida, de humano para humano.
3. SEM emojis em excesso (no máximo 1 ou 2 sutis). NUNCA use 🚀🔥💰.
4. ESTILO DESTA MENSAGEM: ${selectedStyle}`;

    const userPrompt = `Gere a mensagem de WhatsApp perfeita para o lead "${rawName}".
${websiteInfo}
Retorne EXCLUSIVAMENTE o texto final da mensagem em português, sem aspas, sem títulos e sem explicações prévias.`;

    const modelToUse = retryCount > 1 ? 'llama-3.3-70b-versatile' : GROQ_MODEL;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: modelToUse,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.6,
                top_p: 0.9,
                max_tokens: 400
            })
        });

        if (response.status === 429 && retryCount < 3) {
            console.warn(`[RATE LIMIT 429] Aguardando 3s antes de tentar novamente (${retryCount + 1}/3)...`);
            await new Promise(r => setTimeout(r, 3000));
            return generatePersonalizedMessage(lead, index, retryCount + 1);
        }

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Groq API Error ${response.status}: ${errText}`);
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content?.trim();

        if (content) {
            if (!content.toLowerCase().includes('teste')) {
                content += "\n\nResponda *teste* aqui para ver na prática.";
            }
            return content;
        }

        return lead.mensagem_inicial;
    } catch (e) {
        console.error(`Erro ao gerar via Groq para ${lead.nome}:`, e.message);
        return lead.mensagem_inicial;
    }
}

async function processLeads() {
    const dataPath = fs.existsSync(localDataPath) ? localDataPath : (fs.existsSync(rootDataPath) ? rootDataPath : null);
    if (!dataPath) {
        console.error('Arquivo de leads não encontrado.');
        return;
    }

    const rawData = fs.readFileSync(dataPath, 'utf8');
    const leads = JSON.parse(rawData);

    console.log(`--- INICIANDO PERSONALIZAÇÃO DE APRESENTAÇÃO VIA GROQ (${leads.length} LEADS) ---`);

    let updatedCount = 0;

    for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];
        
        // Se já possui mensagem personalizada gerada via Groq, pode pular ou refazer
        if (!lead.mensagem_personalizada || process.argv.includes('--force')) {
            console.log(`[${i + 1}/${leads.length}] Gerando apresentação para: ${lead.nome}...`);
            const personalizedMessage = await generatePersonalizedMessage(lead, i);
            
            lead.mensagem_personalizada = personalizedMessage;
            lead.wa_link = `https://wa.me/${lead.whatsapp}?text=${encodeURIComponent(personalizedMessage)}`;
            updatedCount++;

            // Salva a cada lead processado
            const jsonOutput = JSON.stringify(leads, null, 2);
            [localDataPath, rootDataPath].forEach(p => {
                if (fs.existsSync(path.dirname(p))) {
                    fs.writeFileSync(p, jsonOutput, 'utf8');
                }
            });

            // Pequena pausa para respeitar rate-limit da Groq
            await new Promise(r => setTimeout(r, 2000));
        } else {
            console.log(`[${i + 1}/${leads.length}] Já personalizado: ${lead.nome}`);
        }
    }

    console.log(`\n--- CONCLUÍDO: ${updatedCount} mensagens personalizadas criadas via Groq ---`);
}

if (require.main === module) {
    processLeads().catch(err => {
        console.error('Erro no script Groq Personalizer:', err);
    });
}

module.exports = { processLeads, generatePersonalizedMessage };
