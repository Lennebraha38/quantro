# Cos'è la casualità vera?

**Emoji:** 🎲
**Tags:** quantum, casualità, crittografia
**Summary:** I numeri casuali prodotti dai computer sono in realtà falsi. La vera casualità proviene solo dall'incertezza quantistica della natura. Ma com'è possibile?

## La casualità è più difficile di quanto pensi

Lancia una moneta. Testa o croce? La risposta è genuinamente incerta, perché le centinaia di influenze microscopiche sulla moneta — movimento della mano, resistenza dell'aria, rugosità della superficie — sono impossibili da tenere traccia. È un'incertezza «pratica»: se conoscessimo le regole potremmo prevederla, ma non le conosciamo.

La casualità prodotta da un computer è ancora più limitata. Un computer classico è deterministico — lo stesso input produce sempre lo stesso output. I «generatori di numeri casuali» eseguono quindi un algoritmo con un certo valore di **seme** (seed). Lo stesso seme produce sempre la stessa sequenza. Queste sequenze sono progettate per sembrare casuali alla statistica, ma **sono davvero prevedibili**.

Si chiama «pseudo-casualità». Per un sistema crittografico significa che un attaccante che indovina il seme può romperlo.

## Nel mondo quantistico l'incertezza è reale

La rivoluzione della meccanica quantistica sta esattamente qui: al livello fondamentale, l'incertezza è una proprietà di **la natura stessa**, non della nostra mancanza di conoscenza.

Un elettrone è in sovrapposizione finché non viene misurato — non ha una posizione definita. Al momento della misurazione una delle probabilità «collassa». Nessuna teoria può prevedere quale risultato produrrà quel collasso. La fisica non dà una risposta esatta; dà solo probabilità.

Il principio di indeterminazione di Heisenberg lo riassume:

`Δx · Δp ≥ ℏ/2`

Più precisione hai sulla posizione di una particella, meno puoi conoscere la sua quantità di moto. Non è un difetto degli strumenti — è **la struttura dell'universo**.

## Come produce casualità vera l'ANU?

Il motore di casualità quantistica dell'Università Nazionale Australiana usa esattamente questo principio. Un fotone viene inviato su uno specchio semiriflettente; viene riflesso o trasmesso. Quale dei due risultati accade dipende dall'incertezza quantistica — non può essere previsto.

Un metodo ancora più potente è la **fluttuazione del vuoto**. Lo spazio «vuoto» non è davvero vuoto; i campi quantistici fluttuano continuamente. Misurando il rumore di quelle fluttuazioni si generano bit casuali genuini e imprevedibili.

Il Motore di Casualità Quantistica di Quantro Lab si collega alla vera sorgente quantistica dell'ANU. I numeri che vedi sullo schermo non sono quindi il prodotto di un algoritmo — sono il prodotto di **l'universo stesso**.

## Perché è importante?

La vera casualità gioca un ruolo vitale in tre campi:

- **Crittografia:** Le chiavi di cifratura devono essere imprevedibili. Una chiave pseudo-casuale è, per definizione, decifrabile.
- **Simulazione scientifica:** Le simulazioni Monte Carlo dipendono dal campionamento casuale; migliore è la sorgente, più affidabile il risultato.
- **Reti quantistiche:** La distribuzione quantistica delle chiavi rende la casualità il fondamento stesso della sicurezza.

## Provalo tu

Capire il concetto sulla carta è una cosa; vederlo è un'altra. Nel motore di casualità di Quantro Lab, seleziona la sorgente «Quantistico reale (ANU)» e genera un numero. Poi passa alla simulazione «Web Crypto» — riesci a distinguerli? I test statistici (Chi-quadro) rivelano spesso il rumore di una vera sorgente quantistica.

`quantro-1.vercel.app`