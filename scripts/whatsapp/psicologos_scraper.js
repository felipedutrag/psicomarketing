const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Caminhos para o JSON de dados
const localDataPath = path.join(__dirname, '../data/psicologos_leads.json');
const rootDataPath = path.join(__dirname, '../../data/psicologos_leads.json');

// Função de limpeza de nome
function cleanName(rawName) {
    if (!rawName) return 'Colega';
    let name = rawName
        .replace(/\bPsic[^\s]*\b/gi, '')
        .replace(/\bNeuro[^\s]*\b/gi, '')
        .replace(/\bPsican[^\s]*\b/gi, '')
        .replace(/\bDra?\.?\b/gi, '')
        .replace(/em\s[A-Za-zÀ-ÖØ-öø-ÿ\s]*/gi, '')
        .replace(/atendimento\ssomente\sparticular/gi, '')
        .replace(/Clinica/gi, '')
        .replace(/Espaço do Ser/gi, 'Equipe')
        .replace(/[\(\)\|].*/, '')
        .replace(/-.*/, '')
        .replace(/\s+/g, ' ')
        .trim();

    if (!name || name.length < 3) name = 'Colega';
    return name;
}

// Carregar leads existentes para evitar duplicatas
function loadExistingLeads() {
    const existing = [];
    const targetPath = fs.existsSync(localDataPath) ? localDataPath : (fs.existsSync(rootDataPath) ? rootDataPath : null);
    if (targetPath) {
        try {
            const raw = fs.readFileSync(targetPath, 'utf8');
            const data = JSON.parse(raw);
            if (Array.isArray(data)) return data;
        } catch (e) {
            console.warn('Aviso: Não foi possível ler leads existentes, iniciando lista nova.');
        }
    }
    return existing;
}

// Salvar leads em ambos os caminhos
function saveLeads(leads) {
    const jsonOutput = JSON.stringify(leads, null, 2);
    [localDataPath, rootDataPath].forEach(filePath => {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, jsonOutput, 'utf8');
    });
}

async function scrapeAndClean() {
    const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
    const TARGET_LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : 50;

    console.log(`--- INICIANDO SCRAPER INTELIGENTE (ALVO: ${TARGET_LIMIT} LEADS ÚNICOS) ---`);

    // Carrega dados já existentes
    const existingLeads = loadExistingLeads();
    const existingPhones = new Set(existingLeads.map(l => (l.whatsapp || '').replace(/\D/g, '')).filter(Boolean));
    const existingNames = new Set(existingLeads.map(l => (l.nome || '').toLowerCase().trim()).filter(Boolean));

    console.log(`Leads já armazenados: ${existingLeads.length} | Telefones únicos conhecidos: ${existingPhones.size}`);

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const searchQuery = 'psicologos cidade sao paulo';
    const url = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
    
    await page.goto(url, { waitUntil: 'networkidle2' });

    const sidePanelSelector = 'div[role="feed"]';
    try {
        await page.waitForSelector(sidePanelSelector, { timeout: 15000 });
    } catch (e) {
        console.error('Erro: Painel do Google Maps não encontrado.');
        await browser.close();
        return;
    }

    const mensagemPadrao = `Olá! Sou da Psicomarketing.

Notei sua presença clínica e gostaria de apresentar como nossa inteligência especializada pode assumir seu acolhimento e agendamento no WhatsApp enquanto você está em sessão.

Garantimos que nenhum paciente em potencial fique sem resposta imediata, preservando sua autoridade e seu tempo.

Conheça nossa tecnologia: https://www.psicomarketing.online/

Responda essa mensagem para testar nossa IA agora mesmo!`;

    const newLeads = [];
    let processedIndex = 0;
    let noNewItemsCount = 0;

    while (newLeads.length < TARGET_LIMIT && noNewItemsCount < 5) {
        const listItems = await page.$$('.hfpxzc');
        
        if (processedIndex >= listItems.length) {
            // Rola o feed para carregar mais itens
            console.log(`Rolando página para carregar mais resultados... (${listItems.length} carregados na tela)`);
            await page.evaluate((selector) => {
                const feed = document.querySelector(selector);
                if (feed) feed.scrollTop = feed.scrollHeight;
            }, sidePanelSelector);

            await new Promise(r => setTimeout(r, 2500));
            const updatedItems = await page.$$('.hfpxzc');
            if (updatedItems.length === listItems.length) {
                noNewItemsCount++;
            } else {
                noNewItemsCount = 0;
            }
            continue;
        }

        try {
            const item = listItems[processedIndex];
            processedIndex++;

            await item.click();
            await new Promise(r => setTimeout(r, 2000));

            // Garante que o painel de detalhes foi carregado
            try {
                await page.waitForSelector('h1.DUwDvf', { timeout: 4000 });
            } catch (e) {
                // Se o h1.DUwDvf demorar, ignora a falha momentânea
            }

            const details = await page.evaluate((itemEl) => {
                const nameEl = document.querySelector('h1.DUwDvf');
                let name = nameEl ? nameEl.innerText.trim() : '';
                
                // Fallback para o aria-label do próprio cartão da lista se o h1 falhar
                if (!name && itemEl) {
                    name = itemEl.getAttribute('aria-label') || '';
                }
                
                const phoneBtn = document.querySelector('button[data-tooltip="Copiar número de telefone"]');
                const phone = phoneBtn ? phoneBtn.getAttribute('aria-label') : '';
                
                const websiteBtn = document.querySelector('a[data-tooltip="Abrir website"]');
                const website = websiteBtn ? websiteBtn.getAttribute('href') : 'N/A';

                let cleanPhone = (phone || '').replace(/\D/g, '');
                if (cleanPhone && cleanPhone.length <= 11) cleanPhone = '55' + cleanPhone;

                return {
                    rawName: name,
                    phone: cleanPhone,
                    website: website
                };
            }, item);

            if (!details.rawName || !details.phone || details.phone.length < 10) {
                console.log(`[IGNORADO] Lead sem telefone válido/nome: ${details.rawName || 'Sem nome'}`);
                continue;
            }

            const cleanNameVal = cleanName(details.rawName);
            const normalizedPhone = details.phone.replace(/\D/g, '');
            const normalizedNameKey = cleanNameVal.toLowerCase().trim();

            // CHECAGEM DE DUPLICATA
            if (existingPhones.has(normalizedPhone) || existingNames.has(normalizedNameKey)) {
                console.log(`[DUPLICADO] Pulando lead já cadastrado: ${cleanNameVal} (${normalizedPhone})`);
                continue;
            }

            // Lead Válido e Novo
            const firstName = cleanNameVal.split(' ')[0];
            const mensagem = `Olá, ${firstName}. Enquanto você entrega o seu melhor em sessão, quem acolhe a urgência de quem acaba de chegar no seu WhatsApp? O silêncio no primeiro contato é o maior ponto de perda de pacientes particulares hoje.

Responda *teste* aqui mesmo e veja em tempo real como minha IA acolhe, tria e agenda seus pacientes no piloto automático. 🌑🖤`;

            const fullPhone = normalizedPhone.length <= 11 ? '55' + normalizedPhone : normalizedPhone;
            const waLink = `https://wa.me/${fullPhone}?text=${encodeURIComponent(mensagem)}`;

            const leadObj = {
                nome: cleanNameVal,
                whatsapp: fullPhone,
                website: details.website,
                mensagem_inicial: mensagem,
                wa_link: waLink
            };

            newLeads.push(leadObj);
            existingPhones.add(normalizedPhone);
            existingNames.add(normalizedNameKey);

            console.log(`[NOVO ${newLeads.length}/${TARGET_LIMIT}] Capturado: ${cleanNameVal} - ${fullPhone}`);

            // Salva incrementalmente para não perder dados se for interrompido
            const currentTotalLeads = [...existingLeads, ...newLeads];
            saveLeads(currentTotalLeads);

        } catch (err) {
            console.error(`Erro ao processar índice ${processedIndex - 1}:`, err.message);
        }
    }

    const finalLeads = [...existingLeads, ...newLeads];
    saveLeads(finalLeads);

    console.log(`\n--- SCRAPING CONCLUÍDO ---`);
    console.log(`Novos leads capturados nesta sessão: ${newLeads.length}`);
    console.log(`Total acumulado no banco de dados: ${finalLeads.length}`);

    await browser.close();
}

if (require.main === module) {
    scrapeAndClean().catch(err => {
        console.error('ERRO NO SCRAPER:', err);
        process.exit(1);
    });
}

module.exports = { scrapeAndClean };

