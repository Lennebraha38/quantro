# El entrelazamiento cuántico: el «fantasma» que inquietó a Einstein

**Emoji:** 🔗
**Tags:** quantum, entrelazamiento, física-fundamental
**Summary:** Dos partículas permanecen conectadas incluso separadas por enormes distancias. Einstein lo llamó «fantasmal acción a distancia» — tenía razón, fantasmal pero real.

## Dos partículas, un solo estado

El entrelazamiento cuántico es el fenómeno en el que los estados de dos o más partículas no pueden describirse de forma independiente. Cuando entrelazas dos partículas, sin importar la distancia entre ellas, medir una se correlaciona al instante con el estado de la otra.

El ejemplo más famoso es el estado de Bell:

`|Φ⁺⟩ = (|00⟩ + |11⟩) / √2`

Esto dice: hasta que se realiza una medición, ambas partículas podrían ser «0» o ambas «1». Pero en cuanto una se mide, la otra toma el mismo valor aunque esté a kilómetros.

## ¿Por qué estaba inquieto Einstein?

En 1935, Einstein, Podolsky y Rosen (EPR) analizaron la situación. La objeción de Einstein era simple: una propiedad de una partícula no debería cambiar al instante sin que se lo «digan» a una partícula lejana. La información no puede viajar más rápido que la luz — esa es una regla fundamental de la relatividad.

Einstein lo llamó «fantasmal acción a distancia» y sostuvo que la mecánica cuántica debía ser incompleta. En su visión, las partículas tenían «variables ocultas»: propiedades invisibles a la teoría pero en realidad predeterminadas.

## La respuesta de Bell

En 1964, el físico John Bell hizo la discusión comprobable. Una cota matemática llamada **desigualdad de Bell** distinguía dos mundos posibles:

- **Si las variables ocultas tienen razón:** la desigualdad de Bell siempre se cumple (no se puede superar la cota).
- **Si la mecánica cuántica tiene razón:** la desigualdad de Bell se viola.

Los experimentos (Aspect 1982, y miles después) demostraron que la mecánica cuántica gana: **la desigualdad de Bell se viola.** El universo no es una teoría local de variables ocultas.

## ¿Esto transmite información?

El punto crítico: el entrelazamiento no transporta información más rápido que la luz. El resultado de la medición es aleatorio — Alice no puede decir nada sobre el resultado de Bob antes de ver el suyo. La correlación obedece las leyes cuánticas; pero la información solo viaja por canales clásicos (a la velocidad de la luz). La relatividad sigue a salvo.

## ¿Para qué sirve?

- **Distribución cuántica de claves (BB84):** Si una espía (Eva) mide el canal cuántico, la medición perturba el estado y las partes detectan la escucha. El entrelazamiento hace la criptografía «físicamente segura».
- **Teleportación cuántica:** No es la materia lo que se teletransporta — es **la información**. Compartiendo la mitad de un par entrelazado con Bob, Alice puede transferir exactamente el estado de un qubit, acompañado de dos bits clásicos.
- **Computadoras cuánticas:** El entrelazamiento es la fuente de poder entre los qubits — abre un reino de cómputo que una computadora clásica jamás puede imitar.

## Pruébalo en el Lab

En el Simulador de circuitos de Quantro Lab, aplica **H** (Hadamard) a q0, luego **CNOT** a ambos, y mide. Verás resultados |00⟩ y |11⟩ casi 50 %–50 % — |01⟩ o |10⟩ casi nunca aparecen. Eso es entrelazamiento ante tus ojos.

Luego abre la herramienta BB84, activa a la espía Eva y observa cómo la clave se derrumba.

`quantro-1.vercel.app`