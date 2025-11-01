/* === KODA ZA prepoznaj.js (ki zdaj PROSI TUDI ZA SLIKE) === */
const fetch = require('node-fetch');
const FormData = require('form-data');
const busboy = require('busboy');

function parseMultipartForm(event) {
    return new Promise((resolve, reject) => {
        const bb = busboy({ headers: event.headers });
        const files = {};
        bb.on('file', (fieldname, file, info) => {
            const chunks = [];
            file.on('data', (chunk) => chunks.push(chunk));
            file.on('end', () => {
                files[fieldname] = { content: Buffer.concat(chunks), filename: info.filename };
            });
        });
        bb.on('close', () => resolve({ files }));
        bb.on('error', err => reject(err));
       bb.end(event.body);
    });
}

exports.handler = async function(event, context) {
    
    const PLANTNET_API_KEY = process.env.PLANTNET_API_KEY;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
    if (!PLANTNET_API_KEY || !GEMINI_API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ napaka: 'Manjkajoči API ključi.' }) };
    }
    
    let slikaDatoteka;
    try {
        const { files } = await parseMultipartForm(event);
        slikaDatoteka = files.slika;
        if (!slikaDatoteka) { throw new Error('Datoteka "slika" ni bila najdena.'); }
        console.log(`[FAZA 1/3] Slika uspešno prebrana: ${slikaDatoteka.filename}`);
    } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ napaka: `Strežnik ni prejel slike: ${e.message}` }) };
    }
    
    try {
        console.log("[FAZA 2/3] Kličem PlantNet (in prosim za slike)...");
        
        // ***************************************************************
        // TUKAJ JE POPRAVEK: Dodal sem '&include-related-images=true'
        const plantNetURL = `https://my-api.plantnet.org/v2/identify/all?api-key=${PLANTNET_API_KEY}&include-related-images=true`;
        // ***************************************************************

        const formData = new FormData();
        formData.append('images', slikaDatoteka.content, slikaDatoteka.filename);
        formData.append('organs', 'auto');
        const odgovorPlantNet = await fetch(plantNetURL, { method: 'POST', body: formData });
        const podatkiPlantNet = await odgovorPlantNet.json(); 
        if (!odgovorPlantNet.ok) { throw new Error(`PlantNet javlja: ${podatkiPlantNet.message || 'Neznana napaka'}`); }
        if (!podatkiPlantNet.results || podatkiPlantNet.results.length === 0) {
            throw new Error("Žal mi je, na tej sliki ne prepoznam nobene rastline.");
        }
        const domaceIme = podatkiPlantNet.results[0].species.commonNames[0] || podatkiPlantNet.results[0].species.scientificNameWithoutAuthor;
        
        const slikeRastline = [];
        // Koda za branje slik je zdaj pravilna
        if (podatkiPlantNet.results[0].images) {
            podatkiPlantNet.results[0].images.slice(0, 3).forEach(img => {
                slikeRastline.push(img.url.m); 
            });
        }
        
        console.log(`[FAZA 2/3] PlantNet odgovor: ${domaceIme}`);

        console.log("[FAZA 3/3] Kličem Google AI z modelom 'models/gemini-2.5-flash'...");
        
        const modelName = "models/gemini-2.5-flash"; 
        const googleApiUrl = `https://generativelanguage.googleapis.com/v1/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

        const ukaz = `
            TI SI PRIJAZNA RASTLINA, KI SE PREDSTAVLJA 7-LETNIKU.
            IME RASTLINE: ${domaceIme}
            
            TVOJ ODGOVOR MORA IZPOLNJEVATI TA PRAVILA:
            1. VEDNO V SLOVENŠČINI.
            2. VEDNO V VELIKIH TISKANIH ČRKAH.
            3. BITI MORA KRATEK IN JEDRNAT: NAJVEČ TRI (3) KRATKE POVEDI.
            4. VSEBOVATI MORA ENO (1) ZANIMIVOST O TEJ RASTLINI.
            
            ZAČNI Z "POZDRAVLJEN! JAZ SEM...".
        `;

        const klicBody = {
            contents: [{
                parts: [{ text: ukaz }]
            }]
        };

        const odgovorAI = await fetch(googleApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(klicBody)
        });
        const podatkiAI = await odgovorAI.json();

        if (!odgovorAI.ok || podatkiAI.error) {
            console.error("Google AI (ročni klic) napaka:", podatkiAI.error);
            throw new Error(`Google AI javlja: ${podatkiAI.error.message || 'Neznana napaka'}`);
        }

        const zgodbaOdAI = podatkiAI.candidates[0].content.parts[0].text;
        
        console.log("[FAZA 3/3] Google AI je poslal zgodbo!");

        return {
            statusCode: 200,
            body: JSON.stringify({
                drevo: domaceIme.toUpperCase(),
                zgodba: zgodbaOdAI, 
                slike: slikeRastline 
            })
        };

    } catch (napaka) {
        console.error("Zgodila se je napaka v 'strojnici':", napaka);
        return { statusCode: 500, body: JSON.stringify({ napaka: napaka.message }) };
    }
};