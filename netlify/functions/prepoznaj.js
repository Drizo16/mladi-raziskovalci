/* To je najina "Strojnica" - Netlify Funkcija */

/* Ta vrstica je nujna, da lahko kličemo PlantNet (ali druge strežnike) */
const fetch = require('node-fetch');

/* Ta 'handler' je glavno "srce" najine strojnice. */
exports.handler = async function(event, context) {
    
    /* 1. KORAK: Sprejmi podatke (sliko) od telefona */
    
    /* Najprej preverimo, ali je telefon sploh poslal kaj (zato 'POST') */
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405, // 405 pomeni 'Metoda ni dovoljena'
            body: JSON.stringify({ napaka: 'Dovoljena je samo metoda POST.' })
        };
    }

    /* Podatki, ki jih pošlje telefon, so v 'event.body' */
    /* Ti podatki so kodirani, zato jih moramo najprej "razumeti" */
    
    /* TODO (Naredila bova kasneje): 
       Dejansko moramo tukaj sprejeti sliko. Slike so malo bolj zakomplicirane,
       zato bova za PRVI TEST samo sprejela navadno besedo.
       Tako bova preverila, ali "strojnica" sploh dela.
    */

    /* ZA ZDAJ, SAMO ZA TEST: Recimo, da nam telefon pošlje ime */
    let prejetoIme;
    try {
        prejetoIme = JSON.parse(event.body).ime;
    } catch (e) {
        prejetoIme = "Neznanec";
    }

    console.log("Strojnica je prejela ime:", prejetoIme);

    /* 2. KORAK: Pokliči "Glavnega botanika" (PlantNet) */
    
    /* TODO (Naredila bova kasneje): 
       Tukaj pride koda, ki pošlje sliko PlantNet-u. 
       Za zdaj bova ta korak preskočila in se pretvarjala, da smo dobili odgovor.
    */
    const imeDrevesa = "HRAST (TEST)"; // To je lažen odgovor od PlantNeta

    /* 3. KORAK: Pokliči mene (UI), da ustvarim zgodbo */
    
    /* TODO (Naredila bova kasneje): 
       Tukaj pride koda, ki pokliče UI (mene), da zgeneriram zgodbo.
       Za zdaj bova zgodbo napisala kar ročno.
    */
    const zgodba = `POZDRAVLJEN, ${prejetoIme.toUpperCase()}! JAZ SEM ${imeDrevesa}. MOJI PLODOVI SO ŽELODI IN JEDO JIH VEVERICE. ALI VEŠ, DA LAHKO ŽIVIM TUDI 1000 LET? (TO JE TESTNO SPOROČILO IZ NAJINE NOVE STROJNICE!)`;

    /* 4. KORAK: Pošlji končni paket (ime, zgodba) nazaj na telefon */
    
    /* Telefonu pošljemo nazaj lep JSON paket z vsemi podatki */
    return {
        statusCode: 200, // 200 pomeni 'Vse je v redu!'
        body: JSON.stringify({
            drevo: imeDrevesa,
            zgodba: zgodba,
            zanimivost: "Veverice me obožujejo! (Test)"
        })
    };
};