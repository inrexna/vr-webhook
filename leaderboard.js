// leaderboard.js

async function updateAndGetLeaderboard(donator, amount, accessKey, binId) {
    let leaderboardText = "⚠️ Konfigurasi JSONBin belum lengkap di Vercel.";

    if (!accessKey || !binId) {
        return leaderboardText;
    }

    try {
        // 1. Ambil data terakhir dari JSONBin (GET)
        const getRes = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
            headers: { 'X-Access-Key': accessKey }
        });
        const getJson = await getRes.json();
        
        // Mengambil objek "donators", jika JSON kosong, buat struktur dasar
        let database = getJson.record || { donators: {} };
        if (!database.donators) database.donators = {};
        
        let donatorData = database.donators;

        // Buat timestamp saat ini (Format ISO)
        const currentTimestamp = new Date().toISOString();

        // Logika Akumulasi dengan Struktur Objek Baru
        if (donatorData[donator]) {
            // Jika donatur sudah ada: tambah saldo dan update waktu terakhir
            donatorData[donator].amount += amount;
            donatorData[donator].last_timestamp = currentTimestamp;
        } else {
            // Jika donatur baru: buat ID unik, set saldo, dan set waktu
            const uniqueId = `id-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            
            donatorData[donator] = {
                id: uniqueId,
                name: donator,
                amount: amount,
                last_timestamp: currentTimestamp
            };
        }

        // Kembalikan data yang sudah diperbarui ke dalam variabel utama
        database.donators = donatorData;

        // Simpan pembaruan kembali ke JSONBin (PUT)
        await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Access-Key': accessKey
            },
            body: JSON.stringify(database) // Simpan keseluruhan struktur database
        });

        // Urutkan donatur berdasarkan amount (Menggunakan Object.values)
        const sortedDonators = Object.values(donatorData)
            .filter(user => user.amount > 0) // Filter placeholder
            .sort((a, b) => b.amount - a.amount) // Descending
            .slice(0, 10); // Ambil Top 10

        // Ubah hasil urutan menjadi teks berformat
        leaderboardText = sortedDonators.map((user, index) => {
            const total = new Intl.NumberFormat('id-ID').format(user.amount);
            
            let rankIcon = "🔹";
            if (index === 0) rankIcon = "🥇";
            else if (index === 1) rankIcon = "🥈";
            else if (index === 2) rankIcon = "🥉";
            
            return `${rankIcon} **${user.name}** - Rp${total}`;
        }).join('\n');

        // Proteksi anticrash jika leaderboard kosong
        if (!leaderboardText || leaderboardText.trim() === "") {
            leaderboardText = "✨ *Belum ada donatur resmi saat ini. Yuk jadi yang pertama!* ✨";
        }

        return leaderboardText;

    } catch (error) {
        console.error('[ERROR] Gagal memproses leaderboard:', error);
        return "⚠️ Gagal memuat leaderboard saat ini.";
    }
}

module.exports = { updateAndGetLeaderboard };