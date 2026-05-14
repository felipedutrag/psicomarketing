const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function scrapeAndClean() {
    // Lista de bairros/regiões de SP para aleatoriedade
    const bairrosSP = [
        'Centro', 'Pinheiros', 'Vila Mariana', 'Itaim Bibi', 'Moema', 
        'Tatuapé', 'Santana', 'Santo Amaro', 'Perdizes', 'Lapa', 
        'Belém', 'Mooca', 'Butantã', 'Jabaquara', 'Vila Olimpia', 
        'Bela Vista', 'Consolação', 'Liberdade', 'Saúde', 'Vila Guilherme'
    ];
    
    // Escolhe um bairro aleatório ou usa o passado por argumento
    const bairroEscolhido = process.argv[2] || bairrosSP[Math.floor(Math.random() * bairrosSP.length)];

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    const page = await browser.newPage();

    console.log(`--- INICIANDO SCRAPER (SÃO PAULO - BAIRRO: ${bairroEscolhido.toUpperCase()}) ---`);
    const url = `https://www.google.com/maps/search/psicologos+bairro+${encodeURIComponent(bairroEscolhido)}+sao+paulo`;
    await page.goto(url, { waitUntil: 'networkidle2' });

    const sidePanelSelector = 'div[role="feed"]';
    await page.waitForSelector(sidePanelSelector);

    const rawLeads = [];
    const limit = 20;

    console.log(`--- ROLANDO PARA CARREGAR LEADS (ALVO: ${limit}) ---`);
    let leadsLoaded = 0;
    let scrollAttempts = 0;
    
    while (leadsLoaded < limit && scrollAttempts < 15) {
        leadsLoaded = await page.$$eval('.hfpxzc', el => el.length);
        console.log(`Leads detectados no DOM: ${leadsLoaded}`);
        
        if (leadsLoaded >= limit) break;

        await page.evaluate(() => {
            const sidePanel = document.querySelector('div[role="feed"]');
            if (sidePanel) {
                sidePanel.scrollBy(0, 1500);
            }
        });
        
        await new Promise(r => setTimeout(r, 2000));
        scrollAttempts++;
    }

    // Mensagem genérica de fallback
    const mensagemPadrao = `Olá! Sou da Psicomarketing.
Notei sua presença clínica e gostaria de mostrar como nossa IA pode assumir seu WhatsApp enquanto você atende.
Conheça: https://www.psicomarketing.online/
Responda para testar!`;

    console.log(`🚀 Iniciando extração de ${limit} leads...`);

    for (let i = 0; i < limit; i++) {
        try {
            // Re-busca a lista em cada iteração para evitar elementos estáticos/quebrados
            const listItems = await page.$$('.hfpxzc');
            if (i >= listItems.length) {
                console.log(`⚠️ Fim da lista alcançado prematuramente (${listItems.length} encontrados).`);
                break;
            }

            const item = listItems[i];
            
            // Rola o item específico para a visão antes de clicar (Garante o carregamento dos detalhes)
            await page.evaluate(el => el.scrollIntoView(), item);
            await new Promise(r => setTimeout(r, 500));
            
            await item.click();
            await new Promise(r => setTimeout(r, 3000)); // Tempo para carregar o painel de detalhes

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
            model: "gemini-3.1-flash-lite",
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

                const prompt = `Você é um redator especialista em copy simpático, profissional e extremamente OBJETIVO. 
                Escreva uma mensagem curta para WhatsApp para apresentar a Psicomarketing para um psicólogo.

                REGRAS OBRIGATÓRIAS:
                1. NÃO use o nome do lead ou da clínica. Comece com uma saudação cordial e genérica (ex: Olá, tudo bem?).
                2. Apresente a marca de forma fluida e convidativa (ex: "Conheça a Psicomarketing", "Já ouviu falar da Psicomarketing?" ou similar). Evite o clássico "Sou da...".
                3. Explique que somos uma Inteligência Artificial exclusiva para psicólogos que automatiza o acolhimento e agendamento no WhatsApp enquanto eles atendem.
                4. O link deve estar em uma linha PRÓPRIA e ISOLADA: https://www.psicomarketing.online/
                5. O CTA final deve ser um convite para a pessoa RESPONDER a esta mensagem para testar a IA agora mesmo.
                6. Varie COMPLETAMENTE o vocabulário e a estrutura das frases em cada geração para evitar detecção de spam.
                7. Tom: Amigável, moderno e sem enrolação.

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

    // Chamada automática para o integrador do Notion
    console.log('\n--- SINCRONIZANDO COM NOTION ---');
    const { exec } = require('child_process');
    exec('node scrapers/sync_to_notion.js', (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Erro ao sincronizar com Notion: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`⚠️ Erro no processo de sync: ${stderr}`);
            return;
        }
        console.log(stdout);
    });
}

scrapeAndClean().catch(err => {
    console.error('ERRO NO SISTEMA:', err);
    process.exit(1);
});
