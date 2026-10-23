# Mobile Fullscreen Horizontal ("More" Overlay) en A/B Testing

Este cambio incorpora una tercera vista exclusiva para **Mobile** en el simulador de A/B Testing: **Fullscreen Horizontal (Overlay "More")**, simulando el momento en que el usuario mira un video con el celular en horizontal a pantalla completa y despliega el carrusel de videos sugeridos ("More videos" / "Más videos") sobre el video actual difuminado.

## User Review & Critical Decisions

> [!IMPORTANT]
> Si quieres pasar la captura de pantalla de referencia para afinar algún detalle visual exacto de tu versión de la app (posición de controles del reproductor, cantidad de tarjetas visibles en el carrusel horizontal o estilo del título), puedes adjuntarla ahora mismo en el chat o aprobar el plan para implementarlo directamente.

- **Vista directa con el overlay abierto**: Confirmado. Al elegir `Mobile → 3. Fullscreen Horizontal (More)`, el simulador mostrará directamente el reproductor horizontal con el fondo oscurecido/difuminado y el carrusel de videos sugeridos superpuesto.
- **Exclusivo de Mobile como 3ra vista**: Confirmado. El selector `2. Vista en Mobile` mostrará 3 opciones (`Homepage`, `Sidebar / Up Next`, `Fullscreen Horizontal (More)`). Si el usuario cambia a otro dispositivo (PC, Tablet, TV) mientras estaba en `fullscreen`, volverá automáticamente a `sidebar` o `home`.

## 1. Overview & Core Concept

- **Qué hace**: Permite previsualizar cómo compiten la miniatura y el título de cada variación A/B dentro del overlay horizontal de sugerencias que aparece sobre el reproductor en pantalla completa de YouTube Mobile.
- **Público objetivo**: Creadores y estrategas de contenido en YouTube que evalúan el impacto visual y el truncado de títulos en todos los contextos reales de consumo móvil.
- **Valor principal**: Garantiza que tu variación aparezca siempre visible en el carrusel horizontal sobre el video difuminado, respetando las proporciones y el límite de caracteres de esa vista.

## 2. User Experience & Visual Design

- **Flujo de Usuario**:
  1. En `1. Dispositivo`, el usuario selecciona **Mobile**.
  2. En `2. Vista en Mobile`, ahora dispone de tres botones:
     - `Homepage`
     - `Sidebar / Up Next (Viendo un video)`
     - `Fullscreen Horizontal (Overlay More)`
  3. Al activar `Fullscreen Horizontal (More)`:
     - El marco del teléfono rota a formato horizontal (`16:9` widescreen, `~780×390px` con bordes redondeados de smartphone).
     - En el fondo se muestra el fotograma del video en reproducción con desenfoque y capa oscura (`backdrop-blur` + `bg-black/65`).
     - En la parte superior se muestra el encabezado del reproductor fullscreen (título del video actual, controles superiores de reproductor y botón de cierre/minimizar).
     - En la franja central/inferior aparece el carrusel horizontal de tarjetas sugeridas (**More videos / Más videos**) donde el pack del usuario tiene **aparición 100% garantizada** en las primeras posiciones visibles.
- **Identidad Visual y Tipografía**:
  - Superficie de overlay oscura translúcida (`bg-black/70 backdrop-blur-md`) independientemente de si la app está en modo claro u oscuro, tal como funciona el reproductor fullscreen real de YouTube Mobile.
  - Tipografía compacta con `line-clamp-2` y números tabulares (`tabular-nums`) para duraciones, vistas y barra de tiempo del reproductor.

## 3. Key Product Decisions & Trade-Offs

- **Decisión 1: Aparición garantizada en el carrusel horizontal**
  - *Enfoque elegido*: Posicionar siempre la variación activa en una de las primeras tarjetas visibles del carrusel horizontal (índices `0` o `1`, alternando al presionar **Rotar entorno**).
  - *Por qué*: En el overlay horizontal caben entre 3 y 4 tarjetas simultáneas en pantalla; fijar el rango a las primeras posiciones evita que el usuario tenga que mezclar varias veces para ver su pack.
- **Decisión 2: Normalización automática al cambiar de dispositivo**
  - *Enfoque elegido*: Si el usuario tiene activa la vista `fullscreen` en Mobile y cambia el dispositivo a `PC`, `Tablet` o `TV`, la ubicación pasa automáticamente a `sidebar` para mantener las 2 vistas estándar en los demás dispositivos.
  - *Por qué*: Cumple con la decisión de mantener esta 3ra vista exclusivamente dentro de Mobile sin agregar opciones innecesarias en otros dispositivos.

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ABTestingModule (State)                         │
│  • device: 'pc' | 'mobile' | 'tablet' | 'tv'                            │
│  • placement: 'home' | 'sidebar' | 'fullscreen'                         │
│  • handleDeviceChange(): resets 'fullscreen' -> 'sidebar' if non-mobile │
│  • shuffleContext(): guarantees visible index (0..1) on mobile views    │
└───────────────────┬─────────────────────────────────┬───────────────────┘
                    │                                 │
                    ▼                                 ▼
┌───────────────────────────────────┐ ┌───────────────────────────────────┐
│         SimulatorToolbar          │ │      YouTubeDeviceSimulator       │
│  1. Dispositivo (PC/Mob/Tab/TV)   │ │  • Mobile Home (Vertical 390px)   │
│  2. Vista contextual:             │ │  • Mobile Sidebar (Vertical 390px)│
│     - PC/Tab/TV: 2 opciones       │ │  • Mobile Fullscreen (Horizontal  │
│     - Mobile: 3 opciones (+More)  │ │    Landscape + Blurred Video +    │
│  3. Specs de corte de título      │ │    "More" Suggested Cards Row)    │
└───────────────────────────────────┘ └───────────────────────────────────┘
```

- **Modelo de Datos y Especificaciones (`YOUTUBE_SPECS`)**:
  - Se amplía `ABPlacementMode` a `'home' | 'sidebar' | 'fullscreen'`.
  - Se definen las métricas de truncado para `fullscreen` en Mobile (`~26 caract./línea`, máx `2 líneas`, `~52 caract. visibles`) para que el contador superior de `VariationsBar` y la barra de especificaciones informen con precisión si el título se cortará en el carrusel horizontal.
- **Mapeo de Interacciones**:
  - Cambiar a `Fullscreen Horizontal (More)` actualiza inmediatamente el lienzo del simulador y el validador de longitud de título en `VariationsBar`.
  - El botón **Rotar entorno** mezcla los videos competidores del repositorio, actualiza el video de fondo difuminado y alterna la posición garantizada de la variación activa dentro del carrusel horizontal.
