const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const path = require("path");

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    executablePath: "C:\\Users\\felip\\.cache\\puppeteer\\chrome\\win64-146.0.7680.31\\chrome-win64\\chrome.exe",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

// Configurações
const JSON_FILE = path.join(__dirname, "contatos.json");
const MIN_DELAY = 2 * 60 * 1000; // 2 minutos em ms
const MAX_DELAY = 5 * 60 * 1000; // 5 minutos em ms

// Função para gerar delay aleatório não linear
function getRandomDelay() {
  return Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1)) + MIN_DELAY;
}

// Função para ler o JSON
function readContacts() {
  try {
    const data = fs.readFileSync(JSON_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Erro ao ler arquivo JSON:", err.message);
    return [];
  }
}

// Função para salvar o JSON (após remover contato enviado)
function saveContacts(contacts) {
  try {
    fs.writeFileSync(JSON_FILE, JSON.stringify(contacts, null, 2), "utf8");
    console.log("Arquivo JSON atualizado.");
  } catch (err) {
    console.error("Erro ao salvar arquivo JSON:", err.message);
  }
}

// Função para formatar número para WhatsApp
function formatPhoneNumber(phone) {
  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, "");
  // Adiciona @c.us se não tiver
  return cleanPhone.includes("@c.us") ? cleanPhone : `${cleanPhone}@c.us`;
}

// Função para processar envio de mensagens
async function processMessages() {
  let contacts = readContacts();

  if (contacts.length === 0) {
    console.log("Nenhum contato para enviar. Encerrando...");
    await client.destroy();
    return;
  }

  console.log(`Total de contatos para enviar: ${contacts.length}`);

  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    const phone = formatPhoneNumber(contact.whatsapp);
    const message = contact.mensagem_personalizada;

    console.log(`\n[${i + 1}/${contacts.length}] Enviando para ${contact.nome} (${phone})...`);

    try {
      const msg = await client.sendMessage(phone, message);
      if (msg) {
        console.log(`✓ Mensagem enviada com sucesso para ${contact.nome}`);
      } else {
        console.log(`✓ Mensagem enviada (sem confirmação) para ${contact.nome}`);
      }

      // Remove o contato do array
      contacts.splice(i, 1);
      // Salva o JSON atualizado
      saveContacts(contacts);
      // Ajusta o índice pois removemos um elemento
      i--;

      // Se ainda há contatos, aguarda antes do próximo envio
      if (contacts.length > 0) {
        const delay = getRandomDelay();
        const delayMinutes = (delay / 1000 / 60).toFixed(1);
        console.log(`Aguardando ${delayMinutes} minutos antes do próximo envio...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

    } catch (err) {
      console.error(`✗ Erro ao enviar para ${contact.nome}:`, err.message);
      // Continua para o próximo contato mesmo com erro
    }
  }

  console.log("\n✓ Todos os contatos foram processados!");
  await client.destroy();
}

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
  console.log("Escaneie o QR code acima com o WhatsApp.");
});

client.on("ready", async () => {
  console.log("Cliente conectado com sucesso!");
  console.log("Iniciando envio de mensagens...\n");
  await processMessages();
});

client.on("message", async (message) => {
  console.log(`Mensagem recebida: ${message.body}`);
  if (message.body.toLowerCase() === "!ping") {
    await message.reply("pong");
  }
});

client.on("auth_failure", (msg) => {
  console.error("Falha na autenticação:", msg);
});

client.initialize();