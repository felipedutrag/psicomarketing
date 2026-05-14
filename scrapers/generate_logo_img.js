const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generateHighResLogo() {
    const svgPath = path.join(__dirname, '../../psicomarketing/public/icon.svg');
    const outputPath = path.join(__dirname, '../../img/logo_high_res.jpg');

    if (!fs.existsSync(path.dirname(outputPath))) {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    }

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Lê o SVG
    const svgContent = fs.readFileSync(svgPath, 'utf8');

    // HTML para renderizar o SVG em tela cheia com fundo preto (Dark Occult Luxury)
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { margin: 0; background: #000; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
                svg { width: 80%; height: 80%; }
            </style>
        </head>
        <body>
            ${svgContent}
        </body>
        </html>
    `;

    await page.setContent(html);
    await page.setViewport({ width: 2000, height: 2000, deviceScaleFactor: 2 });

    await page.screenshot({
        path: outputPath,
        type: 'jpeg',
        quality: 100,
        fullPage: true
    });

    console.log(`--- LOGO EM ALTA RESOLUÇÃO GERADA ---`);
    console.log(`Local: ${outputPath}`);

    await browser.close();
}

generateHighResLogo().catch(console.error);
