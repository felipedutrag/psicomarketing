import { Client } from '@notionhq/client';

/**
 * LILITH: NOTION SERVICE (BOOKINGS)
 * Núcleo de sincronização de agendamentos.
 * Usa o banco de dados de agendamentos (NOTION_BOOKING_DATABASE_ID).
 */

const NOTION_TOKEN = process.env.NOTION_TOKEN || process.env.NOTION_API_KEY;
const DATABASE_ID = process.env.NOTION_BOOKING_DATABASE_ID || process.env.NOTION_DATABASE_ID;

// Inicializa o client oficial
const notion = new Client({ auth: NOTION_TOKEN });

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
    if (data.results && data.results.length > 0) return data.results[0].id;
    return null;
  } catch (error: any) {
    console.error('[Notion/Booking] Erro ao buscar lead:', error.message);
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
