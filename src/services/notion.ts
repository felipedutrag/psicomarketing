import { Client } from '@notionhq/client';

/**
 * LILITH: NOTION SERVICE
 * Núcleo de sincronização de leads para dominação de mercado.
 * Ajustado para bater EXATAMENTE com as tabelas do Cadelo.
 */

const NOTION_TOKEN = process.env.NOTION_TOKEN || process.env.NOTION_API_KEY;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

// Inicializa o client oficial
const notion = new Client({ auth: NOTION_TOKEN });

export interface LeadData {
  leadName: string;
  externalId: string; // ID único (ex: email)
  email?: string;
  phone?: string;
  company?: string;
  source?: 'Inbound' | 'Outbound' | 'Referral' | 'Paid' | 'Other';
  status?: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Won' | 'Lost';
  value?: number;
  lastTouch?: string; // ISO format: YYYY-MM-DD
  notes?: string;
}

/**
 * Procura um lead pelo External ID no banco de dados do Notion.
 */
async function findLeadByExternalId(externalId: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: {
          property: 'External ID',
          rich_text: {
            equals: externalId,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Notion] Erro na API do Notion ao buscar lead:', errorText);
      return null;
    }

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].id;
    }
    return null;
  } catch (error: any) {
    console.error('[Notion] Erro ao buscar lead por External ID:', error.message);
    return null; 
  }
}

/**
 * Constrói o objeto de propriedades para a API do Notion.
 * Mapeia os campos para os nomes exatos fornecidos pelo Cadelo.
 */
function buildProperties(data: LeadData) {
  const props: any = {
    'Lead': {
      title: [{ text: { content: data.leadName } }],
    },
    'External ID': {
      rich_text: [{ text: { content: data.externalId } }],
    },
  };

  if (data.email) props['Email'] = { email: data.email };
  if (data.phone) props['Phone'] = { phone_number: data.phone };
  if (data.company) props['Company'] = { rich_text: [{ text: { content: data.company } }] };
  if (data.source) props['Source'] = { select: { name: data.source } };
  
  // No Notion, o tipo 'status' exige um objeto com 'name'
  if (data.status) {
    props['Status'] = { status: { name: data.status } };
  }

  if (data.value !== undefined) {
    props['Value'] = { number: data.value };
  }

  if (data.lastTouch) {
    props['Last touch'] = { date: { start: data.lastTouch } };
  }

  if (data.notes) {
    props['Notes'] = { rich_text: [{ text: { content: data.notes } }] };
  }

  return props;
}

/**
 * Cria ou atualiza um lead no Notion (Upsert).
 */
export async function upsertLead(data: LeadData) {
  console.log(`[Notion] Iniciando upsert para Lead: ${data.leadName} (ID: ${data.externalId})`);
  
  if (!NOTION_TOKEN || !DATABASE_ID) {
    console.error('[Notion] ERRO CRÍTICO: NOTION_TOKEN ou DATABASE_ID não configurados.');
    throw new Error('Notion configuration missing');
  }

  try {
    const pageId = await findLeadByExternalId(data.externalId);

    if (pageId) {
      console.log(`[Notion] Lead encontrado (Page ID: ${pageId}). Atualizando...`);
      return await notion.pages.update({
        page_id: pageId,
        properties: buildProperties(data),
      });
    } else {
      console.log(`[Notion] Lead não encontrado. Criando novo...`);
      return await notion.pages.create({
        parent: { database_id: DATABASE_ID },
        properties: buildProperties(data),
      });
    }
  } catch (error: any) {
    console.error(`[Notion] Erro fatal no Upsert para '${data.leadName}':`, error.message);
    throw error;
  }
}
