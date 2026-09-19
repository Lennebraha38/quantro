# L'intrication quantique : le « fantôme » qui troublait Einstein

**Emoji:** 🔗
**Tags:** quantum, intrication, physique-fondamentale
**Summary:** Deux particules restent liées même séparées par de vastes distances. Einstein l'appelait « action fantôme à distance » — il avait raison, fantomatique mais réel.

## Deux particules, un seul état

L'intrication quantique est le phénomène dans lequel les états de deux ou plusieurs particules ne peuvent pas être décrits indépendamment. Lorsque vous intriquez deux particules, quelle que soit la distance qui les sépare, mesurer l'une corrèle instantanément avec l'état de l'autre.

L'exemple le plus célèbre est l'état de Bell :

`|Φ⁺⟩ = (|00⟩ + |11⟩) / √2`

Cela signifie : jusqu'à la mesure, les deux particules peuvent être « 0 » ou les deux « 1 ». Mais une fois l'une mesurée, l'autre prend la même valeur, même à des kilomètres.

## Pourquoi Einstein était-il troublé ?

En 1935, Einstein, Podolsky et Rosen (EPR) ont analysé la situation. L'objection d'Einstein était simple : la propriété d'une particule ne devrait pas changer instantanément sans être « prévenue » par une particule distante. L'information ne peut pas voyager plus vite que la lumière — c'est une règle fondamentale de la relativité.

Einstein appela cela « action fantôme à distance » et soutint que la mécanique quantique devait être incomplète. Selon lui, les particules avaient des « variables cachées » — des propriétés invisibles à la théorie mais en réalité prédéterminées.

## La réponse de Bell

En 1964, le physicien John Bell rendit le débat testable. Une borne mathématique appelée **inégalité de Bell** distinguait deux mondes possibles :

- **Si les variables cachées ont raison :** l'inégalité de Bell est toujours respectée (la borne ne peut pas être dépassée).
- **Si la mécanique quantique a raison :** l'inégalité de Bell est violée.

Les tests expérimentaux (Aspect 1982, puis des milliers depuis) ont montré que la mécanique quantique gagne : **l'inégalité de Bell est violée.** L'univers n'est pas une théorie locale à variables cachées.

## Transmet-on de l'information ?

Le point crucial : l'intrication ne transporte pas d'information plus vite que la lumière. Le résultat de mesure est aléatoire — Alice ne peut rien dire du résultat de Bob avant de voir le sien. La corrélation obéit aux lois quantiques ; mais l'information ne circule que par des canaux classiques (à la vitesse de la lumière). La relativité reste sauve.

## À quoi cela sert-il ?

- **Distribution quantique de clés (BB84) :** Si une espionne (Ève) mesure le canal quantique, la mesure perturbe l'état et les parties détectent l'écoute. L'intrication rend la cryptographie « physiquement sûre ».
- **Téléportation quantique :** Ce n'est pas la matière qui est téléportée — c'est **l'information**. Partageant la moitié d'une paire intriquée avec Bob, Alice peut transférer exactement l'état d'un qubit, accompagné de deux bits classiques.
- **Ordinateurs quantiques :** L'intrication est la source de puissance entre les qubits — elle ouvre un domaine de calcul qu'un ordinateur classique ne peut jamais imiter.

## Essayez dans le Lab

Dans le Simulateur de circuits de Quantro Lab, appliquez **H** (Hadamard) à q0, puis **CNOT** aux deux, et mesurez. Vous verrez des résultats |00⟩ et |11⟩ à presque 50 %–50 % — |01⟩ ou |10⟩ n'apparaît presque jamais. C'est l'intrication sous vos yeux.

Ensuite, ouvrez l'outil BB84, activez l'espionne Ève et regardez comment la clé s'effondre.

`quantro-1.vercel.app`