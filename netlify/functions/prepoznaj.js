/* === KONČNA, PRAVILNA KODA ZA prepoznaj.js === */

const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    
    // 1. KORAK: Preberi skrivni ključ iz "sefa"
    const API_KLJUC = process.env.PLANTNET_API_KEY;

    if (!API_KLJUC) {
        return {
            statusCode: 500,
            body: JSON.stringify({ napaka: 'Manjka skrivni API ključ.' })
        };
    }

    // 2. KORAK: Sprejmi podatke (sliko) od telefona
    let base64Slika;
    try {
        // Preberemo Base64 sliko, ki jo je poslal 'script.js'
        base64Slika = JSON.parse(event.body).slika;
        
        // ***********************************************
        // TUKAJ JE ČAROBNI DEL, KI SVA GA ISKALA!
        // Recepcija (script.js) naredi popoln 'data:image/jpeg;base64,....'
        // PlantNet pa hoče samo tisto za vejico.
        // ZATO ZDAJ SPET ODSTRANIMO "GLAVO":
        base64Slika = base64Slika.split(",")[1];
        // ***********************************************
        
    } catch (e) {
        return {
            statusCode: 400,
            body: JSON.stringify({ napaka: 'Strežnik ni prejel slike.' })
        };
    }
    
    // 3. KORAK: Pokliči "Glavnega botanika" (PlantNet)
    const plantNetURL = `https://my-api.plantnet.org/v2/identify/all?api-key=${API_KLJUC}`;

    try {
        const odgovorPlantNet = await fetch(plantNetURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                images: [base64Slika], // API pričakuje seznam surovih Base64 slik
                organs: ['leaf'] 
            })
        });

        const podatkiPlantNet = await odgovorPlantNet.json();

        // 4. KORAK: Preveri odgovor od PlantNeta
        if (!odgovorPlantNet.ok || podatkiPlantNet.error) {
            console.error("PlantNet napaka:", podatkiPlantNet.message);
            throw new Error(`PlantNet javlja: ${podatkiPlantNet.message || 'Neznana napaka'}`);
        }
        
        if (!podatkiPlantNet.results || podatkiPlantNet.results.length === 0) {
            console.log("PlantNet ni našel nobene rastline.");
            throw new Error("Žal mi je, na tej sliki ne prepoznam nobene rastline.");
        }

        // ZMAGA! Vzamemo prvi (najboljši) rezultat
        const najboljsiRezultat = podatkiPlantNet.results[0];
        const znanstvenoIme = najboljsiRezultat.species.scientificNameWithoutAuthor;
        const domaceIme = (najboljsiRezultat.species.commonNames.length > 0) 
                            ? najboljsiRezultat.species.commonNames[0] 
                            : znanstvenoIme;

        // 5. KORAK: Priprava odgovora
        // TODO: Klic UI za zgodbo
        
        const zgodba = `POZDRAVLJEN! JAZ SEM ${domaceIme.toUpperCase()}. MOJE ZNANSTVENO IME JE ${znanstvenoIme.toUpperCase()}. ČESTITAM, USPEŠNO SI ME PREPOZNAL!`;
        const zanimivost = `(TO JE PRAVI ODGOVOR OD PLANTNET-A!)`;

        // 6. KORAK: Pošlji končni paket nazaj na telefon
        return {
            statusCode: 200,
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

/* === KONEC KODE === */