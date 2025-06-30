// Arquivo: index.js

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const app = express();
const upload = multer();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = process.env.PORT || 8080;

// Webhook de entrada (cliente -> IA)
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

// Rota para envio de mensagem de texto no WhatsApp
app.post('/message/sendWhatsappText/default', async (req, res) => {
  try {
    const { number, text } = req.body;
    if (!number || !text) {
      return res.status(400).json({ error: 'Parâmetros ausentes: number ou text' });
    }

    // Aqui você colocaria o código de envio real via whatsapp-web.js ou sistema equivalente
    console.log(`Enviando mensagem para ${number}: ${text}`);
    // Simulação de envio (mock)
    res.status(200).json({ success: true, to: number, text });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error.message);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Evolution API rodando na porta ${PORT}`);
});
