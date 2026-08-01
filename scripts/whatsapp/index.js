const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    executablePath: "C:\\Users\\felip\\.cache\\puppeteer\\chrome\\win64-146.0.7680.31\\chrome-win64\\chrome.exe",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
  console.log("Escaneie o QR code acima com o WhatsApp.");
});

client.on("ready", async () => {
  console.log("Cliente conectado com sucesso!");
  const number = "5513988658518@c.us";
  try {
    const msg = await client.sendMessage(number, "Teste de mensagem via whatsapp-web.js");
    if (msg) {
      console.log("Mensagem enviada com sucesso!");
    } else {
      console.log("Mensagem enviada (sem confirmação).");
    }
  } catch (err) {
    console.error("Erro ao enviar mensagem:", err.message);
  }
});

client.on("message", async (message) => {
  console.log(`Mensagem recebida: ${message.body}`);
  if (message.body.toLowerCase() === "!ping") {
    await message.reply("pong");
  }
});

client.initialize();