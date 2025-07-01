// Arquivo: index.js

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const app = express();
const upload = multer();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = process.env.PORT || 8080;

// Inicializa o WhatsApp Web
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  }
});

client.on('qr', qr => {
  console.clear();
  console.log('📲 Escaneie o QR Code abaixo para conectar seu WhatsApp:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ WhatsApp conectado com sucesso!');
});

client.on('authenticated', () => {
  console.log('🔒 Autenticado com sucesso!');
});

client.on('auth_failure', msg => {
  console.error('❌ Falha na autenticação:', msg);
});

client.on('disconnected', reason => {
  console.log('🔌 Desconectado do WhatsApp:', reason);
});

client.initialize();

app.post('/webhook', upload.single('audio'), async (req, res) => {
  try {
    const data = req.body;
    const isAudio = data.type === 'audio';
    const from = data.from;
    const messageText = data.body || '';
    const timestamp = new Date().toISOString();

    const payload = {
      from,
      type: data.type,
      timestamp,
      ...(isAudio ? { audio: req.file } : { body: messageText })
    };

    if (isAudio) {
      const form = new FormData();
      form.append('audio', req.file.buffer, {
        filename: 'audio.ogg',
        contentType: req.file.mimetype
      });
      form.append('from', from);
      form.append('type', 'audio');

      await axios.post('https://SEU_N8N_DOMAIN/webhook/vendedor-ia', form, {
        headers: form.getHeaders()
      });
    } else {
      await axios.post('https://SEU_N8N_DOMAIN/webhook/vendedor-ia', payload);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro no webhook:', error.message);
    res.status(500).json({ error: 'Erro interno no webhook' });
  }
});

app.post('/message/sendWhatsappText/default', async (req, res) => {
  try {
    const { number, text } = req.body;
    if (!number || !text) {
      return res.status(400).json({ error: 'Parâmetros ausentes: number ou text' });
    }

    console.log(`📤 Enviando mensagem para ${number}: ${text}`);
    await client.sendMessage(`${number}@c.us`, text);
    res.status(200).json({ success: true, to: number, text });
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error.message);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Evolution API rodando na porta ${PORT}`);
});
