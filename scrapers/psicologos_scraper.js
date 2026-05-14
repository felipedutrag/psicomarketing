const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function scrapeAndClean() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    const page = await browser.newPage();

    console.log('--- INICIANDO SCRAPER DE TESTE (5 LEADS RAW + WA LINK) ---');
    const url = 'https://www.google.com/maps/search/psicologos+cidade+rio+de+janeiro';
    await page.goto(url, { waitUntil: 'networkidle2' });

    const sidePanelSelector = 'div[role="feed"]';
    await page.waitForSelector(sidePanelSelector);

    const rawLeads = [];
    const limit = 5;

    // Mensagem genérica de fallback
    const mensagemPadrao = `Olá! Sou da Psicomarketing.
Notei sua presença clínica e gostaria de mostrar como nossa IA pode assumir seu WhatsApp enquanto você atende.
Conheça: https://www.psicomarketing.online/
Responda para testar!`;

    for (let i = 0; i < limit; i++) {
        try {
            const listItems = await page.$$('.hfpxzc');
            if (i >= listItems.length) break;

            await listItems[i].click();
            await new Promise(r => setTimeout(r, 2500));

            const details = await page.evaluate((msg) => {
                const name = document.querySelector('h1.DUwDvf')?.innerText || 'Desconhecido';
                const phoneBtn = document.querySelector('button[data-tooltip="Copiar número de telefone"]');
                const phone = phoneBtn ? phoneBtn.getAttribute('aria-label') : 'Não encontrado';
                const websiteBtn = document.querySelector('a[data-tooltip="Abrir website"]');
                const website = websiteBtn ? websiteBtn.getAttribute('href') : 'N/A';

                let cleanPhone = (phone || '').replace(/\D/g, '');
                if (cleanPhone && cleanPhone.length <= 11) cleanPhone = '55' + cleanPhone;

                const waLink = cleanPhone.length >= 10
                    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
                    : 'N/A';

                return {
                    nome: name,
                    whatsapp: cleanPhone,
                    website: website,
                    wa_link: waLink
                };
            }, mensagemPadrao);

            console.log(`[${i + 1}/${limit}] Extraído: ${details.nome}`);
            rawLeads.push(details);
        } catch (e) {
            console.error(`Erro no item ${i}:`, e.message);
        }
    }

    await browser.close();

    console.log('\n--- PERSONALIZANDO MENSAGENS COM GEMINI ---');
    if (!process.env.GEMINI_API_KEY) {
        console.error('ERRO: GEMINI_API_KEY não encontrada no .env');
    } else {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
            generationConfig: {
                temperature: 1.0,
                topP: 0.95,
            }
        });

        for (let lead of rawLeads) {
            try {
                // Limpeza básica do nome para extrair primeiro nome ou identificar clínica
                let nomeParaIA = lead.nome.replace(/\b(Psic[^\s]*|Neuro[^\s]*|Psican[^\s]*|Dra?\.?)\b/gi, '').trim();
                const isClinica = /Clínica|Centro|Instituto/i.test(nomeParaIA);

                // Se for pessoa, pega apenas o primeiro nome
                if (!isClinica) {
                    nomeParaIA = nomeParaIA.split(' ')[0];
                }

                const prompt = `Você é um especialista em copy profissional e elegante para psicólogos. Use como base este estilo de mensagem, mas varie COMPLETAMENTE o vocabulário e a estrutura das frases em cada geração para evitar detecção de spam.
                Analise o nome do lead e faça uma limpeza da cidade ou informações que não são relevantes para a mensagem. Pegue apenas o primeiro nome ou o nome da clinica, se pertinente. Não fale que você acompanhou a trajetória, apenas que identificou a pesença online.

IMPORTANTE: O nome do lead é "${nomeParaIA}". Você DEVE usar este nome na saudação. NUNCA escreva a palavra "[Nome]" ou "[Clínica]", use the nome real que eu te passei.

ESTILO BASE PARA INSPIRAÇÃO (NÃO COPIE IGUAL):
"Olá ${nomeParaIA}! Sou da Psicomarketing. Notei sua presença online e gostaria de mostrar como nossa inteligência assume seu acolhimento e agendamento no WhatsApp enquanto você atende. Garantimos resposta imediata para todo paciente, preservando sua autoridade. Conheça: https://www.psicomarketing.online/ Responda agora para testar!"

REGRAS DE VARIAÇÃO (OBRIGATÓRIO):
1. Use sinônimos para termos chave (equipe, sistema, perfil profissional, gerenciar contato, etc.).
2. Comece sempre com a saudação personalizada usando o nome "${nomeParaIA}".
3. O link deve estar em uma linha PRÓPRIA e ISOLADA: https://www.psicomarketing.online/
4. O CTA deve ser a ÚLTIMA LINHA: Uma ordem direta para responder e testar a IA, terminando com "!".

Responda APENAS com a mensagem personalizada, sem aspas e sem explicações.`;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const personalizedMsg = response.text().trim();

                lead.mensagem_personalizada = personalizedMsg;
                if (lead.whatsapp && lead.whatsapp !== 'Não encontrado') {
                    lead.wa_link = `https://wa.me/${lead.whatsapp}?text=${encodeURIComponent(personalizedMsg)}`;
                }
                console.log(`✅ Mensagem personalizada gerada para: ${lead.nome} (${nomeParaIA})`);
            } catch (error) {
                console.error(`❌ Erro ao personalizar para ${lead.nome}:`, error.message);
                lead.mensagem_personalizada = mensagemPadrao;
            }
        }
    }

    const localPath = path.join(__dirname, '../data/psicologos_leads.json');
    const rootPath = path.join(__dirname, '../../data/psicologos_leads.json');

    [localPath, rootPath].forEach(dest => {
        if (!fs.existsSync(path.dirname(dest))) fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, JSON.stringify(rawLeads, null, 2), 'utf8');
    });

    console.log(`\n--- PROCESSO FINALIZADO ---`);
    console.log(`Leads processados: ${rawLeads.length}`);
}

scrapeAndClean().catch(err => {
    console.error('ERRO NO SISTEMA:', err);
    process.exit(1);
});
