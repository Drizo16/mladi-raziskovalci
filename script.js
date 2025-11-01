/* Počakamo, da se celotna stran (HTML) naloži */
document.addEventListener("DOMContentLoaded", function() {

    /* Najprej v kodi najdemo najin zeleni gumb po njegovem ID-ju */
    const gumbKamera = document.getElementById("gumbKamera");

    /* Ustvarimo skriti element za nalaganje datotek (slik) */
    const nalaganjeSlike = document.createElement("input");
    nalaganjeSlike.type = "file";      // Rečemo, da je to za datoteke
    nalaganjeSlike.accept = "image/*"; // Rečemo, da sprejme samo slike
    nalaganjeSlike.capture = "environment"; // To je trik: telefonu reče, naj raje uporabi zadnjo kamero

    /* Zdaj "poslušamo", ali bo kdo kliknil na najin zeleni gumb */
    gumbKamera.addEventListener("click", function() {
        /* Ko nekdo klikne zeleni gumb, mi v ozadju "kliknemo" tisti skriti gumb za nalaganje */
        console.log("Kliknjen gumb za kamero!"); // To je sporočilo za naju, da preveriva, ali dela
        nalaganjeSlike.click();
    });

    /* Ko bo uporabnik POSNEL sliko in jo potrdil, se zgodi to: */
    nalaganjeSlike.addEventListener("change", function(dogodek) {
        /* Preverimo, ali je uporabnik res izbral sliko */
        if (dogodek.target.files && dogodek.target.files[0]) {
            const slika = dogodek.target.files[0];
            
            /* TO JE ZELO POMEMBNO - TUKAJ SE ZAČNE ČAROVNIJA */
            console.log("Uporabnik je posnel sliko:", slika.name);
            
            /* NASLEDNJI KORAK: 
               Tukaj bova dodala kodo, ki to 'sliko' pošlje 
               našim "možganom" na strežniku, ti pa jo pošljejo PlantNet-u. 
               Za zdaj jo samo "ujamemo".
            */

            /* Po tem, ko sliko dobimo, bi morali uporabnika preusmeriti na stran z rezultati */
            /* Za zdaj: samo izpišimo sporočilo. */
            alert("SLIKA USPEŠNO POSNETA! Pripravljam pošiljanje v PlantNet...");
            
            /* TODO: Preusmeri na stran z rezultati */
        }
    });

});