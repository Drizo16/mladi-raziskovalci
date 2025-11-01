/* === KODA ZA script.js (s slikami in gumbom "Nazaj") === */

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

    nalaganjeSlike.addEventListener("change", async function(dogodek) { 

        if (dogodek.target.files && dogodek.target.files[0]) {
            const slikaDatoteka = dogodek.target.files[0];

            console.log("Uporabnik je posnel sliko:", slikaDatoteka.name);
            glavnaVsebina.innerHTML = "<h2>RAZISKUJEM TVOJO RASTLINO ...</h2>";

            try {
                const formData = new FormData();
                formData.append('slika', slikaDatoteka, slikaDatoteka.name);
                const naslovStrojnice = "/api/prepoznaj"; 

                const odgovor = await fetch(naslovStrojnice, {
                    method: 'POST',
                    body: formData 
                });
                const podatki = await odgovor.json();

                if (podatki.napaka) { throw new Error(podatki.napaka); }
                console.log("Dobil sem odgovor od strojnice:", podatki);

                // NOVO: Pošljemo tudi slike v funkcijo za prikaz
                prikaziRezultate(podatki.drevo, podatki.zgodba, podatki.slike);

            } catch (napaka) {
                console.error("Zgodila se je napaka:", napaka);
                glavnaVsebina.innerHTML = `<h2>UPS! NEKAJ JE ŠLO NAROBE. POSKUSI ZNOVA.</h2><p>${napaka.message}</p>`;
            }
        }
    });

    /**
     * FUNKCIJA (FAZA 4)
     * Zgradi lep HTML za prikaz rezultatov
     */
    function prikaziRezultate(imeDrevesa, zgodba, slike) {

        glavnaVsebina.innerHTML = ""; // Počistimo vsebino
        const naslov = document.createElement("h1");
        naslov.textContent = imeDrevesa;
        glavnaVsebina.appendChild(naslov);

        const slikeBox = document.createElement("div");
        slikeBox.className = "slike-box";

        // ***************************************************************
        // NOVO: PRAVE SLIKE V KVADRATKE
        if (slike && slike.length > 0) {
            slike.forEach(url => {
                const imgElement = document.createElement("img");
                imgElement.src = url;
                imgElement.alt = "Slika rastline";
                imgElement.className = "slika-rastline-mala"; // Nov class za stil
                slikeBox.appendChild(imgElement);
            });
        } else {
            slikeBox.innerHTML = `
                <div class="slika-placeholder">(NI SLIK)</div>
            `;
        }
        glavnaVsebina.appendChild(slikeBox);
        // ***************************************************************


        const zgodbaOdstavek = document.createElement("p");
        zgodbaOdstavek.className = "zgodba";
        zgodbaOdstavek.textContent = zgodba;
        glavnaVsebina.appendChild(zgodbaOdstavek);

        const gumbPoslusaj = document.createElement("button");
        gumbPoslusaj.id = "gumbPoslusaj";
        gumbPoslusaj.className = "gumb-akcija";
        gumbPoslusaj.textContent = "POSLUŠAJ ZGODBO";
        glavnaVsebina.appendChild(gumbPoslusaj);

        const gumbShrani = document.createElement("button");
        gumbShrani.id = "gumbShrani";
        gumbShrani.className = "gumb-akcija";
        gumbShrani.textContent = "SHRANI V SKRINJO ZAKLADOV";
        glavnaVsebina.appendChild(gumbShrani);

        // ***************************************************************
        // NOVO: GUMB "VRNI SE NA ZAČETEK"
        const gumbNazaj = document.createElement("button");
        gumbNazaj.id = "gumbNazaj";
        gumbNazaj.className = "gumb-akcija";
        gumbNazaj.textContent = "VRNI SE NA ZAČETEK";
        glavnaVsebina.appendChild(gumbNazaj);

        gumbNazaj.addEventListener("click", function() {
            // Počistimo vsebino in prikažemo glavni gumb za kamero
            glavnaVsebina.innerHTML = "";
            glavnaVsebina.appendChild(gumbKamera);
        });
        // ***************************************************************

        // KODA ZA GUMB "POSLUŠAJ" (ostane enaka)
        gumbPoslusaj.addEventListener("click", function() {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                const izgovor = new SpeechSynthesisUtterance(zgodba);
                const glasovi = window.speechSynthesis.getVoices();
                const slovenskiGlas = glasovi.find(glas => glas.lang === 'sl-SI');
                if (slovenskiGlas) {
                    izgovor.lang = 'sl-SI';
                    izgovor.voice = slovenskiGlas;
                }
                izgovor.pitch = 1;
                izgovor.rate = 0.9;
                window.speechSynthesis.speak(izgovor);
            } else {
                alert("OPROSTI, TVOJ BRSKALNIK NE ZNA GOVORITI.");
            }
        });

        // KODA ZA GUMB "SHRANI" (ostane enaka)
        gumbShrani.addEventListener("click", async function() {
            gumbShrani.textContent = "SHRANJUJEM...";
            gumbShrani.disabled = true;

            const naslovStrojniceShrani = "/api/shrani";

            try {
                const odgovor = await fetch(naslovStrojniceShrani, {
                    method: 'POST',
                    body: JSON.stringify({
                        ime: imeDrevesa,
                        zgodba: zgodba
                    }) 
                });
                const podatki = await odgovor.json();

                if (!odgovor.ok || podatki.napaka) {
                    throw new Error(podatki.napaka || "Neznana napaka pri shranjevanju.");
                }

                console.log("Uspešno shranjeno!", podatki.sporocilo);
                gumbShrani.textContent = "USPEŠNO SHRANJENO!";
                gumbShrani.style.backgroundColor = "#006400";

            } catch (napaka) {
                console.error("Ni uspelo shraniti:", napaka);
                gumbShrani.textContent = "NAPAKA PRI SHRANJEVANJU";
                gumbShrani.style.backgroundColor = "#D93025";
                gumbShrani.disabled = false;
            }
        });
    }

});