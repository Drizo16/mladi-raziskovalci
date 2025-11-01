/* To je najina "Strojnica" - Netlify Funkcija */
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    
    // 1. KORAK: Preberi skrivni ključ iz "sefa" (Environment)
    // process.env.IME_SPREMENLJIVKE
    const API_KLJUC = process.env.PLANTNET_API_KEY;

    // Varnostno preverjanje: Ali ključ sploh obstaja?
    if (!API_KLJUC) {
        return {
            statusCode: 500,
            body: JSON.stringify({ napaka: 'Manjka skrivni API ključ. Administrator mora to popraviti.' })
        };
    }

    // 2. KORAK: Sprejmi podatke (sliko) od telefona
    let base64Slika;
    try {
        // Preberemo Base64 sliko, ki jo je poslal 'script.js'
        base64Slika = JSON.parse(event.body).slika;
        
        // Slike ne spreminjamo, pošljemo jo kar celo (z 'data:image...' glavo)
        
    } catch (e) {
        return {
            statusCode: 400, // 400 = 'Bad Request' (Napačna zahteva)
            body: JSON.stringify({ napaka: 'Strežnik ni prejel slike.' })
        };
    }
    
    // 3. KORAK: Pokliči "Glavnega botanika" (PlantNet)
    // Sestavimo naslov za klic, ki vključuje najin skrivni ključ
    const plantNetURL = `https://my-api.plantnet.org/v2/identify/all?api-key=${API_KLJUC}`;

    try {
        const odgovorPlantNet = await fetch(plantNetURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                images: [base64Slika], // API pričakuje seznam slik v Base64
                organs: ['leaf'] // Recimo, da slikamo liste. Kasneje lahko dodamo 'flower', 'fruit'
            })
        });

        const podatkiPlantNet = await odgovorPlantNet.json();

        // 4. KORAK: Preveri odgovor od PlantNeta
        
        // Če PlantNet javi napako (npr. napačen ključ)
        if (podatkiPlantNet.error) {
            console.error("PlantNet napaka:", podatkiPlantNet.message);
            throw new Error(`PlantNet javlja: ${podatkiPlantNet.message}`);
        }
        
        // Če PlantNet ni našel nobene rastline
        if (!podatkiPlantNet.results || podatkiPlantNet.results.length === 0) {
            console.log("PlantNet ni našel nobene rastline.");
            throw new Error("Žal mi je, na tej sliki ne prepoznam nobene rastline.");
        }

        // ZMAGA! Vzamemo prvi (najboljši) rezultat
        const najboljsiRezultat = podatkiPlantNet.results[0];
        
        // Ime rastline (npr. "Quercus robur")
        const znanstvenoIme = najboljsiRezultat.species.scientificNameWithoutAuthor;
        // Domače ime (če obstaja, npr. "Hrast dob")
        const domaceIme = (najboljsiRezultat.species.commonNames.length > 0) 
                            ? najboljsiRezultat.species.commonNames[0] 
                            : znanstvenoIme; // Če ni domačega imena, uporabi znanstvenega

        // 5. KORAK: Pokliči mene (UI), da ustvarim zgodbo
        
        /* **************************************************************
         * TODO (Naredila bova v naslednjem koraku):
         * TUKAJ pride klic k meni (drugi UI API), da dobim zgodbo 
         * za "domaceIme" (npr. "Hrast dob").
         *
         * Za zdaj, da preveriva, ali vse deluje, 
         * bomo zgodbo napisali kar ročno.
         **************************************************************
        */
        const zgodba = `POZDRAVLJEN! JAZ SEM ${domaceIme.toUpperCase()}. MOJE ZNANSTVENO IME JE ${znanstvenoIme.toUpperCase()}. ČESTITAM, USPEŠNO SI ME PREPOZNAL!`;
        const zanimivost = `(TO JE PRAVI ODGOVOR OD PLANTNET-A!)`;


        // 6. KORAK: Pošlji končni paket (ime, zgodba) nazaj na telefon
        return {
            statusCode: 200, // 200 = 'Vse je v redu!'
            body: JSON.stringify({
                drevo: domaceIme.toUpperCase(),
                zgodba: zgodba,
                zanimivost: zanimivost
            })
        };

    } catch (napaka) {
        console.error("Zgodila se je napaka v 'strojnici':", napaka);
        return {
            statusCode: 500,
            body: JSON.stringify({ napaka: napaka.message })
        };
    }
};