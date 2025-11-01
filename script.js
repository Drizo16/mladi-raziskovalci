/* Počakamo, da se celotna stran (HTML) naloži */
document.addEventListener("DOMContentLoaded", function() {

    const gumbKamera = document.getElementById("gumbKamera");
    const glavnaVsebina = document.querySelector(".vsebina"); 

    const nalaganjeSlike = document.createElement("input");
    nalaganjeSlike.type = "file";
    nalaganjeSlike.accept = "image/*";
    nalaganjeSlike.capture = "environment";

    gumbKamera.addEventListener("click", function() {
        nalaganjeSlike.click();
    });

    /* Ko bo uporabnik POSNEL sliko in jo potrdil, se zgodi TO: */
    nalaganjeSlike.addEventListener("change", async function(dogodek) { // 'async' pomeni, da bomo nekaj čakali
        
        if (dogodek.target.files && dogodek.target.files[0]) {
            const slikaDatoteka = dogodek.target.files[0];
            
            console.log("Uporabnik je posnel sliko:", slikaDatoteka.name);

            // 1. Pokažemo uporabniku, da se nekaj dogaja
            glavnaVsebina.innerHTML = "<h2>PREPOZNAVAM RASTLINO... PROSIM, POČAKAJ.</h2>";

            // 2. NOVO: Sliko pretvorimo v Base64 besedilo, ki ga lahko pošljemo
            const base64Slika = await pretvoriVB64(slikaDatoteka);
            
            // 3. To je naslov najine "strojnice"
            const naslovStrojnice = "/.netlify/functions/prepoznaj"; 

            try {
                // 4. Zdaj pošljemo PRAVO sliko (kot besedilo) v strojnico
                const odgovor = await fetch(naslovStrojnice, {
                    method: 'POST',
                    body: JSON.stringify({ 
                        slika: base64Slika // Pošljemo Base64 sliko
                    }) 
                });

                // 5. Preberemo odgovor, ki ga je poslala strojnica
                const podatki = await odgovor.json();

                // 6. Preverimo, ali je strojnica vrnila napako
                if (podatki.napaka) {
                    throw new Error(podatki.napaka);
                }

                // 7. ZMAGA! Prikažemo podatke, ki smo jih dobili nazaj
                console.log("Dobil sem odgovor od strojnice:", podatki);
                
                // Prikažemo rezultate (kasneje bo to lepša stran)
                glavnaVsebina.innerHTML = `
                    <h1>${podatki.drevo}</h1>
                    <p style="font-size: 1.2em; padding: 20px; text-transform: uppercase;">
                        ${podatki.zgodba}
                    </p>
                    <h3 style="margin-top: 20px;">${podatki.zanimivost}</h3>
                `;

            } catch (napaka) {
                // 8. Če je šlo karkoli narobe
                console.error("Zgodila se je napaka:", napaka);
                glavnaVsebina.innerHTML = `<h2>UPS! NEKAJ JE ŠLO NAROBE. JE BILA SLIKA DOVOLJ JASNA? POSKUSI ZNOVA.</h2><p>${napaka.message}</p>`;
            }
        }
    });

    /**
     * Pomožna funkcija, ki pretvori datoteko slike v Base64 besedilo
     */
    function pretvoriVB64(datoteka) {
        return new Promise((resolve, reject) => {
            const bralnik = new FileReader();
            bralnik.readAsDataURL(datoteka);
            bralnik.onload = () => resolve(bralnik.result);
            bralnik.onerror = error => reject(error);
        });
    }

});