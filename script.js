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
            glavnaVsebina.innerHTML = "<h2>OBDELUJEM SLIKO IN PREPOZNAVAM RASTLINO...</h2>";

            try {
                // 2. NOVO: Sliko stisnemo in pretvorimo v standardni JPEG format
                const base64Slika = await stisniInPretvoriSliko(slikaDatoteka);
                
                // 3. To je naslov najine "strojnice"
                const naslovStrojnice = "/.netlify/functions/prepoznaj"; 

                // 4. Zdaj pošljemo čisto JPEG sliko v strojnico
                const odgovor = await fetch(naslovStrojnice, {
                    method: 'POST',
                    body: JSON.stringify({ 
                        slika: base64Slika // Pošljemo Base64 JPEG sliko
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
     * NOVA FUNKCIJA ("Stiskalnica za Jabolka" oz. Canvas)
     * Vzame katerokoli sliko in jo vrne kot Base64 JPEG.
     */
    function stisniInPretvoriSliko(datoteka) {
        return new Promise((resolve, reject) => {
            const bralnik = new FileReader();
            bralnik.readAsDataURL(datoteka);
            bralnik.onload = function(dogodek) {
                const slika = new Image();
                slika.src = dogodek.target.result;
                slika.onload = function() {
                    const canvas = document.createElement('canvas');
                    
                    // Nastavimo velikost - pomanjšajmo slike, če so prevelike (hitrejše pošiljanje)
                    const MAX_SIRINA = 1024;
                    const MAX_VISINA = 1024;
                    let sirina = slika.width;
                    let visina = slika.height;

                    if (sirina > visina) {
                        if (sirina > MAX_SIRINA) {
                            visina *= MAX_SIRINA / sirina;
                            sirina = MAX_SIRINA;
                        }
                    } else {
                        if (visina > MAX_VISINA) {
                            sirina *= MAX_VISINA / visina;
                            visina = MAX_VISINA;
                        }
                    }
                    canvas.width = sirina;
                    canvas.height = visina;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(slika, 0, 0, sirina, visina);

                    // To je ključni del: Sliko pretvorimo v JPEG z 80% kvaliteto
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    
                    resolve(dataUrl);
                };
                slika.onerror = function(napaka) {
                    reject(napaka);
                };
            };
            bralnik.onerror = function(napaka) {
                reject(napaka);
            };
        });
    }

});