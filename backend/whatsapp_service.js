const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize WhatsApp client with local authentication
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: '.wwebjs_auth'
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

let isReady = false;
let qrCodeData = null;

// QR Code Event
client.on('qr', (qr) => {
    console.log('\n========================================');
    console.log('📱 SCAN QR CODE DENGAN WHATSAPP');
    console.log('========================================\n');
    qrcode.generate(qr, { small: true });
    qrCodeData = qr;
    console.log('\n========================================\n');
});

// Ready Event
client.on('ready', () => {
    console.log('✅ WhatsApp Client is ready!');
    isReady = true;
    qrCodeData = null;
});

// Authenticated Event
client.on('authenticated', () => {
    console.log('🔐 WhatsApp Client authenticated successfully');
});

// Auth Failure Event
client.on('auth_failure', (msg) => {
    console.error('❌ Authentication failed:', msg);
    isReady = false;
});

// Disconnected Event
client.on('disconnected', (reason) => {
    console.log('⚠️  WhatsApp Client disconnected:', reason);
    isReady = false;
});

// Initialize client
client.initialize();

// ============================================
// REST API ENDPOINTS
// ============================================

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'online',
        whatsapp_ready: isReady,
        has_qr: qrCodeData !== null
    });
});

// Get QR code (for web display)
app.get('/qr', (req, res) => {
    if (qrCodeData) {
        res.json({ qr: qrCodeData });
    } else if (isReady) {
        res.json({ message: 'Already authenticated' });
    } else {
        res.status(503).json({ error: 'QR not yet generated' });
    }
});

// Send message
app.post('/send', async (req, res) => {
    if (!isReady) {
        return res.status(503).json({
            success: false,
            error: 'WhatsApp client not ready. Please authenticate first.'
        });
    }

    const { phone, message } = req.body;

    if (!phone || !message) {
        return res.status(400).json({
            success: false,
            error: 'Phone and message are required'
        });
    }

    try {
        // Format phone number (add 62 country code if needed)
        let formattedPhone = phone.replace(/\D/g, ''); // Remove non-digits

        // Add country code if not present
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '62' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('62')) {
            formattedPhone = '62' + formattedPhone;
        }

        const chatId = formattedPhone + '@c.us';

        // Check if number exists on WhatsApp
        const numberExists = await client.isRegisteredUser(chatId);

        if (!numberExists) {
            return res.status(404).json({
                success: false,
                error: 'Phone number not registered on WhatsApp'
            });
        }

        // Send message
        await client.sendMessage(chatId, message);

        console.log(`✅ Message sent to ${formattedPhone}`);

        res.json({
            success: true,
            message: 'Message sent successfully',
            to: formattedPhone
        });

    } catch (error) {
        console.error('❌ Error sending message:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Logout/Reset session
app.post('/logout', async (req, res) => {
    try {
        await client.logout();
        isReady = false;
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start server
const PORT = process.env.WHATSAPP_PORT || 3001;
app.listen(PORT, () => {
    console.log('\n========================================');
    console.log(`🚀 WhatsApp Service running on port ${PORT}`);
    console.log('========================================\n');
    console.log('API Endpoints:');
    console.log(`  GET  http://localhost:${PORT}/health - Check status`);
    console.log(`  GET  http://localhost:${PORT}/qr - Get QR code`);
    console.log(`  POST http://localhost:${PORT}/send - Send message`);
    console.log(`  POST http://localhost:${PORT}/logout - Reset session`);
    console.log('\n========================================\n');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await client.destroy();
    process.exit(0);
});
