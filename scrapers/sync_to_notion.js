const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');
require('dotenv').config();

/**
 * LILITH: SCRAPER SYNC TO NOTION
 * Pega os leads do JSON gerado pelo scraper e injeta no Notion.
 * AJUSTADO: Usa o banco de dados de scrapers (NOTION_SCRAPER_DATABASE_ID) e o schema exato.
 */

const NOTION_TOKEN = process.env.NOTION_TOKEN || process.env.NOTION_API_KEY;
const DATABASE_ID = process.env.NOTION_SCRAPER_DATABASE_ID;

if (!NOTION_TOKEN || !DATABASE_ID) {
    console.error('❌ ERRO: NOTION_TOKEN ou NOTION_SCRAPER_DATABASE_ID não configurados no .env');
    process.exit(1);
}

const notion = new Client({ auth: NOTION_TOKEN });

async function findLeadByExternalId(externalId) {
    try {
        const response = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${NOTION_TOKEN}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filter: {
                    property: 'External ID',
                    rich_text: {
                        equals: String(externalId),
                    },
                }
            })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Erro na API do Notion');
        return data.results.length > 0 ? data.results[0].id : null;
    } catch (error) {
        console.error(`[Sync/Scraper] Erro ao buscar ID ${externalId}:`, error.message);
        return null;
    }
}

async function syncLeads() {
    const leadsPath = path.join(__dirname, '../data/psicologos_leads.json');
    if (!fs.existsSync(leadsPath)) {
        console.error('❌ ERRO: Arquivo psicologos_leads.json não encontrado');
        return;
    }

    const leads = JSON.parse(fs.readFileSync(leadsPath, 'utf8'));
    console.log(`🚀 Sincronizando ${leads.length} leads para o banco de SCRAPERS...`);

    for (const lead of leads) {
        try {
            const externalId = lead.whatsapp || lead.nome; 
            const pageId = await findLeadByExternalId(externalId);

            const properties = {
                'Lead': { title: [{ text: { content: lead.nome } }] },
                'External ID': { rich_text: [{ text: { content: String(externalId) } }] },
                'Phone': { phone_number: (lead.whatsapp && lead.whatsapp !== 'N/A') ? lead.whatsapp : null },
                'Website': { url: (lead.website && lead.website !== 'N/A') ? lead.website : null },
                'Source': { select: { name: 'Outbound' } },
                'Status': { status: { name: 'Scraped' } },
                'Custom Message': { rich_text: [{ text: { content: lead.mensagem_personalizada || '' } }] },
                'WA Link': { url: (lead.wa_link && lead.wa_link !== 'N/A') ? lead.wa_link : null },
                'Last touch': { date: { start: new Date().toISOString().split('T')[0] } }
            };

            // Limpeza de campos nulos
            Object.keys(properties).forEach(key => {
                const val = properties[key];
                if (val === null || val.url === null || val.phone_number === null) delete properties[key];
            });

            if (pageId) {
                console.log(`[Update] Lead: ${lead.nome}`);
                await notion.pages.update({ page_id: pageId, properties: properties });
            } else {
                console.log(`[Create] Lead: ${lead.nome}`);
                await notion.pages.create({ parent: { database_id: DATABASE_ID }, properties: properties });
            }
        } catch (error) {
            console.error(`❌ Erro em ${lead.nome}:`, error.message);
        }
    }
    console.log('✅ Sincronização de Scrapers concluída!');
}

syncLeads();
