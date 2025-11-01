/* === KODA ZA MOŽGANE PISARNE: ucitelj.js === */

document.addEventListener("DOMContentLoaded", function() {

    // Preverimo, ali je brskalnik naložil "tiskalnik"
    if (!window.jspdf) {
        alert("Napaka: Tiskalnik PDF (jsPDF) se ni uspel naložiti.");
        return;
    }

    const { jsPDF } = window.jspdf; // Pripravimo "tiskalnik"

    const gumbPDF = document.getElementById("gumbPDF");
    const seznamDiv = document.getElementById("seznam-najdb");

    // Sem bomo shranili podatke, ko pridejo iz "skrinje"
    let vseNajdbe = [];

    // 1. Funkcija, ki naloži podatke iz "skrinje"
    async function naloziNajdbe() {
        try {
            // Pokličemo najino novo "strojnico za branje"
            const odgovor = await fetch("/.netlify/functions/pridobi-najdbe");
            if (!odgovor.ok) {
                const napaka = await odgovor.json();
                throw new Error(napaka.napaka || "Napaka strežnika");
            }

            vseNajdbe = await odgovor.json();

            // Počistimo sporočilo "Nalaganje..."
            seznamDiv.innerHTML = "";

            if (vseNajdbe.length === 0) {
                seznamDiv.innerHTML = "<p>Skrinja zakladov je še prazna.</p>";
                gumbPDF.disabled = true; // Onemogočimo gumb, če ni ničesar
                return;
            }

            // Prikažemo najdbe na strani
            vseNajdbe.forEach(najdba => {
                const vnosDiv = document.createElement("div");
                vnosDiv.style.borderBottom = "1px solid #ccc";
                vnosDiv.style.padding = "10px 0";
                vnosDiv.innerHTML = `
                    <h4>${najdba.ime_rastline || 'BREZ IMENA'}</h4>
                    <p style="font-size: 0.9em; text-transform: uppercase;"><em>${najdba.zgodba || 'Brez zgodbe'}</em></p>
                `;
                seznamDiv.appendChild(vnosDiv);
            });

        } catch (napaka) {
            seznamDiv.innerHTML = `<p style="color: red;">${napaka.message}</p>`;
        }
    }

    // 2. Funkcija za izdelavo PDF-ja (sproži jo gumb)
    function ustvariPDF() {
        if (vseNajdbe.length === 0) {
            alert("Skrinja je prazna, ni česa izvoziti.");
            return;
        }

        gumbPDF.textContent = "USTVARJAM PDF...";

        const doc = new jsPDF();

        // Naslov
        doc.setFontSize(20);
        doc.text("Učni List: Naše Najdbe iz Gozda", 10, 20);

        let y = 35; // Začetna pozicija (Y os)

        // Zanka čez vse najdbe
        vseNajdbe.forEach((najdba, index) => {
            // Preverimo, če imamo dovolj prostora na strani
            // (297mm je višina A4, pustimo malo roba)
            if (y > 270) { 
                doc.addPage(); // Dodaj novo stran
                y = 15; // Ponastavi pozicijo na vrh
            }

            doc.setFontSize(14);
            doc.setFont(undefined, 'bold'); // Krepko
            doc.text(`${index + 1}. ${najdba.ime_rastline}`, 10, y);

            y += 8; // Premakni se dol

            doc.setFontSize(10);
            doc.setFont(undefined, 'normal'); // Normalno

            // Razbijemo dolgo zgodbo v več vrstic, da se prilega strani
            const zgodbaVrstice = doc.splitTextToSize(najdba.zgodba, 180); // 180mm širine
            doc.text(zgodbaVrstice, 15, y); // Malo zamaknjeno

            // Izračunamo, koliko prostora smo porabili, in dodamo pavzo
            y += (zgodbaVrstice.length * 5) + 10; 
        });

        // Shrani datoteko
        doc.save("ucni-list-najdbe.pdf");
        gumbPDF.textContent = "IZVOZI UČNI LIST (PDF)";
    }

    // 3. Povežemo dogodke
    gumbPDF.addEventListener("click", ustvariPDF);

    // 4. Zaženemo nalaganje podatkov, ko se stran odpre
    naloziNajdbe();
});