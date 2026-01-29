const axios = require('axios');

// Test WhatsApp send
async function testWhatsApp() {
    try {
        const response = await axios.post('http://localhost:3001/send', {
            phone: '082227025335', // Replace with your test number
            message: 'Test dari OTOPIA Car Wash POS System!'
        });

        console.log('✅ Response:', response.data);
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testWhatsApp();
