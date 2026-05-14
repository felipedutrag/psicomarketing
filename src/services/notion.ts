import { Client } from '@notionhq/client';

/**
 * LILITH: NOTION SERVICE (BOOKINGS)
 * Núcleo de sincronização de agendamentos.
 * Usa o banco de dados de agendamentos (NOTION_BOOKING_DATABASE_ID).
 */

const NOTION_TOKEN = process.env.NOTION_TOKEN || process.env.NOTION_API_KEY;
const DATABASE_ID = process.env.NOTION_BOOKING_DATABASE_ID || process.env.NOTION_DATABASE_ID;

// Inicializa o client oficial forçando a API de 2022 para evitar a frescura da V2025
const notion = new Client({ 
  auth: NOTION_TOKEN,
  notionVersion: '2022-06-28'
});

export interface LeadData {
  leadName: string;
  externalId: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: 'Inbound' | 'Outbound' | 'Referral' | 'Paid' | 'Other';
  status?: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Won' | 'Lost';
  value?: number;
  lastTouch?: string; 
  notes?: string;
}

async function findLeadByExternalId(externalId: string): Promise<string | null> {
  try {
    // LILITH: Usando request direto pro endpoint clássico porque a V2025 tá bugando permissões
    const response: any = await notion.request({
      path: `databases/${DATABASE_ID}/query`,
      method: 'post',
      body: {
        filter: {
          property: 'External ID',
          rich_text: {
            equals: String(externalId),
          },
        }
      }
    });

    if (response.results && response.results.length > 0) {
      return response.results[0].id;
    }
    return null;
  } catch (error: any) {
    console.error('[Notion] Erro ao buscar lead por External ID:', error.message);
    return null;
  }
}

function buildProperties(data: LeadData) {
  const props: any = {
    'Lead': { title: [{ text: { content: data.leadName } }] },
    'External ID': { rich_text: [{ text: { content: String(data.externalId) } }] },
  };

  if (data.email) props['Email'] = { email: data.email };
  if (data.phone) props['Phone'] = { phone_number: data.phone };
  if (data.company) props['Company'] = { rich_text: [{ text: { content: data.company } }] };
  if (data.source) props['Source'] = { select: { name: data.source } };
  if (data.status) props['Status'] = { status: { name: data.status } };
  if (data.value !== undefined) props['Value'] = { number: data.value };
  if (data.lastTouch) props['Last touch'] = { date: { start: data.lastTouch } };
  
  // Banco de Agendamentos usa 'Notes'
  if (data.notes) {
    props['Notes'] = { rich_text: [{ text: { content: data.notes } }] };
  }

  return props;
}

export async function upsertLead(data: LeadData) {
  console.log(`[Notion/Booking] Upsert Lead: ${data.leadName} (ID: ${data.externalId})`);
  
  if (!NOTION_TOKEN || !DATABASE_ID) {
    throw new Error('Notion configuration missing');
  }

  try {
    const pageId = await findLeadByExternalId(data.externalId);

    if (pageId) {
      return await notion.pages.update({
        page_id: pageId,
        properties: buildProperties(data),
      });
    } else {
      return await notion.pages.create({
        parent: { database_id: DATABASE_ID },
        properties: buildProperties(data),
      });
    }
  } catch (error: any) {
    console.error(`[Notion/Booking] Erro fatal:`, error.message);
    throw error;
  }
}
