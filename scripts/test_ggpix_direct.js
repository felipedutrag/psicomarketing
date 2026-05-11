require('dotenv').config({ path: '.env' });
const QRCode = require('qrcode');

const GGPIX_API_KEY = process.env.GGPIX_API_KEY;
const GGPIX_API_URL = 'https://ggpixapi.com/api/v1';

async function testPix() {
    console.log("--- TESTING GGPIX CONNECTION ---");
    console.log("Key:", GGPIX_API_KEY ? GGPIX_API_KEY.substring(0, 10) + "..." : "MISSING");

    const requestBody = {
        amountCents: 100, // R$ 1,00 for test
        description: `Teste API Lilith`,
        externalId: "test-" + Date.now(),
        payerName: "Teste Lilith",
        payerDocument: "12345678909",
        expiresIn: 3600
    };

    try {
        const res = await fetch(`${GGPIX_API_URL}/pix/in`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': GGPIX_API_KEY || '',
            },
            body: JSON.stringify(requestBody)
        });

        const status = res.status;
        const text = await res.text();

        console.log("Status:", status);
        console.log("Response:", text);

        if (res.ok) {
            const data = JSON.parse(text);
            console.log("\n✅ SUCCESS!");
            console.log("PIX Code:", data.pixCopyPaste || data.copyPaste);
            
            if (data.pixCopyPaste || data.copyPaste) {
                const qr = await QRCode.toDataURL(data.pixCopyPaste || data.copyPaste);
                console.log("QR Code generated successfully (base64 length):", qr.length);
            }
        } else {
            console.log("\n❌ FAILED!");
        }
    } catch (err) {
        console.error("\n💥 ERROR:", err.message);
    }
}

testPix();
