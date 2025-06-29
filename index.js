const express = require('express');
const qrcode = require('qrcode');
const { Client } = require('whatsapp-web.js');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;
const API_KEY = process.env.AUTHENTICATION_API_KEY || 'default';

let qrCodeData = null;

const client = new Client({
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
});

client.on('qr', async (qr) => {
    console.log('QR Code recebido. Escaneie com o WhatsApp.');
    qrCodeData = await qrcode.toDataURL(qr);
});
client.on('ready', () => {
    console.log('✅ Cliente conectado e pronto para uso!');
});
client.initialize();

app.get('/qr', (req, res) => {
    if (!qrCodeData) {
        return res.send('<h2>Aguardando geração do QR Code...</h2>');
    }

    const html = `
        <html>
        <head><title>QR Code - WhatsApp</title></head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;">
            <h1>Escaneie o QR Code</h1>
            <img src="${qrCodeData}" style="width:300px;height:300px;" />
        </body>
        </html>
    `;
    res.send(html);
});

app.post('/message/sendWhatsappText/default', (req, res) => {
    const apiKeyHeader = req.headers['apikey'];
    if (apiKeyHeader !== API_KEY) {
        return res.status(401).json({ error: 'Chave de API inválida.' });
    }

    const { number, text } = req.body;
    if (!number || !text) {
        return res.status(400).json({ error: 'Número e texto são obrigatórios.' });
    }

    client.sendMessage(`${number}@c.us`, text)
        .then(response => res.json({ success: true, response }))
        .catch(error => res.status(500).json({ error: error.message }));
});

app.listen(PORT, () => {
    console.log(`🚀 Evolution API rodando na porta ${PORT}`);
});