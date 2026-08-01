const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const path = require("path");

// Resolução inteligente do arquivo de leads
const candidatePaths = [
  path.join(__dirname, "../data/psicologos_leads.json"),
  path.join(__dirname, "../../data/psicologos_leads.json"),
  path.join(__dirname, "contatos.json")
];

function getJsonFilePath() {
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) return p;
  }
  return candidatePaths[0]; // Padrão
}

const JSON_FILE = getJsonFilePath();

// Tenta usar o Puppeteer padrão do sistema, com fallback para o executável salvo
const puppeteerOptions = {
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-accelerated-2d-canvas",
    "--no-first-run",
    "--no-zygote",
    "--disable-gpu"
  ]
};

const customChromePath = "C:\\Users\\felip\\.cache\\puppeteer\\chrome\\win64-146.0.7680.31\\chrome-win64\\chrome.exe";
if (fs.existsSync(customChromePath)) {
  puppeteerOptions.executablePath = customChromePath;
}

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: puppeteerOptions
});

function log(message, type = "INFO") {
  const timestamp = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  console.log(`[${timestamp}] [${type}] ${message}`);
}

// Configurações Anti-Ban de envio
const MIN_DELAY = 2 * 60 * 1000; // 2 minutos
const MAX_DELAY = 5 * 60 * 1000; // 5 minutos

// Função para gerar delay não-linear (exponencial/jitter) para simular comportamento humano
function getRandomDelay() {
  const randomFactor = Math.pow(Math.random(), 1.5); // Curva não-linear
  const delay = Math.floor(MIN_DELAY + randomFactor * (MAX_DELAY - MIN_DELAY));
  return delay;
}

// Função para ler o JSON de contatos
function readContacts() {
  const filePath = getJsonFilePath();
  try {
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error(`Erro ao ler arquivo JSON (${filePath}):`, err.message);
    return [];
  }
}

// Função para salvar o JSON atualizado
function saveContacts(contacts) {
  const filePath = getJsonFilePath();
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(contacts, null, 2), "utf8");
    console.log(`Arquivo atualizado (${contacts.length} leads restantes).`);
  } catch (err) {
    console.error(`Erro ao salvar arquivo JSON (${filePath}):`, err.message);
  }
}

// Função para formatar número para WhatsApp
function formatPhoneNumber(phone) {
  let cleanPhone = (phone || "").replace(/\D/g, "");
  if (cleanPhone.length <= 11) cleanPhone = "55" + cleanPhone;
  return cleanPhone.includes("@c.us") ? cleanPhone : `${cleanPhone}@c.us`;
}

// Processador de envio de mensagens
async function processMessages() {
  let contacts = readContacts();

  if (contacts.length === 0) {
    console.log(`Nenhum contato encontrado em ${JSON_FILE}. Encerrando...`);
    await client.destroy();
    return;
  }

  console.log(`--- DISPARADOR WHATSAPP PSICOMARKETING ---`);
  console.log(`Arquivo de origem: ${getJsonFilePath()}`);
  console.log(`Total de contatos pendentes: ${contacts.length}`);
  console.log(`Intervalo anti-ban configurado: ${MIN_DELAY / 1000 / 60} a ${MAX_DELAY / 1000 / 60} minutos por disparo.\n`);

  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    const phone = formatPhoneNumber(contact.whatsapp || contact.phone);
    const message = contact.mensagem_personalizada || contact.mensagem_inicial;

    if (!message) {
      console.warn(`[AVISO] Pulando ${contact.nome} por falta de mensagem.`);
      continue;
    }

    console.log(`\n[${i + 1}/${contacts.length}] Enviando para: ${contact.nome} (${phone})...`);

    try {
      const msg = await client.sendMessage(phone, message);
      if (msg) {
        console.log(`✓ Mensagem entregue com sucesso para ${contact.nome}`);
      } else {
        console.log(`✓ Mensagem enviada (sem confirmação imediata) para ${contact.nome}`);
      }

      // Remove contato processado
      contacts.splice(i, 1);
      saveContacts(contacts);
      i--;

      // Se ainda restam contatos, aplica o delay anti-ban
      if (contacts.length > 0) {
        const delay = getRandomDelay();
        const delayMinutes = (delay / 1000 / 60).toFixed(1);
        console.log(`Aguardando ${delayMinutes} minutos antes do próximo envio...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

    } catch (err) {
      console.error(`✗ Erro ao enviar para ${contact.nome}:`, err.message);
    }
  }

  console.log("\n✓ Todos os contatos do lote foram processados com sucesso!");
  await client.destroy();
}

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
  console.log("Escaneie o QR code acima com o WhatsApp do seu número de disparos.");
});

client.on("ready", async () => {
  console.log("Cliente WhatsApp Web conectado com sucesso!");
  console.log("Iniciando fila de envios...\n");
  await processMessages();
});

client.on("message", async (message) => {
  if (message.body.toLowerCase() === "!ping") {
    await message.reply("pong");
  }
});

client.on("auth_failure", (msg) => {
  console.error("Falha na autenticação do WhatsApp Web:", msg);
});

client.initialize();
