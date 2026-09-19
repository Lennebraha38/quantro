# L'entanglement quantistico: il «fantasma» che turbava Einstein

**Emoji:** 🔗
**Tags:** quantum, entanglement, fisica-fondamentale
**Summary:** Due particelle restano legate anche separate da immense distanze. Einstein lo chiamava «azione spettrale a distanza» — aveva ragione, spettrale ma reale.

## Due particelle, un solo stato

L'entanglement quantistico è il fenomeno per cui gli stati di due o più particelle non possono essere descritti indipendentemente. Quando si entrappola due particelle, qualunque sia la distanza tra loro, misurare l'una si correla istantaneamente con lo stato dell'altra.

L'esempio più famoso è lo stato di Bell:

`|Φ⁺⟩ = (|00⟩ + |11⟩) / √2`

Questo dice: fino alla misura, entrambe le particelle potrebbero essere «0» o entrambe «1». Ma una volta misurata l'una, l'altra assume lo stesso valore anche se è a chilometri di distanza.

## Perché Einstein era turbato?

Nel 1935, Einstein, Podolsky e Rosen (EPR) analizzarono la situazione. L'obiezione di Einstein era semplice: una proprietà di una particella non dovrebbe cambiare all'istante senza che «lo si dica» a una particella lontana. L'informazione non può viaggiare più veloce della luce — è una regola fondamentale della relatività.

Einstein lo chiamò «azione spettrale a distanza» e sostenne che la meccanica quantistica doveva essere incompleta. Secondo lui, le particelle avevano «variabili nascoste»: proprietà invisibili alla teoria ma in realtà predeterminate.

## La risposta di Bell

Nel 1964, il fisico John Bell rese il dibattito testabile. Un limite matematico chiamato **disuguaglianza di Bell** distingueva due mondi possibili:

- **Se le variabili nascoste hanno ragione:** la disuguaglianza di Bell vale sempre (il limite non può essere superato).
- **Se la meccanica quantistica ha ragione:** la disuguaglianza di Bell è violata.

I test sperimentali (Aspect 1982, e migliaia dopo) hanno mostrato che la meccanica quantistica vince: **la disuguaglianza di Bell è violata.** L'universo non è una teoria locale a variabili nascoste.

## Trasmette informazione?

Il punto critico: l'entanglement non trasporta informazione più veloce della luce. Il risultato della misura è casuale — Alice non può dire nulla del risultato di Bob prima di vedere il suo. La correlazione obbedisce alle leggi quantistiche; ma l'informazione viaggia solo attraverso canali classici (alla velocità della luce). La relatività resta salva.

## A cosa serve?

- **Distribuzione quantistica di chiavi (BB84):** Se una spia (Eve) misura il canale quantistico, la misura disturba lo stato e le parti rilevano l'ascolto. L'entanglement rende la crittografia «fisicamente sicura».
- **Teletrasporto quantistico:** Non è la materia a essere teletrasportata — è **l'informazione**. Condividendo con Bob metà di una coppia entangled, Alice può trasferire esattamente lo stato di un qubit, accompagnato da due bit classici.
- **Computer quantistici:** L'entanglement è la fonte di potenza tra i qubit — apre un regno di calcolo che un computer classico non può mai imitare.

## Provalo nel Lab

Nel Simulatore di circuiti di Quantro Lab, applica **H** (Hadamard) a q0, poi **CNOT** a entrambi, e misura. Vedrai risultati |00⟩ e |11⟩ quasi al 50%–50% — |01⟩ o |10⟩ quasi mai. Questo è l'entanglement davanti ai tuoi occhi.

Poi apri lo strumento BB84, attiva la spia Eve e osserva come la chiave crolla.

`quantro-1.vercel.app`