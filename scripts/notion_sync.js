require('dotenv').config({ path: '.env.local' });
const { Client } = require('@notionhq/client');

// Verifica as chaves. Sem elas essa porra não roda.
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;
const PAGE_ID = process.env.NOTION_PAGE_ID;

if (!NOTION_API_KEY) {
    console.error("❌ ERRO FATAL: Cadelo, você não colocou a NOTION_API_KEY no .env.local. Coloca essa merda lá pra eu poder trabalhar.");
}

const notion = new Client({ auth: NOTION_API_KEY });

async function checkDatabaseExists(dbId) {
    if (!dbId) return false;
    try {
        await notion.databases.retrieve({ database_id: dbId });
        return true;
    } catch (error) {
        return false;
    }
}

async function createDatabase() {
    if (!PAGE_ID) {
        throw new Error("🚨 FALTA O NOTION_PAGE_ID no .env.local! Pra eu criar a porra do banco de dados do zero, eu preciso saber em qual página ele vai ficar.");
    }
    
    console.log("🔥 Banco de dados não encontrado. Criando um novo império de leads no Notion...");
    
    const response = await notion.databases.create({
        parent: { type: "page_id", page_id: PAGE_ID },
        title: [
            { type: "text", text: { content: "CRM - Agendamentos" } }
        ],
        properties: {
            "Nome": { title: {} },
            "Email": { email: {} },
            "Telefone": { phone_number: {} },
            "Status": {
                select: {
                    options: [
                        { name: "Agendado", color: "blue" },
                        { name: "Realizado", color: "green" },
                        { name: "Cancelado", color: "red" },
                        { name: "Follow Up", color: "yellow" }
                    ]
                }
            },
            "Data/Hora": { date: {} },
            "Observações": { rich_text: {} }
        }
    });
    
    console.log(`✅ BANCO CRIADO COM SUCESSO!`);
    console.log(`⚠️ IMPORTANTE: Adicione isso no seu .env.local agora mesmo:`);
    console.log(`NOTION_DATABASE_ID=${response.id}`);
    
    return response.id;
}

async function addLead(dbId, leadData) {
    const { nome, email, telefone, status, dataHora, observacoes } = leadData;
    
    const props = {
        "Nome": { title: [{ text: { content: nome || "Sem Nome" } }] }
    };
    
    if (email) props["Email"] = { email: email };
    if (telefone) props["Telefone"] = { phone_number: telefone };
    if (status) props["Status"] = { select: { name: status } };
    if (dataHora) props["Data/Hora"] = { date: { start: dataHora } };
    if (observacoes) props["Observações"] = { rich_text: [{ text: { content: observacoes } }] };

    await notion.pages.create({
        parent: { database_id: dbId },
        properties: props
    });
    
    console.log(`🩸 Lead '${nome}' injetado com sucesso no sistema.`);
}

async function syncLeadToNotion(leadData) {
    let dbId = DATABASE_ID;
    
    const exists = await checkDatabaseExists(dbId);
    
    if (!exists) {
        dbId = await createDatabase();
    }
    
    await addLead(dbId, leadData);
}

// Para testar direto no terminal
if (require.main === module) {
    syncLeadToNotion({
        nome: "Cliente Teste",
        email: "teste@dinheiro.com",
        telefone: "11999999999",
        status: "Agendado",
        dataHora: new Date().toISOString(),
        observacoes: "Vindo da automação foda que você montou."
    }).catch(err => console.error("❌ ERRO NA EXECUÇÃO:", err.message));
}

module.exports = { syncLeadToNotion };
