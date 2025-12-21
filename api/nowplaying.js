// api/nowplaying.js - API Vercel pour récupérer les métadonnées radio

export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Content-Type': 'application/json',
    };

    if (!url) {
        return new Response(JSON.stringify({ error: 'URL manquante' }), {
            status: 400,
            headers,
        });
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Icy-MetaData': '1',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            signal: controller.signal,
        });

        clearTimeout(timeout);

        const icyName = response.headers.get('icy-name') || '';
        const icyMetaInt = response.headers.get('icy-metaint');

        let nowPlaying = null;

        if (icyMetaInt) {
            const metaInt = parseInt(icyMetaInt, 10);
            const reader = response.body.getReader();
            
            let buffer = new Uint8Array(0);
            const targetSize = metaInt + 4096;
            
            try {
                while (buffer.length < targetSize) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    const newBuffer = new Uint8Array(buffer.length + value.length);
                    newBuffer.set(buffer);
                    newBuffer.set(value, buffer.length);
                    buffer = newBuffer;
                    
                    if (buffer.length > 100000) break;
                }
                
                await reader.cancel();
            } catch (e) {
                // Ignorer
            }

            if (buffer.length > metaInt) {
                const metaLength = buffer[metaInt] * 16;
                
                if (metaLength > 0 && buffer.length >= metaInt + 1 + metaLength) {
                    const metaBytes = buffer.slice(metaInt + 1, metaInt + 1 + metaLength);
                    const metaString = new TextDecoder('utf-8', { fatal: false }).decode(metaBytes);
                    
                    // Chercher StreamTitle
                    const match = metaString.match(/StreamTitle='([^']*?)'/);
                    
                    if (match && match[1]) {
                        nowPlaying = cleanTitle(match[1], icyName);
                    }
                }
            }
        } else {
            try {
                const reader = response.body.getReader();
                await reader.cancel();
            } catch (e) {}
        }

        return new Response(JSON.stringify({
            success: true,
            nowPlaying: nowPlaying,
            stationName: icyName || null,
        }), { status: 200, headers });

    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            nowPlaying: null,
            error: error.message,
        }), { status: 200, headers });
    }
}

// Fonction pour nettoyer le titre
function cleanTitle(title, stationName) {
    if (!title) return null;
    
    let cleaned = title
        // Supprimer les caractères null
        .replace(/\0/g, '')
        // Supprimer StreamUrl et autres métadonnées parasites
        .replace(/;StreamUrl='[^']*'/gi, '')
        .replace(/;StreamUrl=[^;]*/gi, '')
        .replace(/StreamUrl='[^']*'/gi, '')
        // Supprimer autres métadonnées ICY possibles
        .replace(/;[A-Za-z]+='[^']*'/g, '')
        .replace(/;[A-Za-z]+=[^;]*/g, '')
        // Nettoyer les espaces
        .replace(/\s+/g, ' ')
        .trim();
    
    // Vérifier si le résultat est valide
    if (!cleaned || 
        cleaned.length < 3 ||
        cleaned === '-' ||
        cleaned === '--' ||
        cleaned.toLowerCase() === 'unknown' ||
        cleaned.toLowerCase() === 'untitled' ||
        cleaned.toLowerCase() === stationName?.toLowerCase()) {
        return null;
    }
    
    // Vérifier si c'est juste le nom de la station
    if (stationName && cleaned.toLowerCase().includes(stationName.toLowerCase())) {
        if (cleaned.length <= stationName.length + 5) {
            return null;
        }
    }
    
    return cleaned;
}
