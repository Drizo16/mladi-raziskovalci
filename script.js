/* Počakamo, da se celotna stran (HTML) naloži */
document.addEventListener("DOMContentLoaded", function() {

    /* Najprej v kodi najdemo najin zeleni gumb in glavno vsebino */
    const gumbKamera = document.getElementById("gumbKamera");
    const glavnaVsebina = document.querySelector(".vsebina"); // Potrebujemo to, da prikažemo sporočilo

    /* Ustvarimo skriti element za nalaganje datotek (slik) */
    const nalaganjeSlike = document.createElement("input");
    nalaganjeSlike.type = "file";
    nalaganjeSlike.accept = "image/*";
    nalaganjeSlike.capture = "environment";

    /* "Poslušamo", ali bo kdo kliknil na najin zeleni gumb */
    gumbKamera.addEventListener("click", function() {
        nalaganjeSlike.click();
    });

    /* Ko bo uporabnik POSNEL sliko in jo potrdil, se zgodi TO: */
    nalaganjeSlike.addEventListener("change", async function(dogodek) { // Opazi 'async' - to pomeni, da bomo nekaj čakali
        
        if (dogodek.target.files && dogodek.target.files[0]) {
            const slika = dogodek.target.files[0];
            
            console.log("Uporabnik je posnel sliko:", slika.name);

            /* ===== NOVO: TUKAJ SE ZAČNE ČAROVNIJA ===== */
            
            // 1. Pokažemo uporabniku, da se nekaj dogaja
            glavnaVsebina.innerHTML = "<h2>IŠČEM ODGOVOR V GOZDU... PROSIM, POČAKAJ.</h2>";

            // 2. To je naslov najine "strojnice", ki sva jo prej testirala
            const naslovStrojnice = "/.netlify/functions/prepoznaj"; 

            try {
                // 3. PRVI TEST: Ne pošljiva še slike, pošljiva samo testno sporočilo
                // Tvojemu imenu dodava 'POST' metodo, kot je zahtevala strojnica
                const odgovor = await fetch(naslovStrojnice, {
                    method: 'POST',
                    body: JSON.stringify({ ime: "Andraž" }) // Pošljemo testne podatke
                });

                // 4. Preberemo odgovor, ki ga je poslala strojnica
                const podatki = await odgovor.json();

                // 5. ZMAGA! Prikažemo podatke, ki smo jih dobili nazaj
                console.log("Dobil sem odgovor od strojnice:", podatki);
                
                // Namesto alert-a, kar zamenjajmo vsebino strani!
                // (Kasneje bova to naredila lepše, kot si opisal na "Drugi strani")
                glavnaVsebina.innerHTML = `
                    <h1>${podatki.drevo}</h1>
                    <p style="font-size: 1.2em; padding: 20px; text-transform: uppercase;">
                        ${podatki.zgodba}
                    </p>
                    <h3 style="margin-top: 20px;">${podatki.zanimivost}</h3>
                `;

            } catch (napaka) {
                // 6. Če je šlo karkoli narobe (npr. ni interneta)
                console.error("Zgodila se je napaka pri klicu strojnice:", napaka);
                glavnaVsebina.innerHTML = "<h2>UPS! NEKAJ JE ŠLO NAROBE. POSKUSI ZNOVA.</h2>";
            }
            /* ===== KONEC ČAROVNIJE ===== */
        }
    });
});