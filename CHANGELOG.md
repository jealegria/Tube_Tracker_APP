# Changelog

Todos los cambios notables en este proyecto (**TubeSwipe · YouTube Packaging & A/B Testing Studio**) se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

---

## [1.4.0] - 2026-10-22

### Added
- **Simulador Smart TV — Cuadrícula de Sugeridos (Viendo un video):**
  - Implementación fiel a YouTube en Smart TV (10-ft UI) con una cuadrícula de **3 columnas por fila** debajo de los controles de reproducción.
  - **Barra de Control Remoto TV interactiva:** Permite subir y bajar fila por fila (`1. Video`, `2. Fila 1`, `3. Fila 2`, `4. Fila 3`) mostrando los 3 packs completos de la fila activa (miniatura 16:9, duración, título a 2 líneas y metadatos del canal) junto con el recorte superior de los siguientes 3 packs en el borde inferior.
  - **Selector de fila objetivo en Sugeridos:** Permite elegir en qué fila (`Fila 1`, `Fila 2` o `Fila 3`) posicionar la variación activa del usuario.
  - **Control del video de fondo en reproducción (TV):** Botón para **randomizar el video de fondo** (sin duplicarlo en la grilla de sugeridos) y botón para **dejar la pantalla en negro** detrás de la interfaz del reproductor.
- **Simulador Smart TV — Selector de fila en Homepage:**
  - Permite alternar la ubicación del pack del usuario entre **Recommended shows (Fila 1)** (pack completo con título visible) y **Continue watching (Fila 2)** (fila inferior recortada al 35% de la altura de la miniatura).

### Changed
- **Ajustes visuales en Smart TV:**
  - Unificación del marco exterior (`border-neutral-800`) y soporte de la TV con la estética de los marcos de Mobile y Tablet.
  - Eliminación de bordes blancos (`ring`) sobre las miniaturas y corrección de espaciado junto al menú lateral izquierdo en TV Homepage para evitar cortes.
  - Eliminación del evento `onWheel` / captura de teclado sobre el lienzo de la TV para no interferir con el scroll vertical de la aplicación.
  - Limpieza de textos en los selectores de vistas de TV y remoción del ícono de campana flotante en la vista de reproducción.

### Chore / Repository
- Actualización de `.gitignore` para excluir activos temporales del chat (`public/assets/aistudio/`, `.aistudio/`), cachés de Vite (`.vite/`) y logs de depuración de Firebase.

---

## [1.3.0] - 2026-10-22

### Added
- **Módulo de A/B Testing Multi-Dispositivo:**
  - Gestión de proyectos de videos numerados (`Video #1`, `Video #2`, etc.) con múltiples variaciones (`Var A`, `Var B`, `Var C`...) compuestas por miniatura local y título.
  - **Simulador 1:1 de YouTube 2026** con soporte para 4 dispositivos y sus ubicaciones reales:
    - **PC (Desktop Web):** `Homepage` (grilla de 3 columnas, corte a ~35 caract./línea) y `Sidebar (Viendo un video)` (miniatura grande de 246×138px + columna de texto angosta de ~20 caract./línea).
    - **Mobile (390px):** `Homepage`, `Sidebar (Vertical)` (con reproductor superior, botonera de acciones, tarjeta teaser de Comentarios y feed Up Next) y `Fullscreen Horizontal (Más videos)` (carrusel deslizable con el mouse mostrando 2 tarjetas completas + 2/10 de la 3ra, título a 1 línea).
    - **Tablet:** `Homepage` (grilla de 2 columnas) y `Sidebar (Viendo un video)` (vista dividida).
    - **Smart TV:** `Homepage` (carrusel horizontal deslizable con el mouse + fila inferior *Continue watching*) y `Sugeridos (Viendo un video)`.
  - **Herramientas de validación de títulos:** Contador de caracteres visibles en tiempo real según el dispositivo y vista seleccionados, alerta de truncado (`...`), botón de **Título de prueba (Debug)** y botón de limpieza rápida.
  - **Rotación de entorno:** Mezcla aleatoria de videos competidores del repositorio garantizando que el video en reproducción actual nunca se duplique en los sugeridos.

---

## [1.2.0] - 2026-10-21

### Added
- **Módulo Comparador en Vivo (YouTube Home Compare):**
  - Carga de packs propios en memoria y comparación directa dentro de un feed simulado de YouTube frente a referencias reales del repositorio filtradas por competidor, etiquetas y formato.
- **Dashboard Analítico de Datos:**
  - Métricas de rendimiento del repositorio de referencias, desglose por canales competidores, distribución por etiquetas y análisis de patrones.

---

## [1.1.0] - 2026-10-20

### Added
- **Repositorio de Referencias de Packaging (TubeSwipe):**
  - Captura rápida de videos de YouTube mediante URL/ID con extracción automática de metadatos y miniaturas en máxima resolución (`maxresdefault` / `hqdefault`).
  - Sistema de etiquetado personalizado (`TagManagerModal`), notas estratégicas, calificación por estrellas, filtrado avanzado y vista de detalle en `LightboxModal`.
  - Soporte multi-perfil con sincronización en tiempo real mediante **Firebase Firestore** y exportación/importación de respaldos JSON.
