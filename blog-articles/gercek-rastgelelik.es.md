# ¿Qué es la aleatoriedad real?

**Emoji:** 🎲
**Tags:** quantum, aleatoriedad, criptografía
**Summary:** Los números aleatorios que generan las computadoras son en realidad falsos. La aleatoriedad real solo proviene de la incertidumbre cuántica de la naturaleza. Pero, ¿cómo es posible?

## La aleatoriedad es más difícil de lo que creemos

Lanza una moneda. ¿Cara o cruz? La respuesta es genuinamente incierta, porque los cientos de influencias microscópicas sobre la moneda — movimiento de la mano, resistencia del aire, rugosidad de la superficie — son imposibles de rastrear. Es una incertidumbre «práctica»: si conociéramos las reglas podríamos predecirlo, pero no las conocemos.

La aleatoriedad que produce una computadora es aún más limitada. Una computadora clásica es determinista — la misma entrada siempre produce la misma salida. Por eso los «generadores de números aleatorios» ejecutan un algoritmo con un valor de **semilla** (seed) determinado. La misma semilla siempre produce la misma secuencia. Estas secuencias están diseñadas para parecer aleatorias para la estadística, pero **son realmente predecibles**.

Eso se llama «pseudoaleatoriedad». Para un sistema de criptografía, significa que un atacante que adivine la semilla puede romperlo.

## En el mundo cuántico, la incertidumbre es real

La revolución de la mecánica cuántica reside exactamente aquí: en el nivel fundamental, la incertidumbre es una propiedad de **la propia naturaleza**, no de nuestra falta de conocimiento.

Un electrón está en superposición hasta que se mide — no tiene una posición definida. En el momento de la medición, una de las probabilidades «colapsa». Ninguna teoría puede predecir qué resultado producirá ese colapso. La física no da una respuesta exacta; solo da probabilidades.

El principio de incertidumbre de Heisenberg lo resume:

`Δx · Δp ≥ ℏ/2`

Cuanto más exactamente conoces la posición de una partícula, menos puedes conocer su momento. No es una falla de los instrumentos — es **la estructura del universo**.

## ¿Cómo produce aleatoriedad real la ANU?

El motor de aleatoriedad cuántica de la Universidad Nacional de Australia usa exactamente este principio. Un fotón se envía contra un espejo semirreflejante; se refleja o se transmite. Cuál de los dos resultados ocurre depende de la incertidumbre cuántica — no se puede predecir.

Un método aún más potente es la **fluctuación del vacío**. El espacio «vacío» no está realmente vacío; los campos cuánticos fluctúan constantemente. Midiendo el ruido de esas fluctuaciones se generan bits aleatorios genuinos e impredecibles.

El Motor de Aleatoriedad Cuántica de Quantro Lab se conecta a la verdadera fuente cuántica de la ANU. Así, los números que ves en pantalla no son producto de un algoritmo — son producto de **el propio universo**.

## ¿Por qué importa?

La aleatoriedad real juega un papel vital en tres campos:

- **Criptografía:** Las claves de cifrado deben ser impredecibles. Una clave pseudoaleatoria es, por definición, descifrable.
- **Simulación científica:** Las simulaciones de Monte Carlo dependen del muestreo aleatorio; cuanto mejor es la fuente, más fiable el resultado.
- **Redes cuánticas:** La distribución cuántica de claves convierte la aleatoriedad en la base misma de la seguridad.

## Pruébalo tú mismo

Entender el concepto sobre el papel es una cosa; verlo, otra. En el motor de aleatoriedad de Quantro Lab, selecciona la fuente «Cuántico real (ANU)» y genera un número. Luego pasa a la simulación «Web Crypto» — ¿puedes distinguirlos? Las pruebas estadísticas (Chi-cuadrado) suelen revelar el ruido de una auténtica fuente cuántica.

`quantro-1.vercel.app`