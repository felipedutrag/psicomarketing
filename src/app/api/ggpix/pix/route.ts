import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import crypto from 'crypto';

const GGPIX_API_KEY = process.env.GGPIX_API_KEY;
const GGPIX_API_URL = 'https://ggpixapi.com/api/v1'; // Based on system reminder and search snippet

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Generate a unique external ID
    const externalId = crypto.randomUUID();

    // Calculate total in cents
    // Default to R$ 29.00 if not provided
    let total = 29.00;
    
    if (body.products) {
         total = body.products.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0);
    } else if (body.total) {
         total = body.total;
    }
    
    // Ensure total is at least 1.00 (GGPIX minimum requirement)
    if (total < 1.00) {
        console.warn(`Total amount ${total} is less than minimum 1.00. Adjusting to 1.00.`);
        total = 1.00;
    }
    
    const amountCents = Math.round(total * 100);

    // Generate random payer data
    const generateCPF = () => {
      const rnd = (n: number) => Math.round(Math.random() * n);
      const mod = (dividend: number, divisor: number) => Math.round(dividend - (Math.floor(dividend / divisor) * divisor));
      const n1 = rnd(9);
      const n2 = rnd(9);
      const n3 = rnd(9);
      const n4 = rnd(9);
      const n5 = rnd(9);
      const n6 = rnd(9);
      const n7 = rnd(9);
      const n8 = rnd(9);
      const n9 = rnd(9);
      let d1 = n9 * 2 + n8 * 3 + n7 * 4 + n6 * 5 + n5 * 6 + n4 * 7 + n3 * 8 + n2 * 9 + n1 * 10;
      d1 = 11 - (mod(d1, 11));
      if (d1 >= 10) d1 = 0;
      let d2 = d1 * 2 + n9 * 3 + n8 * 4 + n7 * 5 + n6 * 6 + n5 * 7 + n4 * 8 + n3 * 9 + n2 * 10 + n1 * 11;
      d2 = 11 - (mod(d2, 11));
      if (d2 >= 10) d2 = 0;
      return `${n1}${n2}${n3}${n4}${n5}${n6}${n7}${n8}${n9}${d1}${d2}`;
    };

    const randomName = body.name || `Cliente ${Math.floor(Math.random() * 9000) + 1000}`;
    const randomCPF = generateCPF();
    
        const requestBody = {
        amountCents: amountCents, // Use calculated amount
        description: `Agendamento Psicomarketing - ${externalId.slice(0, 8)}`,
        externalId: externalId,
        payerName: randomName,
        payerDocument: randomCPF,
        expiresIn: 7200 // 2 hours expiration
    };

    console.log("--- GGPIX DEBUG START ---");
    console.log("URL:", `${GGPIX_API_URL}/pix/in`);
    console.log("Method: POST");
    console.log("Headers:", JSON.stringify({
        'Content-Type': 'application/json',
        'X-API-Key': GGPIX_API_KEY ? `${GGPIX_API_KEY.slice(0, 5)}...${GGPIX_API_KEY.slice(-5)}` : 'MISSING',
    }, null, 2));
    console.log("Payload:", JSON.stringify(requestBody, null, 2));

    const startTime = Date.now();
    const res = await fetch(`${GGPIX_API_URL}/pix/in`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': GGPIX_API_KEY || '',
        },
        body: JSON.stringify(requestBody)
    });

    const endTime = Date.now();
    const responseText = await res.text();
    
    console.log(`Response Time: ${endTime - startTime}ms`);
    console.log(`Status: ${res.status} ${res.statusText}`);
    console.log("Raw Response:", responseText);
    console.log("--- GGPIX DEBUG END ---");

    let data;
    try {
        data = JSON.parse(responseText);
    } catch (e) {
        data = { error: 'Failed to parse response as JSON', raw: responseText };
    }

    if (!res.ok) {
        console.error("GGPIX Error handled:", data);
        return NextResponse.json({ 
            error: 'Failed to generate PIX', 
            details: data,
            debug: {
                status: res.status,
                payload: requestBody
            }
        }, { status: res.status });
    }

    // Map GGPIX response to our internal format
    // Expected GGPIX response structure based on logs:
    // {
    //   "pixCode": "https://api.qrserver.com/...",
    //   "pixCopyPaste": "000201...",
    //   ...
    // }
    
    let qrCodeBase64 = undefined;
    let qrCodeUrl = undefined;

    // Map fields correctly based on API response
    const copyPasteCode = data.pixCopyPaste || data.copyPaste;
    const qrCodeValue = data.pixCode || data.qrCode;

    if (qrCodeValue && qrCodeValue.startsWith('http')) {
        qrCodeUrl = qrCodeValue;
    } else if (qrCodeValue && (qrCodeValue.length > 500 || qrCodeValue.startsWith('data:image'))) {
        // Assume it's base64 if it's very long or has the header
        // If it starts with 000201, it's likely the EMV text, not an image
        if (!qrCodeValue.startsWith('000201')) {
            qrCodeBase64 = qrCodeValue;
        }
    }

    // Always generate QR Code locally to ensure it works and avoid external dependencies/CORS/fallback issues
    // This overrides whatever the API sent if we can generate it ourselves
    if (copyPasteCode) {
        try {
            // Generate Data URL (data:image/png;base64,...)
            const dataUrl = await QRCode.toDataURL(copyPasteCode);
            // Remove the prefix to send only the base64 string, as expected by the frontend
            qrCodeBase64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
        } catch (err) {
            console.error("Failed to generate local QR Code:", err);
            // If local generation fails, keep the API value (if any)
        }
    }

    return NextResponse.json({
        success: true,
        pix_code: copyPasteCode,
        qr_code_base64: qrCodeBase64,
        qr_code_url: qrCodeUrl,
        order_id: data.id, // Use GGPIX ID for status polling
        external_id: externalId, // Keep external ID for reference
        full_response: data
    });

  } catch (error) {
    console.error('GGPIX API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
