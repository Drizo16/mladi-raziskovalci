/* === KODA ZA pridobi-najdbe.js (Prevedena za Vercel) === */
const { createClient } = require('@supabase/supabase-js');

// SPREMEMBA: "export default" in "(req, res)"
export default async function handler(req, res) {

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return res.status(500).json({ napaka: 'Manjkajo Supabase ključi.' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    try {
        let { data: najdbe, error } = await supabase
            .from('najdbe')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) { throw error; }

        console.log("Uspešno prebral vse najdbe iz Supabase!");

        // SPREMEMBA: Odgovor v Vercel jeziku
        return res.status(200).json(najdbe);

    } catch (napaka) {
        console.error("Zgodila se je napaka pri branju najdb:", napaka);
        return res.status(500).json({ napaka: napaka.message });
    }
};