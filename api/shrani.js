/* === KODA ZA shrani.js (Popravljena za Vercel) === */
const { createClient } = require('@supabase/supabase-js');

// "Vercel jezik": "export default" in "(req, res)"
export default async function handler(req, res) {

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return res.status(500).json({ napaka: 'Manjkajo Supabase ključi.' });
    }

    let imeRastline, zgodba;
    try {
        // ***************************************************************
        // TUKAJ JE POPRAVEK:
        // Vercel včasih pošlje besedilo, včasih pa že "odpakiran" objekt.
        // Ta koda preveri in v vsakem primeru pravilno prebere podatke.
        let podatki;
        if (typeof req.body === 'string') {
            podatki = JSON.parse(req.body); // Če je besedilo, ga "odpakiramo"
        } else {
            podatki = req.body; // Če je že odpakirano, ga uporabimo
        }
        // ***************************************************************

        imeRastline = podatki.ime;
        zgodba = podatki.zgodba;
        if (!imeRastline || !zgodba) { throw new Error('Manjkajo podatki (ime ali zgodba).'); }

    } catch (e) {
        return res.status(400).json({ napaka: 'Strežnik ni prejel podatkov za shranjevanje.' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    try {
        const zapis = { ime_rastline: imeRastline, zgodba: zgodba };
        const { error } = await supabase.from('najdbe').insert(zapis);
        if (error) { throw new Error(error.message); }

        console.log("Zapis uspešno shranjen v Supabase!");

        return res.status(200).json({ sporocilo: 'Uspešno shranjeno!' });

    } catch (napaka) {
        console.error("Zgodila se je napaka pri shranjevanju:", napaka);
        return res.status(500).json({ napaka: napaka.message });
    }
};