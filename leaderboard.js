// leaderboard.js

async function updateAndGetLeaderboard(donator, amount, accessKey, binId) {
    let leaderboardText = "⚠️ Konfigurasi JSONBin belum lengkap.";

    // Jika kunci JSONBin tidak ada atau engga lengkap, hentikan proses dan kembalikan teks peringatan
    if (!accessKey || !binId) {
        return leaderboardText;
    }

    try {
        // 1. Ambil data terakhir dari JSONBin (GET)
        const getRes = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
            headers: { 'X-Access-Key': accessKey }
        });
        const getJson = await getRes.json();
        
        // Format data di JSONBin V3 berada di dalam properti "record"
        let donatorData = getJson.record || {};

        // 2. Tambahkan donasi baru (Akumulasi jika donatur sudah pernah nyawer)
        if (donatorData[donator]) {
            donatorData[donator] += amount;
        } else {
            donatorData[donator] = amount;
        }

        // 3. Simpan pembaruan kembali ke JSONBin (PUT)
        await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Access-Key': accessKey
            },
            body: JSON.stringify(donatorData)
        });

        // 4. Urutkan donatur berdasarkan total nominal dari yang tertinggi
        const sortedDonators = Object.entries(donatorData)
            .sort((a, b) => b[1] - a[1]) // Descending
            .slice(0, 10); // Ambil Top 10

        // 5. Ubah hasil urutan menjadi teks berformat (String)
        leaderboardText = sortedDonators.map((entry, index) => {
            const name = entry[0];
            const total = new Intl.NumberFormat('id-ID').format(entry[1]);
            
            // Ikon medali untuk Top 3
            let rankIcon = "🔹";
            if (index === 0) rankIcon = "🥇";
            else if (index === 1) rankIcon = "🥈";
            else if (index === 2) rankIcon = "🥉";
            
            return `${rankIcon} **${name}** - Rp${total}`;
        }).join('\n');

        return leaderboardText;

    } catch (error) {
        console.error('[ERROR] Gagal memproses leaderboard:', error);
        return "⚠️ Gagal memuat leaderboard saat ini.";
    }
}

// Mengekspor fungsi agar bisa dipanggil dari file lain
module.exports = { updateAndGetLeaderboard };