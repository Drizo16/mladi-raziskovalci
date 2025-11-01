/* === KODA ZA NOVO STROJNICO: pridobi-najdbe.js === */

const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return { statusCode: 500, body: JSON.stringify({ napaka: 'Manjkajo Supabase ključi.' }) };
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    try {
        // Preberemo VSE zapise iz "zvezka" (tabele) 'najdbe'
        // Razvrstimo jih po datumu, da so najnovejši na vrhu
        let { data: najdbe, error } = await supabase
            .from('najdbe') // Ime najinega "zvezka"
            .select('*')    // Izberi vse stolpce
            .order('created_at', { ascending: false }); // Novejši najprej

        if (error) {
            console.error("Supabase napaka pri branju:", error.message);
            throw error;
        }

        console.log("Uspešno prebral vse najdbe iz Supabase!");

        // Pošljemo seznam najdb nazaj v "pisarno"
        return {
            statusCode: 200,
            body: JSON.stringify(najdbe)
        };

    } catch (napaka) {
        console.error("Zgodila se je napaka pri branju najdb:", napaka);
        return { statusCode: 500, body: JSON.stringify({ napaka: napaka.message }) };
    }
};