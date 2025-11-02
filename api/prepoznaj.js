/* === KODA ZA prepoznaj.js (s POPRAVLJENIM, STROGIM ukazom) === */
const fetch = require('node-fetch');
const FormData = require('form-data');
const busboy = require('busboy');

// Vercel pričakuje "Promise", da pravilno obdela sliko
function parseMultipartForm(req) {
    return new Promise((resolve, reject) => {
        const bb = busboy({ headers: req.headers });
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
        // Popravek za Vercel: uporabi 'req' (request) neposredno
        req.pipe(bb);
    });
}

// "Vercel jezik": "export default" in "(req, res)"
export default async function handler(req, res) {

    const PLANTNET_API_KEY = process.env.PLANTNET_API_KEY;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
    if (!PLANTNET_API_KEY || !GEMINI_API_KEY) {
        return res.status(500).json({ napaka: 'Manjkajoči API ključi.' });
    }

    try {
        const { files } = await parseMultipartForm(req);
        const slikaDatoteka = files.slika;
        if (!slikaDatoteka) { throw new Error('Datoteka "slika" ni bila najdena.'); }
        console.log(`[FAZA 1/3] Slika uspešno prebrana: ${slikaDatoteka.filename}`);

        console.log("[FAZA 2/3] Kličem PlantNet...");
        const plantNetURL = `https://my-api.plantnet.org/v2/identify/all?api-key=${PLANTNET_API_KEY}&include-related-images=true`;
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
        if (podatkiPlantNet.results[0].images) {
            podatkiPlantNet.results[0].images.slice(0, 3).forEach(img => {
                slikeRastline.push(img.url.m); 
            });
        }

        console.log(`[FAZA 2/3] PlantNet odgovor: ${domaceIme}`);
        console.log("[FAZA 3/3] Kličem Google AI...");

        const modelName = "models/gemini-2.5-flash"; // Ime, ki sva ga našla
        const googleApiUrl = `https://generativelanguage.googleapis.com/v1/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

        // ***************************************************************
        // TUKAJ JE NOV, STROG UKAZ
        const ukaz = `
            TI SI RASTLINA, KI SE PREDSTAVLJA 7-LETNEMU OTROKU.
            IME RASTLINE: ${domaceIme}

            TVOJ ODGOVOR MORA IZPOLNJEVATI VSE NASLEDNJE POGOJE:
            1. ODGOVOR MORA BITI 100% DEJANSKO PRAVILEN IN RESNIČEN, NE IZMIŠLJEN.
            2. NAPIŠI DVE (2) KRATKI, RESNIČNI POVEDI O TEJ RASTLINI.
            3. NAPIŠI ENO (1) KRATKO, RESNIČNO ZANIMIVOST O TEJ RASTLINI.
            4. NE SMEŠ PISATI NOBENIH FILOZOFSKIH NASVETOV ALI PESMI.
            5. CELOTEN ODGOVOR MORA BITI V SLOVENŠČINI.
            6. CELOTEN ODGOVOR MORA BITI Z VELIKIMI TISKANIMI ČRKAMI.
            7. ZAČETI SE MORA TOČNO Z "POZDRAVLJEN! JAZ SEM...".
        `;
        // ***************************************************************

        const klicBody = { contents: [{ parts: [{ text: ukaz }] }] };
        const odgovorAI = await fetch(googleApiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(klicBody) });
        const podatkiAI = await odgovorAI.json();
        if (!odgovorAI.ok || podatkiAI.error) { throw new Error(`Google AI javlja: ${podatkiAI.error.message || 'Neznana napaka'}`); }
        const zgodbaOdAI = podatkiAI.candidates[0].content.parts[0].text;

        console.log("[FAZA 3/3] Google AI je poslal zgodbo!");

        // Pošljemo odgovor
        return res.status(200).json({
            drevo: domaceIme.toUpperCase(),
            zgodba: zgodbaOdAI, 
            slike: slikeRastline 
        });

    } catch (napaka) {
        console.error("Zgodila se je napaka v 'strojnici':", napaka);
        return res.status(500).json({ napaka: napaka.message });
    }
};