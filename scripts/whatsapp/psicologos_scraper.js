const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function scrapeAndClean() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    const page = await browser.newPage();

    console.log('--- INICIANDO SCRAPER DE TESTE (5 LEADS RAW + WA LINK) ---');
    const url = 'https://www.google.com/maps/search/psicologos+cidade+sao+paulo+carrao';
    await page.goto(url, { waitUntil: 'networkidle2' });

    const sidePanelSelector = 'div[role="feed"]';
    await page.waitForSelector(sidePanelSelector);

    const rawLeads = [];
    const limit = 5;

    // Mensagem genérica e profissional da Psicomarketing
    const mensagemPadrao = `Olá! Sou da Psicomarketing.

Notei sua presença clínica e gostaria de apresentar como nossa inteligência especializada pode assumir seu acolhimento e agendamento no WhatsApp enquanto você está em sessão.

Garantimos que nenhum paciente em potencial fique sem resposta imediata, preservando sua autoridade e seu tempo.

Conheça nossa tecnologia: https://www.psicomarketing.online/

Responda essa mensagem para testar nossa IA agora mesmo!`;

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

    const localPath = path.join(__dirname, '../data/psicologos_leads.json');
    const rootPath = path.join(__dirname, '../../data/psicologos_leads.json');

    [localPath, rootPath].forEach(dest => {
        if (!fs.existsSync(path.dirname(dest))) fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, JSON.stringify(rawLeads, null, 2), 'utf8');
    });

    console.log(`\n--- TESTE FINALIZADO ---`);
    console.log(`Leads extraídos: ${rawLeads.length}`);
    console.log(`Mensagem padrão aplicada nos links de WhatsApp.`);

    await browser.close();
}

scrapeAndClean().catch(err => {
    console.error('ERRO NO SISTEMA:', err);
    process.exit(1);
});
