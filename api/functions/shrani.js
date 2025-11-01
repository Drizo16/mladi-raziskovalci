/* === KODA ZA NOVO STROJNICO: shrani.js === */

// Uvozimo orodje "pisalo"
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {

    // 1. KORAK: Preberi ključe za "skrinjo" iz sefa (.env)
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return { statusCode: 500, body: JSON.stringify({ napaka: 'Manjkajo Supabase ključi.' }) };
    }

    // 2. KORAK: Preberi podatke, ki jih je poslal gumb "Shrani"
    let imeRastline, zgodba;
    try {
        const podatki = JSON.parse(event.body);
        imeRastline = podatki.ime;
        zgodba = podatki.zgodba;

        if (!imeRastline || !zgodba) { throw new Error('Manjkajo podatki.'); }

    } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ napaka: 'Strežnik ni prejel podatkov za shranjevanje.' }) };
    }

    // 3. KORAK: Poveži se s "skrinjo"
    // Uporabimo ključe, da ustvarimo povezavo
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // 4. KORAK: Zapiši v "zvezek" (tabelo `najdbe`)
    try {
        // Ustvarimo nov "zapis"
        const zapis = {
            ime_rastline: imeRastline,
            zgodba: zgodba,
            znanstveno_ime: 'N/A' // TODO: Kasneje lahko dodava še to
        };

        // Pošljemo ukaz "vstavi ta zapis v tabelo 'najdbe'"
        const { error } = await supabase
            .from('najdbe') // Ime najinega "zvezka"
            .insert(zapis);

        // Če je prišlo do napake pri shranjevanju
        if (error) {
            console.error("Supabase napaka:", error.message);
            throw new Error(error.message);
        }

        console.log("Zapis uspešno shranjen v Supabase!");

        // 5. KORAK: Pošlji odgovor "Vse je v redu!" nazaj na telefon
        return {
            statusCode: 200,
            body: JSON.stringify({ sporocilo: 'Uspešno shranjeno!' })
        };

    } catch (napaka) {
        console.error("Zgodila se je napaka pri shranjevanju:", napaka);
        return { statusCode: 500, body: JSON.stringify({ napaka: napaka.message }) };
    }
};