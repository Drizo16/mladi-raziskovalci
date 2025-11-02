/* === KODA ZA MOŽGANE PISARNE: ucitelj.js (Prevedena za Vercel) === */

document.addEventListener("DOMContentLoaded", function() {

    // Naložimo "tiskalnik" (jsPDF) s spleta
    // Najprej preverimo, ali obstaja, preden ga uporabimo
    if (typeof jspdf === 'undefined') {
        console.error("Napaka: Tiskalnik PDF (jsPDF) se ni uspel naložiti.");
        // Naložimo ga ročno, če ga HTML ni
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        document.head.appendChild(script);
    }

    const gumbPDF = document.getElementById("gumbPDF");
    const seznamDiv = document.getElementById("seznam-najdb");

    let vseNajdbe = [];

    // 1. Funkcija, ki naloži podatke iz "skrinje"
    async function naloziNajdbe() {
        // Počakamo, da se tiskalnik naloži, če ga je treba
        while (typeof jspdf === 'undefined') {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        try {
            // ***************************************************************
            // TUKAJ JE POPRAVEK: Kličemo novo Vercel pot
            const odgovor = await fetch("/api/pridobi-najdbe");
            // ***************************************************************

            if (!odgovor.ok) {
                const napaka = await odgovor.json();
                throw new Error(napaka.napaka || "Napaka strežnika");
            }

            vseNajdbe = await odgovor.json();

            seznamDiv.innerHTML = "";

            if (vseNajdbe.length === 0) {
                seznamDiv.innerHTML = "<p>SKRINJA ZAKLADOV JE ŠE PRAZNA.</p>";
                gumbPDF.disabled = true;
                return;
            }

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
        if (vseNajdbe.length === 0 || typeof jspdf === 'undefined') {
            alert("Skrinja je prazna ali pa se tiskalnik še nalaga.");
            return;
        }

        const { jsPDF } = window.jspdf; // Pripravimo "tiskalnik"
        gumbPDF.textContent = "USTVARJAM PDF...";

        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text("Učni List: Naše Najdbe iz Gozda", 10, 20);

        let y = 35;

        vseNajdbe.forEach((najdba, index) => {
            if (y > 270) { 
                doc.addPage();
                y = 15;
            }

            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text(`${index + 1}. ${najdba.ime_rastline}`, 10, y);

            y += 8;

            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');

            const zgodbaVrstice = doc.splitTextToSize(najdba.zgodba, 180);
            doc.text(zgodbaVrstice, 15, y);

            y += (zgodbaVrstice.length * 5) + 10; 
        });

        doc.save("ucni-list-najdbe.pdf");
        gumbPDF.textContent = "IZVOZI UČNI LIST (PDF)";
    }

    gumbPDF.addEventListener("click", ustvariPDF);
    naloziNajdbe();
});