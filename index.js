require('dotenv').config();

const express = require('express');
const { WebhookClient, EmbedBuilder } = require('discord.js');

const app = express();
app.use(express.json()); 

// Variabel dari environment Varcel
const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

// Validasi Webhook (Tanpa process.exit biar instance tidak crash)
let webhookClient;
if (!webhookUrl) {
    console.error('[FATAL ERROR] DISCORD_WEBHOOK_URL tidak dikonfigurasi!');
} else {
    webhookClient = new WebhookClient({ url: webhookUrl });
}

app.post('/saweria', async (req, res) => {
    // Tambah Eror Pengaman: Jika webhookUrl kosong, return HTTP 500
    if (!webhookClient) {
        return res.status(500).json({ status: 'error', message: 'Webhook URL belum dikonfigurasi di server.' });
    }

    try {
        const data = req.body;

        const donator = data.donator_name || 'Hamba Allah';
        const amount = data.amount_raw || 0;
        const message = data.message || 'Tidak ada pesan khusus.';

        // Format Rupiah
        const formatRupiah = new Intl.NumberFormat('id-ID').format(amount);

        // Variabel penampung untuk kustomisasi tier
        let warnaEmbed;
        let pesanLuar;
        let gifMedia;

        // Logic Tier Kasta Saweran
        if (amount >= 100000) {
            warnaEmbed = 0xFF0000; 
            pesanLuar = `🚨 **SULTAN DETECTED!** Makasih banyak **${donator}** buat **Rp${formatRupiah}**-nya! 👑`;
            gifMedia = "https://media.giphy.com/media/LdOyjZ7io5Msw/giphy.gif"; 
        } else if (amount >= 50000) {
            warnaEmbed = 0x00FF00; 
            pesanLuar = `🔥 Wihhh, **${donator}** ngabisin **Rp${formatRupiah}**! Menyala bosku! 🔥`;
            gifMedia = "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExa3BidXFjejc5aWVhNWh2YmN2a243MWVudmFpejI0NmJvc2JhY2dmcCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/kCpg2FYkENfnuvXSsS/giphy.gif"; 
        } else {
            warnaEmbed = 0xFFD700; 
            pesanLuar = `Yay! Makasih **${donator}** udah traktir **Rp${formatRupiah}**! Lumayan buat beli kopi ☕`;
            
            const gifBiasa = [
                "https://media.giphy.com/media/3o6UB5RrlQuMfZp82Y/giphy.gif",
                "https://media.giphy.com/media/l0Ex6kAKAoFRsFh6M/giphy.gif"
            ];
            gifMedia = gifBiasa[Math.floor(Math.random() * gifBiasa.length)];
        }

        // Pernak pernik Embed Builder
        const embed = new EmbedBuilder()
            .setAuthor({ 
                name: `${donator} baru saja menyawer!`, 
                iconURL: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' 
            })
            .setTitle('💸 Rincian Saweran')
            .setDescription(`**Nominal:** Rp${formatRupiah}\n\n**Pesan:**\n> *"${message}"*`)
            .setColor(warnaEmbed)
            .setImage(gifMedia)
            .setThumbnail('https://saweria.co/assets/img/logo.png') 
            .setFooter({ 
                text: 'Notifikasi Otomatis Webhook', 
                iconURL: 'https://cdn-icons-png.flaticon.com/512/825/825590.png'
            })
            .setTimestamp();

        // Mengirim ke Discord
        await webhookClient.send({
            content: pesanLuar, 
            embeds: [embed],
        });

        console.log(`[SUKSES] Notifikasi donasi Rp${formatRupiah} dari ${donator} terkirim.`);
        res.status(200).json({ status: 'success' });

    } catch (error) {
        console.error('[ERROR] Gagal mengirim webhook:', error);
        res.status(500).json({ status: 'error' });
    }
});

// GANTI dengan module.exports
module.exports = app;