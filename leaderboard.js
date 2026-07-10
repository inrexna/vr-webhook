// leaderboard.js

async function updateAndGetLeaderboard(donator, amount, accessKey, binId) {
    let leaderboardText = "⚠️ Konfigurasi JSONBin belum lengkap di Vercel.";

    if (!accessKey || !binId) {
        return leaderboardText;
    }

    
    const numericAmount = Number(amount) || 0;

    try {
        // Ambil data terakhir dari JSONBin (GET)
        const getRes = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
            headers: { 'X-Access-Key': accessKey }
        });

        // Validasi respons HTTP GET
        if (!getRes.ok) {
            const errJson = await getRes.json().catch(() => ({}));
            throw new Error(`JSONBin GET Gagal (${getRes.status}): ${errJson.message || 'Unknown Error'}`);
        }

        const getJson = await getRes.json();
        
        // Ekstraksi record aman
        let database = getJson.record || { donators: {} };
        if (!database.donators) {
            database.donators = {};
        }
        
        let donatorData = database.donators;
        const currentTimestamp = new Date().toISOString();

        // Akumulasi Nominal Donasi
        if (donatorData[donator]) {
            // nilai lama juga dikonversi ke Number sebelum dijumlahkan
            const currentAmount = Number(donatorData[donator].amount) || 0;
            donatorData[donator].amount = currentAmount + numericAmount;
            donatorData[donator].last_timestamp = currentTimestamp;
        } else {
            const uniqueId = `id-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            
            donatorData[donator] = {
                id: uniqueId,
                name: donator,
                amount: numericAmount,
                last_timestamp: currentTimestamp
            };
        }

        database.donators = donatorData;

        // Save update ke JSONBin (PUT)
        const putRes = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Access-Key': accessKey
            },
            body: JSON.stringify(database)
        });

        // Validasi respons HTTP PUT
        if (!putRes.ok) {
            const errJson = await putRes.json().catch(() => ({}));
            throw new Error(`JSONBin PUT Gagal (${putRes.status}): ${errJson.message || 'Unknown Error'}`);
        }

        // Urutan donatur Descending
        const sortedDonators = Object.values(donatorData)
            .filter(user => user && typeof user.amount === 'number' && user.amount > 0)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 10); // Ambil Top 10

        // Convert data array menjadi teks format Discord
        leaderboardText = sortedDonators.map((user, index) => {
            const total = new Intl.NumberFormat('id-ID').format(user.amount);
            
            let rankIcon = "🔹";
            if (index === 0) rankIcon = "🥇";
            else if (index === 1) rankIcon = "🥈";
            else if (index === 2) rankIcon = "🥉";
            
            return `${rankIcon} **${user.name}** - Rp${total}`;
        }).join('\n');

        // string kosong 
        if (!leaderboardText || leaderboardText.trim() === "") {
            leaderboardText = "✨ *Belum ada donatur resmi saat ini. Yuk jadi yang pertama!* ✨";
        }

        return leaderboardText;

    } catch (error) {
        // Runtime Logs 
        console.error('[LEADERBOARD CRITICAL ERROR]:', error.message || error);
        return "⚠️ Gagal memuat leaderboard saat ini.";
    }
}

module.exports = { updateAndGetLeaderboard };