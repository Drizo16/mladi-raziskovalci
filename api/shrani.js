/* === KODA ZA shrani.js (Prevedena za Vercel) === */
const { createClient } = require('@supabase/supabase-js');

// SPREMEMBA: "export default" in "(req, res)"
export default async function handler(req, res) {

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return res.status(500).json({ napaka: 'Manjkajo Supabase ključi.' });
    }

    let imeRastline, zgodba;
    try {
        // SPREMEMBA: Vercel samodejno prebere JSON, ni treba 'JSON.parse'
        const podatki = req.body;
        imeRastline = podatki.ime;
        zgodba = podatki.zgodba;
        if (!imeRastline || !zgodba) { throw new Error('Manjkajo podatki.'); }
    } catch (e) {
        return res.status(400).json({ napaka: 'Strežnik ni prejel podatkov za shranjevanje.' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    try {
        const zapis = { ime_rastline: imeRastline, zgodba: zgodba, znanstveno_ime: 'N/A' };
        const { error } = await supabase.from('najdbe').insert(zapis);
        if (error) { throw new Error(error.message); }

        console.log("Zapis uspešno shranjen v Supabase!");

        // SPREMEMBA: Odgovor v Vercel jeziku
        return res.status(200).json({ sporocilo: 'Uspešno shranjeno!' });

    } catch (napaka) {
        console.error("Zgodila se je napaka pri shranjevanju:", napaka);
        return res.status(500).json({ napaka: napaka.message });
    }
};