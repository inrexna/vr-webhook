require('dotenv').config();
const express = require('express');
const { WebhookClient, EmbedBuilder } = require('discord.js');

// 1. Impor fungsi dari file leaderboard.js
const { updateAndGetLeaderboard } = require('./leaderboard'); 

const app = express();
app.use(express.json());

const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
const jsonbinAccessKey = process.env.JSONBIN_ACCESS_KEY;
const jsonbinBinId = process.env.JSONBIN_BIN_ID;

let webhookClient;
if (webhookUrl) {
    webhookClient = new WebhookClient({ url: webhookUrl });
} else {
    console.error('[FATAL ERROR] DISCORD_WEBHOOK_URL tidak dikonfigurasi!');
}

app.post('/saweria', async (req, res) => {
    if (!webhookClient) {
        return res.status(500).json({ status: 'error', message: 'Webhook belum dikonfigurasi.' });
    }

    try {
        const data = req.body;
        const donator = data.donator_name || 'Hamba Allah';
        const amount = data.amount_raw || 0;
        const message = data.message || 'Tidak ada pesan khusus.';

        const formatRupiah = new Intl.NumberFormat('id-ID').format(amount);
        let warnaEmbed = 0xFFD700;
        let pesanLuar = `# Yay! Makasih **${donator}** \ udah traktir **Rp${formatRupiah}**! Lumayan buat beli kopi ☕`;
        let gifMedia = "https://media.giphy.com/media/3o6UB5RrlQuMfZp82Y/giphy.gif";

        if (amount >= 100000) {
            warnaEmbed = 0xFF0000;
            pesanLuar = `🚨 **SULTAN DETECTED!** Makasih banyak **${donator}** buat **Rp${formatRupiah}**-nya! 👑`;
            gifMedia = "https://media.giphy.com/media/LdOyjZ7io5Msw/giphy.gif";
        } else if (amount >= 50000) {
            warnaEmbed = 0x00FF00;
            pesanLuar = `🔥 Wihhh, **${donator}** ngabisin **Rp${formatRupiah}**! Menyala bosku! 🔥`;
            gifMedia = "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExa3BidXFjejc5aWVhNWh2YmN2a243MWVudmFpejI0NmJvc2JhY2dmcCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/kCpg2FYkENfnuvXSsS/giphy.gif";
        }

        // 2. Panggil fungsi modular dari file terpisah (Cukup 1 baris ini saja!)
        const leaderboardText = await updateAndGetLeaderboard(donator, amount, jsonbinAccessKey, jsonbinBinId);

        const embed = new EmbedBuilder()
            // .setAuthor({ name: `${donator} baru saja menyawer!`, iconURL: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' })
            .setAuthor({
              name: "Donation!!"
              // url:  ""
            })
            .setTitle(`Thank You **${donator}** Orang Baik 🫶🏻🫶🏻🫶🏻`)
            .setDescription(`**Nominal:** Rp${formatRupiah}\n\n**Pesan:**\n>*"${message}"*`)
            .setColor(warnaEmbed)
            .setImage(gifMedia)
            .setThumbnail('https://saweria.co/assets/img/logo.png')
            .addFields({ name: '🏆 Top 10 Donators Sepanjang Masa', value: leaderboardText })
            .setFooter({ text: 'Notifikasi Otomatis Webhook', iconURL: 'https://cdn-icons-png.flaticon.com/512/825/825590.png' })
            .setTimestamp();

        await webhookClient.send({
            content: "### New donation!!", 
            embeds: [embed],
        });

        console.log(`[SUKSES] Notifikasi & Leaderboard dari ${donator} terkirim.`);
        res.status(200).json({ status: 'success' });

    } catch (error) {
        console.error('[ERROR] Gagal memproses webhook utama:', error);
        res.status(500).json({ status: 'error' });
    }
});

module.exports = app;