# Tube Stacker (TubeSwipe) — Documentación Técnica y Funcional Completa (Backup Blueprint)

Este documento describe de forma exacta, estructurada y en texto simple **todas las funciones, componentes, flujos de datos, fórmulas, reglas de negocio y medidas de interfaz** de la aplicación **Tube Stacker** (`TubeSwipe`). Está diseñado como plano maestro de respaldo para poder reconstruir la aplicación de forma 1:1 en cualquier momento.

---

## 1. Propósito General de la Aplicación

**Tube Stacker** es una suite web privada de análisis, almacenamiento, comparación y simulación multi-dispositivo de **packagings de YouTube** (combinación de miniatura + título).

La aplicación se divide en **6 módulos principales**:
1. **Repositorio**: Biblioteca ("Swipe File") de videos de referencia de YouTube capturados por URL/ID, organizados por categorías, tags, favoritos y notas estratégicas.
2. **Mis Videos**: Almacenamiento en la nube de hasta 10 carpetas de videos propios por perfil, cada una con hasta 5 variaciones de pack (miniatura optimizada en 16:9 + título).
3. **Comparar**: Simulador de feed de inicio de YouTube para mezclar múltiples packs propios (desde "Mis Videos" o subidos en memoria RAM) contra hasta 20 videos competidores filtrados del repositorio.
4. **Testing**: Laboratorio y simulador 1:1 de la interfaz oficial de YouTube 2026 en **4 dispositivos (`PC`, `Mobile`, `Tablet`, `Smart TV`)** y sus distintas vistas (`Homepage`, `Sidebar / Sugeridos`, `Fullscreen Horizontal`), con validación de truncado de caracteres en tiempo real.
5. **Datos**: Panel analítico con métricas del repositorio, exportación/importación en JSON y CSV, copiado de URLs y descarga masiva de miniaturas en alta resolución.
6. **Ajustes**: Configuración por perfil del nombre del canal por defecto utilizado en los simuladores.

---

## 2. Stack Tecnológico y Estructura de Archivos

### Stack
- **Frontend**: React 19 + TypeScript + Vite.
- **Estilos**: Tailwind CSS v4 (`@import "tailwindcss";` en `src/index.css`).
- **Iconografía**: `lucide-react`.
- **Backend / Persistencia**: Firebase Authentication (Google Sign-In) + Cloud Firestore (sincronización en tiempo real con `onSnapshot`) + respaldo secundario automático en `localStorage`.

### Árbol de Archivos Principal
- `src/types.ts`: Definición de tipos globales (`PackagingItem`, `UserVideoFolder`, `UserVideoPack`, `CategoryFilter`, `SortOrder`, `ActiveModule`).
- `src/firebase.ts`: Inicialización de Firebase, control de autorización por hash SHA-256, perfiles (`johnny` y `guido`) y funciones CRUD/suscripción de Firestore.
- `src/hooks/useProfileWorkspace.ts`: Hook central de estado que coordina autenticación, perfil activo, sincronización con Firestore, caché en `localStorage` y acciones CRUD.
- `src/App.tsx`: Layout principal, banners de estado/perfil cruzado, filtrado del repositorio y enrutamiento entre los 6 módulos.
- `src/components/`:
  - `AccessGate.tsx`: Pantalla de bloqueo y login privado con Google.
  - `Navbar.tsx`: Barra lateral izquierda colapsable en hover.
  - `FilterToolbar.tsx`: Barra de filtros, búsqueda, ordenamiento y controles de vista del Repositorio.
  - `PackagingCard.tsx`: Tarjeta individual de video en el Repositorio.
  - `PackagingCaptureForm.tsx`: Modal para agregar un nuevo video de YouTube al Repositorio.
  - `LightboxModal.tsx`: Visor expandido de miniatura con edición de notas, tags, categoría y navegación por teclado.
  - `TagManagerModal.tsx`: Modal CRUD para crear, renombrar y eliminar tags.
  - `MyVideosModule.tsx` y `src/components/misvideos/`: Gestión de carpetas de videos propios (`VideoFolderCard`, `VideoFolderDetailView`, `PackSlotCard`).
  - `PackagingPreviewModule.tsx` y `src/components/compare/`: Módulo Comparar (`UserPacksUploader`, `CloudVideoPackPicker`, `QuickRamPackUploader`, `CompetitorFilterPanel`, `YouTubeHomeCompareView`, `types.ts`).
  - `ABTestingModule.tsx` (`TestingModule`) y `src/components/abtesting/`: Módulo Testing (`VariationsBar`, `ABCloudPackSelector`, `ABQuickTestBar`, `SimulatorToolbar`, `YouTubeDeviceSimulator`, `ProjectListGrid`, `types.ts`).
  - `DataDashboardView.tsx`: Módulo Datos y exportación.
  - `SettingsView.tsx`: Módulo Ajustes del perfil.
- `src/utils/`:
  - `youtube.ts`: Extracción de ID de YouTube, consulta oEmbed/noembed, URLs de miniaturas y datos de ejemplo.
  - `imageCompression.ts`: Compresor de imágenes en cliente mediante HTML5 Canvas (1280×720 WebP/JPEG).
  - `exportData.ts`: Generadores de archivos JSON y CSV enriquecidos.
  - `shareUrl.ts`: Codificador y decodificador de colecciones compartidas mediante hash Base64 en la URL (`#share=...`).

---

## 3. Autenticación, Seguridad y Multi-Perfil

### Control de Acceso Privado (`AccessGate.tsx` y `firebase.ts`)
- La app requiere inicio de sesión con Google (`signInWithPopup` con `prompt: 'select_account'`).
- Solo **2 cuentas de correo** tienen acceso autorizado:
  1. Cuenta de **Johnny** (hash SHA-256: `d858133616da01ee7f068635a56d58372025cf99cc57335976fce329b8e712b6`).
  2. Cuenta de **Guido** (hash SHA-256: `42b24ebfc3d601a578840d3ed35abc5680884eacf6f41d3c6a0f22baa182be87`).
- El cliente calcula el hash SHA-256 del email en minúsculas (`sha256Ascii`) para no exponer correos en texto plano en el bundle de JavaScript, y las reglas de Firestore (`firestore.rules`) validan `request.auth.token.email` y `email_verified == true` en el servidor.
- **Estados de `AccessGate`**:
  1. Cargando autenticación: Spinner con ícono de YouTube y texto `"Verificando acceso privado..."`.
  2. No autenticado: Tarjeta centrada con ícono de candado, insignia `"Acceso Privado"`, título `"Tube Stacker"` y botón `"Ingresar con Google"`.
  3. Autenticado pero no autorizado: Tarjeta roja `"Acceso Restringido"` con botón `"Cambiar de cuenta"` (`logoutUser`).

### Sistema de Perfiles (`johnny` y `guido`)
- Existen dos espacios de trabajo independientes (`ProfileId = 'johnny' | 'guido'`):
  - `johnny`: Nombre `"Johnny"`, color de acento rojo (`bg-red-600`), canal por defecto inicial `"Johnny BT"`.
  - `guido`: Nombre `"Guido"`, color de acento azul (`bg-blue-600`), canal por defecto inicial `""`.
- Al iniciar sesión, se selecciona automáticamente el perfil propio según el correo (`getDefaultProfileForEmail`).
- Cualquier usuario autorizado puede alternar entre el perfil de **Johnny** y el de **Guido** desde la barra lateral.
- Si el usuario está viendo el perfil del otro integrante (`activeProfile !== ownProfile`), se muestra un banner superior informativo: `"Viendo el perfil de [Nombre]"` con un botón rápido `"Volver a [Tu Perfil]"`.

---

## 4. Estructura de Datos y Reglas de Firestore

### Modelos de Datos (`src/types.ts`)

1. **`PackagingItem`** (Referencia guardada en el Repositorio):
   - `id`: `string` (1..128 caract.)
   - `videoId`: `string` (ID de YouTube de 11 caract.)
   - `url`: `string` (`https://www.youtube.com/watch?v={videoId}`, máx 500 caract.)
   - `title`: `string` (máx 500 caract.)
   - `channelTitle?`: `string` (máx 200 caract.)
   - `category`: `string` (máx 100 caract.)
   - `tags?`: `string[]` (máx 50 tags, cada uno máx 100 caract.)
   - `notes?`: `string` (máx 2000 caract.)
   - `createdAt`: `number` (timestamp en ms)
   - `favorite?`: `boolean`

2. **`UserVideoFolder`** (Carpeta de video propio en "Mis Videos"):
   - `id`: `string` (`myvid-{timestamp}-{random}`)
   - `profileId`: `'johnny' | 'guido'`
   - `name`: `string` (máx 200 caract.)
   - `createdAt`: `number`
   - `updatedAt`: `number`

3. **`UserVideoPack`** (Variación de miniatura + título dentro de una carpeta de "Mis Videos"):
   - `id`: `string` (`mypack-{timestamp}-{random}`)
   - `profileId`: `'johnny' | 'guido'`
   - `videoId`: `string` (ID de la carpeta `UserVideoFolder` padre)
   - `title`: `string` (1..500 caract.)
   - `thumbnailUrl`: `string` (Data URL Base64 WebP/JPEG comprimida, máx 450,000 caract.)
   - `order`: `number` (entero de `0` a `4`, correspondiente a los slots Pack 1 (A) a Pack 5 (E))
   - `createdAt`: `number`
   - `updatedAt`: `number`

### Rutas en Firestore (`firestore.rules`)
- `profiles/{profileId}/packagings/{packagingId}`: Documentos `PackagingItem`.
- `profiles/{profileId}/config/preferences`: Documento único con `{ profileId, userId, categories: string[], tags: string[], defaultChannelName?: string }`.
- `profiles/{profileId}/myVideos/{videoId}`: Documentos `UserVideoFolder` (máximo 10 carpetas por perfil en la UI).
- `profiles/{profileId}/myVideoPacks/{packId}`: Documentos `UserVideoPack` (máximo 5 packs por carpeta, `order` 0..4).

### Claves de Respaldo en `localStorage`
- Tema visual: `tube_stacker_theme` (`'dark' | 'light'`).
- Packagings por perfil: `tubeswipe_packagings_{profileId}_v1`.
- Categorías por perfil: `tubeswipe_categories_{profileId}_v1`.
- Tags por perfil: `tubeswipe_tags_{profileId}_v1`.
- Canal por defecto: `tubeswipe_channel_{profileId}_v1`.

---

## 5. Interfaz Global y Barra de Navegación (`Navbar.tsx`)

### Tema Visual Global
- **Modo Oscuro (`dark`, por defecto)**: Fondo general `#0f0f0f`, tarjetas `bg-neutral-900/50`, bordes `border-neutral-800/80`, texto principal `text-neutral-100`.
- **Modo Claro (`light`)**: Fondo general `#f8f9fa`, tarjetas `bg-white`, bordes `border-neutral-200`, texto principal `text-neutral-900`.
- Contenedor principal (`main`): Padding izquierdo fijo de `64px` (`pl-16`) para dejar espacio al menú lateral colapsado, ancho máximo centrado de `1600px` (`max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6`).

### Barra Lateral Izquierda (`Navbar`)
- Posición fija (`fixed top-0 left-0 bottom-0 z-40`).
- **Ancho colapsado**: `64px` (`w-16`), muestra únicamente los íconos centrados.
- **Ancho expandido (al pasar el mouse `onMouseEnter`)**: `256px` (`w-64`) con sombra lateral pronunciada y un backdrop oscuro translúcido sobre el resto de la pantalla (`bg-black/35 z-30`).
- **Secciones del Navbar**:
  1. **Logo / Marca superior**: Ícono rojo de YouTube (`32×32px`, `w-8 h-8 rounded-lg bg-red-600`) + texto `"Tube Stacker"` (al hacer clic lleva a `Repositorio`).
  2. **Navegación Principal (6 pestañas)**:
     - `Repositorio` (`id: 'repositorio'`, ícono `LayoutGrid`)
     - `Mis Videos` (`id: 'misvideos'`, ícono `FolderKanban`)
     - `Comparar` (`id: 'preview'`, ícono `Tv`)
     - `Testing` (`id: 'testing'`, ícono `FlaskConical`)
     - `Datos` (`id: 'datos'`, ícono `Database`)
     - `Ajustes` (`id: 'settings'`, ícono `Settings`)
     - El ítem activo resalta el ícono en rojo (`text-red-500`) y el fondo en `bg-neutral-800/90` (oscuro) o `bg-neutral-100` (claro).
  3. **Selector de Perfil Activo**: Botones para `Johnny` (inicial `J` sobre rojo cuando está activo) y `Guido` (inicial `G` sobre azul cuando está activo), indicando `"tú"` junto al perfil propio del usuario logueado.
  4. **Pie de barra lateral**:
     - Botón para alternar `Modo claro` / `Modo oscuro` (ícono `Sun` ámbar / `Moon`).
     - Avatar de la cuenta de Google (`32×32px`), nombre, email y botón `Cerrar sesión` (`LogOut`).

---

## 6. Especificación Detallada por Módulo

---

### MÓDULO 1: Repositorio (`Repositorio`)

#### 6.1.1. Captura de Packagings (`PackagingCaptureForm.tsx` y `utils/youtube.ts`)
- Se abre desde el botón rojo `"Agregar Pack"` en la barra de herramientas.
- **Extracción de ID (`extractYouTubeId`)**: Acepta un ID directo de 11 caracteres (`^[a-zA-Z0-9_-]{11}$`) o cualquier variante de URL de YouTube (`youtube.com/watch?v=`, `youtu.be/`, `youtube.com/shorts/`, `youtube.com/live/`, `youtube.com/embed/`).
- **Prevención de duplicados**: Verifica si `videoId` ya existe en el perfil activo antes de guardar.
- **Obtención automática de Título y Canal (`fetchYouTubeInfo`)**:
  1. Consulta `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={videoId}&format=json`.
  2. Si falla, hace fallback a `https://noembed.com/embed?url=...`.
  3. Si ambos fallan, asigna `"Video de YouTube ({videoId})"` y `"Canal de YouTube"`.
- **Campos del formulario**:
  - Input de URL con botón `"Pegar"` (lee `navigator.clipboard.readText()`) y botón `"Limpiar"`.
  - Selector de Categoría (botones tipo píldora).
  - Selector múltiple de Tags + botón `"+ Crear tag"` in-situ + enlace a `"Gestionar tags"`.
  - Campo de texto opcional para **Nota** (por qué llamó la atención la miniatura/título).

#### 6.1.2. Barra de Filtros y Controles de Vista (`FilterToolbar.tsx`)
- **Fila 1**:
  - **Filtro de Categorías**: Botón `"Todas"` + botones por cada categoría (`Ideas` y `Formatos` vienen por defecto y no se pueden borrar; las categorías creadas por el usuario muestran una `X` al hacer hover para eliminarlas y reasignar sus videos a otra categoría). Botón `"+ Categoría"` para crear nuevas categorías en línea.
  - **Buscador (`Buscar...`)**: Filtra en tiempo real por coincidencias en `title`, `channelTitle`, `notes` o `tags`.
  - **Botón `Favoritos`**: Filtra solo los videos marcados con estrella (`favorite === true`).
  - **Selector de Orden (`SortOrder`)**: `Más recientes` (`newest`), `Más antiguos` (`oldest`), `A - Z` (`alpha`).
  - **Toggle `Títulos`** (`showTitles`, desactivado por defecto): Muestra u oculta el bloque inferior con avatar del canal, título del video (2 líneas) y nombre del canal debajo de cada miniatura.
  - **Toggle `Detalles`** (`detailedView`, desactivado por defecto): Muestra u oculta debajo de cada tarjeta la categoría, lista de `#tags` y el cuadro de notas editable en línea.
  - **Botón CTA `"Agregar Pack"`**.
- **Fila 2**:
  - Tira horizontal de **Tags**: Botón `"Todos los tags"` + un botón por cada `#tag` (clic activa/desactiva el filtro) + botón `"Tags"` que abre `TagManagerModal`.

#### 6.1.3. Grilla y Tarjetas (`PackagingCard.tsx`)
- **Grilla responsiva**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` con `gap-x-4` y `gap-y-4` (cuando títulos y detalles están ocultos) o `gap-y-8` (cuando títulos o detalles están activos).
- **Cascada de resolución de miniatura**: Carga `maxresdefault.jpg` (1280×720); si da error (`onError`), baja automáticamente a `hqdefault.jpg` (480×360) y luego a `mqdefault.jpg` (320×180).
- **Menú contextual de 3 puntos (`MoreVertical`)**:
  - Ver detalles y expandir (abre Lightbox)
  - Añadir/quitar de favoritos
  - Submenú desplegable para asignar/quitar tags
  - Copiar link de YouTube al portapapeles
  - Abrir video en YouTube en nueva pestaña
  - Descargar archivo `.jpg` de la miniatura
  - Cambiar categoría
  - Eliminar packaging (con confirmación en dos pasos `"¿Eliminar este packaging? Sí, eliminar / Cancelar"`).

#### 6.1.4. Visor Expandido (`LightboxModal.tsx`)
- Se abre al hacer clic en cualquier miniatura.
- Muestra contador `"X de Y"`, selector rápido de categoría en la barra superior, botón de favorito, botón `"Descargar miniatura"` y botón cerrar (`Escape`).
- **Navegación**: Flechas laterales en pantalla y soporte de teclado (`ArrowLeft` anterior, `ArrowRight` siguiente, `Escape` cerrar).
- **Panel lateral derecho (`lg:w-92`)**: Muestra canal, categoría, título completo, editor interactivo de tags, editor de notas estratégicas, fecha de guardado, botón `"Abrir video en YouTube"` y botón `"Copiar link de YouTube"`.

#### 6.1.5. Gestor de Tags (`TagManagerModal.tsx`)
- Tags iniciales por defecto: `['Contrarian', 'Versus', 'Shock', 'Meme', 'Gooner', 'Impact', 'Raw']`.
- Permite crear nuevos tags (validando duplicados sin distinguir mayúsculas/minúsculas), renombrar un tag existente (actualizando automáticamente todos los videos que lo tengan asignado) y eliminar un tag (removiéndolo de los videos). Muestra cuántos videos usan cada tag.

---

### MÓDULO 2: Mis Videos (`MyVideosModule.tsx`)

Diseñado para almacenar en la nube los videos en producción del usuario junto con sus variaciones de packaging.

- **Límites**:
  - Máximo **10 carpetas de video** por perfil (`MAX_VIDEOS = 10`).
  - Máximo **5 packs por carpeta** (`MAX_PACKS_PER_VIDEO = 5`, ordenados de `0` a `4` como `Pack #1 (A)` hasta `Pack #5 (E)`).
- **Vista de Carpetas (`VideoFolderCard.tsx`)**:
  - Muestra la miniatura del `Pack #1` como portada, insignia superior `"Video #N"` y contador `"X / 5 Packs"`. Si hay más de 1 pack, muestra una tira inferior con miniaturas en miniatura de todos los packs guardados.
  - Permite renombrar la carpeta en línea, abrirla para editar sus 5 slots o eliminarla (borrando en cascada la carpeta y todos sus packs mediante `writeBatch` en Firestore).
  - Incluye una tarjeta punteada `"+ Nuevo Video (Espacio #N de 10)"` para creación rápida en 1 clic.
- **Vista de Detalle de Carpeta (`VideoFolderDetailView.tsx` y `PackSlotCard.tsx`)**:
  - Grilla de 5 espacios (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5`).
  - Cada slot permite subir una imagen mediante clic o Drag & Drop y escribir un título (con contador `X/100`).
  - Una vez guardado un pack, al pasar el mouse sobre su miniatura aparecen dos acciones: `"Editar Pack"` y el botón **`Descargar`** (`Download`), que descarga la miniatura guardada directamente a la PC como `pack-{N}-{titulo}.webp`.
- **Compresión Automática de Miniaturas (`utils/imageCompression.ts`)**:
  - Al seleccionar cualquier archivo de imagen en `Mis Videos`, `compressThumbnailFile` la procesa en un `<canvas>` de **1280×720 px** (proporción exacta 16:9 con recorte centrado `center-crop` y fondo negro).
  - Exporta primero a `image/webp` con calidad `0.82`. Si el navegador no soporta WebP, usa `image/jpeg` a `0.82`.
  - Si el string Data URL resultante supera los `380,000` caracteres, reduce la calidad JPEG a `0.68`; si aún supera `380,000` caracteres, redimensiona a `960×540 px` (calidad `0.72`). Esto garantiza que cada miniatura pese ~80–150 KB y se sincronice instantáneamente en Firestore (cuyo límite por regla es `450,000` caracteres).

---

### MÓDULO 3: Comparar (`PackagingPreviewModule.tsx`)

Permite previsualizar múltiples packs propios mezclados aleatoriamente en un feed de inicio de YouTube junto a referencias reales del repositorio.

- **Panel Superior Izquierdo (`1. Tus Packs a Comparar` — `UserPacksUploader.tsx`, 7 columnas de 12 en XL)**:
  - **Modo `Mis Videos` (Cloud)**: Muestra una fila de píldoras con las carpetas de "Mis Videos" y debajo las tarjetas de sus packs. Permite seleccionar uno, varios o `"Seleccionar todos"` los packs de una o distintas carpetas al mismo tiempo.
  - **Modo `Test Rápido` (RAM)**: Permite subir al instante imágenes locales (`URL.createObjectURL`) con título sin guardarlas en la nube.
- **Panel Superior Derecho (`2. Elegir Contrincantes` — `CompetitorFilterPanel.tsx`, 5 columnas de 12 en XL)**:
  - Filtra contra qué videos del Repositorio competir seleccionando una **Categoría** (`Todas` o una específica) y uno o varios **Tags**.
  - Muestra en el pie cuántos packs propios y cuántos competidores (máximo **20**) entran en el feed.
- **Barra de Acciones**:
  - **Botón `Borde en mis packs: ON / OFF`**: Cuando está en `ON`, los packs del usuario muestran un borde rojo (`ring-2 ring-red-500`) y una insignia `"Tu Pack"` arriba a la izquierda. Cuando está en `OFF`, se ven 100% idénticos a cualquier otro video de YouTube para evaluar si destacan por sí solos.
  - **Botón `Mezclar`**: Ejecuta `fisherYatesShuffle` tomando hasta 20 competidores al azar del pool filtrado + todos los packs propios seleccionados, asignando duraciones y conteos de vistas deterministas (`getDeterministicMeta`).
- **Feed de Comparación (`YouTubeHomeCompareView.tsx`)**:
  - Cabecera simulada de YouTube con barra de búsqueda y avatar del canal configurado en Ajustes.
  - Grilla de 4 columnas en pantallas grandes (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8`), miniaturas 16:9 `rounded-xl`, avatar circular `36×36px`, título `14px` (`leading-[20px]`, `font-medium`, `line-clamp-2`) y metadatos `12px` con tilde de verificación (`Check`).

---

### MÓDULO 4: Testing (`ABTestingModule.tsx` / `TestingModule`)

Simulador de fidelidad 1:1 de la interfaz oficial de YouTube 2026 para probar una variación a la vez en todos los dispositivos y ubicaciones reales.

#### 6.4.1. Barra Superior de Variaciones (`VariationsBar.tsx`)
- **Título**: `Testing`.
- **Switch de Fuente**:
  1. **`Mis Videos` (`ABCloudPackSelector.tsx`)**:
     - Fila 1: Píldoras horizontales para elegir la carpeta de video (`#1 Nombre`, `#2 Nombre`...).
     - Fila 2: Tarjetas horizontales (`w-72`) para elegir con 1 clic cuál de los packs de esa carpeta (`Pack 1 (A)`, `Pack 2 (B)`...) proyectar en vivo en el simulador.
  2. **`Test Rápido` (`ABQuickTestBar.tsx`)**:
     - Formulario rápido para subir miniatura + título en memoria RAM (`Var A`, `Var B`, `Var C`...).
     - **Botón `Título de prueba (Debug)`**: Inserta automáticamente el texto de 96 caracteres: `"Este es un titulo a modo de prueba para comprobar la longitud de caracteres en titulos de YouTube"` para verificar visualmente dónde corta cada dispositivo.
     - **Botón `Borrar`**: Limpia el campo de título en 1 clic.
- **Indicador de Longitud y Truncado en Tiempo Real**:
  - Muestra `{longitud_actual} / {maxVisibleChars} caract. visibles`.
  - Si `title.length > spec.maxVisibleChars`, muestra alerta ámbar: `"Se truncará con '...' en esta vista (máx ~{maxVisibleChars})"`.
  - Si `title.length <= spec.maxVisibleChars`, muestra confirmación verde: `"Entra completo sin cortarse"`.

#### 6.4.2. Barra de Controles del Simulador (`SimulatorToolbar.tsx`)
1. **`1. Dispositivo:`**: `PC` | `Mobile` | `Tablet` | `TV`. (Nota: si se cambia de `Mobile` a otro dispositivo estando en `fullscreen`, la vista pasa automáticamente a `sidebar`).
2. **`2. Vista en [Dispositivo]:`**:
   - En **PC** y **Tablet**: `Homepage` | `Sidebar (Viendo un video)`.
   - En **Mobile**: `Homepage` | `Sidebar (Vertical)` | `Fullscreen Horizontal (Más videos)`.
   - En **TV**: `Homepage` | `Sugeridos (Viendo un video)`.
3. **Selector de Tema del Simulador**: `Oscuro` (`#0f0f0f`) | `Brillante` (`#ffffff`).
4. **Botón `Rotar entorno`**:
   - Mezcla aleatoriamente hasta 12 videos del repositorio (`surroundingItems`).
   - **Regla anti-duplicados**: El último video de `surroundingItems` se reserva de forma exclusiva para el reproductor principal (`playingCard`), de modo que el video que se está "viendo" nunca aparece repetido en la lista de sugeridos/sidebar.
   - Rota aleatoriamente la posición del pack del usuario (`userPositionIndex`) dentro de los límites visibles de cada vista.

---

## 7. Medidas Exactas, Tipografías y Cortes de las Vistas en Testing (`YouTubeDeviceSimulator.tsx` y `abtesting/types.ts`)

### Tabla Resumen de Especificaciones Oficiales (`YOUTUBE_SPECS`)

| Dispositivo | Vista (`placement`) | Caract. por línea (`charsPerLine`) | Líneas máx. (`maxLines`) | Caract. máx. sin cortar (`maxVisibleChars`) | Posición del Pack (`maxAllowedIndex`) | Proporción y Referencia de Miniatura |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **PC** | `Homepage` (`home`) | **35** | **2** | **70** | `0 .. 5` (entre los primeros 6) | 16:9 (`360×202px` ref · `rounded-[12px]`) |
| **PC** | `Sidebar` (`sidebar`) | **20** | **2** | **40** | `0 .. 3` (entre los primeros 4) | 16:9 (`246×138px` fijos · ~61% del sidebar · `rounded-[12px]`) |
| **Mobile** | `Homepage` (`home`) | **32** | **2** | **64** | `0 .. 1` (alterna pos 0 y 1) | 16:9 (`390×219px` full-bleed) |
| **Mobile** | `Sidebar (Vertical)` (`sidebar`) | **31** | **2** | **62** | `0` (siempre 1er recomendado) | 16:9 (`390×219px` full-bleed debajo de Comentarios) |
| **Mobile** | `Fullscreen Horizontal` (`fullscreen`) | **38** | **1** | **38** | `0 .. 1` (entre las 2 visibles) | 16:9 (`338×190px` · 2 completas + 2/10 de la 3ra · `rounded-[12px]`) |
| **Tablet** | `Homepage` (`home`) | **33** | **2** | **66** | `0 .. 3` (entre los primeros 4) | 16:9 (2 columnas · `rounded-[12px]`) |
| **Tablet** | `Sidebar` (`sidebar`) | **19** | **2** | **38** | `0 .. 2` (entre los primeros 3) | 16:9 (`196×110px` fijos · `rounded-[10px]`) |
| **Smart TV** | `Homepage` (`home`) | **23** | **2** | **46** | `0 .. 1` (Fila 1) o `0 .. 2` (Fila 2) | 16:9 (`390×219px` en Fila 1 · `285×56px` visibles en Fila 2) |
| **Smart TV** | `Sugeridos` (`sidebar`) | **23** | **2** | **46** | Columna `0..2` en `Fila 1, 2 o 3` | 16:9 (Grilla 3 col · `~300×168px` por miniatura · `rounded-[12px]`) |

---

### Detalle Técnico de Cada Vista del Simulador

#### 7.1. PC — Desktop Web
- **Colores exactos**: Oscuro `bg-[#0f0f0f] text-[#f1f1f1] border-[#272727]`, Metadatos `text-[#aaaaaa]`. Brillante `bg-[#ffffff] text-[#0f0f0f] border-[#e5e5e5]`, Metadatos `text-[#606060]`.
- **Masthead superior**: `56px` de alto (`h-14 px-6`), menú hamburguesa, logo YouTube `Premium AR`, barra de búsqueda central (`max-w-[600px] h-10 rounded-full`), botón micrófono (`40×40px`), botón `+ Create`, campana y avatar.
- **Vista 1: PC `Homepage`**:
  - Fila de chips (`All`, `Gaming`, `Live`, `Mixes`, `Podcasts`, `Recently uploaded`).
  - Grilla de **3 columnas** (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10`), muestra 9 tarjetas.
  - Miniatura `aspect-video w-full rounded-[12px]` con badge de duración abajo a la derecha (`text-[12px] leading-[16px] bg-black/80 rounded-[5px]`).
  - Debajo (`mt-3 flex items-start gap-3`): Avatar circular `36×36px` (`w-9 h-9`), título `text-[16px] leading-[22px] font-semibold line-clamp-2` con `maxWidth: '35ch'`, canal y vistas `text-[14px] leading-[20px]`.
- **Vista 2: PC `Sidebar (Viendo un video)`**:
  - Layout horizontal `flex-col xl:flex-row gap-6 max-w-[1600px] mx-auto`.
  - Izquierda (`flex-1`): Reproductor `aspect-video rounded-[12px]`, título del video en reproducción (`text-[20px] leading-[28px] font-bold`), avatar `40×40px`, botón `Subscribe` y botones `Like (4.8K)` / `Share`.
  - Derecha (`xl:w-[406px] shrink-0`):
    - Fila de chips (`All`, `From the series`, `From {Canal}`, `Videos`).
    - Lista vertical de 6 tarjetas (`space-y-3`), cada una `flex items-start gap-2.5`.
    - **Miniatura grande**: `246×138px` exactos (`w-[246px] h-[138px] rounded-[12px] shrink-0`), ocupando ~61% del ancho del sidebar.
    - **Columna de texto angosta**: `flex-1 min-w-0` (~`148px` libres), título `text-[14px] leading-[20px] font-semibold line-clamp-2` (~20 caract. por línea), canal y vistas `text-[12px] leading-[18px]` con ícono SVG de play triangular antes del número de vistas.

#### 7.2. Mobile — Smartphone (App Oficial de YouTube)
- **Vista 1: Mobile `Homepage`**:
  - Marco exterior de teléfono: **`390px` de ancho** (`w-[390px] rounded-[38px] border-[6px] border-neutral-800 shadow-2xl`).
  - Barra de estado del sistema: `32px` de alto (`h-8 px-5`), hora `12:11` a la izquierda; ícono silencio, insignia `5G`, 4 barras de señal y píldora de batería `52` a la derecha.
  - Header de la app: `44px` (`h-11 px-3.5`), logo YouTube + iconos campana y lupa.
  - Chips: `Todos`, `Novedades`, `Gaming`, `Podcasts`.
  - Feed vertical de 4 tarjetas: Miniatura `aspect-video w-full` de borde a borde (`390×219px`), fila inferior (`px-3 gap-3`) con avatar `36×36px`, título `text-[14px] leading-[18px] font-medium line-clamp-2` (`maxWidth: '32ch'`), metadatos `text-[12px] leading-[16px]`.
  - Tab Bar inferior: `48px` (`h-12 grid-cols-4 text-[10px]`): `Principal`, `Shorts`, `Suscripciones`, `Tú`.
- **Vista 2: Mobile `Sidebar (Vertical)` (Viendo un video en vertical)**:
  - Mismo marco de **`390px` de ancho**.
  - **1. Reproductor superior**: `aspect-video w-full` pegado al borde superior (debajo de la barra de estado con fondo `#1a1a1a`).
  - **2. Cabecera del video activo y ruido visual real**:
    - Título del video en reproducción truncado a **1 línea** (`text-[17px] leading-[22px] font-bold truncate`).
    - Línea compacta: `@{Canal} · 8.8 K "Me gusta" · {vistas} vistas · {tiempo} ...más`.
    - Fila de canal y acciones: Avatar `32×32px` + botón píldora `Suscribirse` a la izquierda; íconos limpios sin fondo a la derecha (`Like`, `Dislike`, `Share`, estrella de 4 puntas de IA y menú de 3 puntos horizontales).
    - **Caja Teaser de Comentarios**: Tarjeta `rounded-[12px] p-3` (`bg-[#212121]` en oscuro / `bg-[#f2f2f2]` en claro) con cabecera `"Comentarios 615"`, indicador de carrusel (píldora + punto) y comentario destacado con avatar circular `24×24px` y 2 líneas de texto (`text-[12px] leading-[16px]`).
  - **3. Feed "Up Next" debajo de Comentarios**:
    - **Primer video recomendado (posición `0`, donde siempre se ubica el pack del usuario)**: Miniatura 16:9 full-bleed (`390×219px`), fila de datos (`px-3 gap-3`) con avatar `36×36px`, título `text-[15px] leading-[20px] font-semibold line-clamp-2` (`maxWidth: '31ch'`), metadatos `text-[12px]` con ícono play triangular (`{canal} · ▷ {vistas} · hace 1 día`) y menú de 3 puntos horizontales.
    - **Segundo video recomendado (asomando en el borde inferior)**: Contenedor recortado a **`86px` de alto** (`h-[86px]`) mostrando la parte superior de la siguiente miniatura + barra de gestos de navegación de Android superpuesta abajo.
- **Vista 3: Mobile `Fullscreen Horizontal (Más videos)`**:
  - Simula cuando el usuario mira un video con el celular en horizontal y desliza hacia arriba para ver `"Más videos"`.
  - Marco horizontal: **`840px` de ancho** (`w-[840px] max-w-full rounded-[38px] border-[6px] border-neutral-800 bg-black text-white`).
  - Barra superior (`pt-5 pb-3 pl-14 pr-7`): Texto `"Más videos"` a la izquierda e ícono `X` de cierre a la derecha.
  - Fila de chips (`pl-14 pr-4 pb-3.5`): `Todos` (activo en blanco), `Contenido de la serie`, `De {Canal}`, `Desarrollo de videojuegos`, `Estrategias`, `Videos`.
  - **Carrusel Horizontal Deslizable con el Mouse (`drag-to-scroll`)**:
    - Padding izquierdo `56px` (`pl-14`), `gap-[14px]`.
    - Cada tarjeta mide **`338px` de ancho fijo** (`w-[338px] shrink-0`).
    - **Proporción visible en pantalla**: En el contenedor de `840px` (menos `12px` de bordes y `56px` de `pl-14` = `772px` útiles), entran **2 tarjetas completas (`338 + 14 + 338 = 690px`) y exactamente ~2/10 (`~68px`) de la 3ra tarjeta** asomando a la derecha.
    - Miniatura 16:9 con esquinas `rounded-[12px]` y badge de duración.
    - Debajo de la miniatura (`mt-2.5 flex items-center gap-3`): Avatar `36×36px`, **título a 1 sola línea** (`text-[14px] leading-[19px] font-medium text-white truncate`, ~38 caracteres), metadatos en 1 línea (`text-[12px] text-[#aaaaaa]`: `{canal}  {vistas}  {tiempo}`) e ícono de 3 puntos horizontales.

#### 7.3. Tablet — iPadOS / Android Tablet
- Marco exterior: **`860px` de ancho** (`w-[860px] max-w-full rounded-[28px] border-[6px] border-neutral-800 shadow-2xl`).
- Header Tablet: `52px` (`h-13 px-5`), logo YouTube, buscador central (`max-w-sm rounded-full`) y avatar.
- **Vista 1: Tablet `Homepage`**:
  - Grilla de **2 columnas** (`p-5 grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-7`), muestra 6 tarjetas.
  - Miniatura 16:9 `rounded-[12px]`, avatar `32×32px` (`w-8 h-8`), título `text-[15px] leading-[20px] font-medium line-clamp-2` (`maxWidth: '33ch'`), metadatos `text-[12px]`.
- **Vista 2: Tablet `Sidebar (Viendo un video)`**:
  - Vista dividida de 12 columnas (`p-5 grid-cols-1 md:grid-cols-12 gap-4`):
    - Izquierda (`md:col-span-7`): Reproductor 16:9 `rounded-[12px]` con botón Play central y título `text-[16px] font-bold`.
    - Derecha (`md:col-span-5`): Lista de 5 videos sugeridos (`space-y-3`). Cada tarjeta tiene miniatura de **`196×110px`** (`w-[196px] h-[110px] rounded-[10px] shrink-0`) + columna derecha con título `text-[13px] leading-[18px] font-semibold line-clamp-2` (~19 caract./línea) y metadatos `text-[11px]`.

#### 7.4. Smart TV — Living Room 10-ft UI (`SmartTVSimulatorView`)
- **Marco exterior de TV**: **`1040px` de ancho máximo × `560px` de alto fijo** (`w-full max-w-[1040px] h-[560px] rounded-[18px] border-[6px] border-neutral-800 bg-black shadow-2xl`) + dos patas de soporte inferiores inclinadas (`w-3.5 h-10 bg-neutral-800 rotate-[28deg]` y `-rotate-[28deg]`).
- **Vista 1: Smart TV `Homepage`**:
  - **Barra de control superior (fuera de la TV)**: Permite elegir dónde posicionar el pack del usuario:
    - `Recommended shows (Fila 1)` (posiciones `0` o `1`, pack completo con título).
    - `Continue watching (Fila 2)` (posiciones `0`, `1` o `2`, fila inferior recortada).
  - **Interior de la pantalla (`560px` de alto)**:
    - **Columna lateral izquierda de íconos**: `64px` de ancho (`w-16`), avatar arriba, 6 íconos de navegación al centro (`Search`, `Home`, `Compass`, `PlaySquare`, `Video`, `Volume2`) e ícono `Settings` abajo.
    - **Área principal derecha (`flex-1 pt-5 pl-4`)**:
      - Cabecera con botón micrófono, píldora `Search` (`w-64 h-8`) a la izquierda y logo `YouTube Premium` a la derecha.
      - **Fila 1 (`Recommended shows`)**: Carrusel horizontal deslizable con el mouse (`gap-4 pr-8`). Cada tarjeta mide **`390px` de ancho** (`w-[390px] shrink-0`), mostrando **2 tarjetas completas + ~1/3 de la 3ra tarjeta** a la derecha. Miniatura 16:9 `rounded-[14px]` limpia (sin bordes blancos), título `text-[15px] leading-[19px] font-bold text-white line-clamp-2` (`maxWidth: '26ch'`, spec de alerta a 46 caract.) y dos líneas de metadatos (`text-[11px]`).
      - **Fila 2 (`Continue watching`)**: Ubicada en el borde inferior de la pantalla. Cada tarjeta mide **`285px` de ancho × `56px` de alto visible** (`w-[285px] h-[56px] rounded-t-[12px] overflow-hidden`), renderizando internamente una imagen de `160px` de alto alineada arriba (`object-top`) para mostrar únicamente el **35% superior** de cada miniatura sin título.
- **Vista 2: Smart TV `Sugeridos (Viendo un video)`**:
  - **Barra de Control Remoto TV (fuera de la TV)**:
    - **Fila 1 de controles (Navegación vertical por filas)**:
      - Botón `▲ / ◀ Subir` y botón rojo `▼ / ▶ Bajar fila (Ver siguientes 3)`.
      - Botones directos de paso: `1. Video` (Paso 0), `2. Fila 1` (Paso 1), `3. Fila 2` (Paso 2), `4. Fila 3` (Paso 3). (Soporta hasta Paso 4 con 5 filas totales = 15 tarjetas para que siempre asome una fila inferior).
      - Selector **`Tu pack en:`**: `Fila 1` | `Fila 2` | `Fila 3` (define en qué fila `userTargetRow` se inyecta el pack del usuario).
    - **Fila 2 de controles (Pantalla del video en reproducción)**:
      - Botón `Randomizar video de fondo`: Cambia aleatoriamente el video que se está reproduciendo en el fondo de la TV, garantizando que ese video no se repita entre las 15 tarjetas de la grilla de sugeridos.
      - Botón `Dejar en negro` / `Fondo negro (Activo)`: Reemplaza la imagen del video en reproducción por un fondo negro puro (`bg-black`).
  - **Geometría Exacta y Animación dentro del Lienzo de `560px` de Alto**:
    - Fondo: Imagen del video activo a pantalla completa (`object-cover`) + capa de oscurecimiento (`scrim`) que pasa de un gradiente suave en el Paso 0 (`from-black/65 via-black/15 to-black/90`) a un velo oscuro uniforme (`bg-black/75`) en los Pasos 1..4 para que los títulos de los packs sugeridos sean 100% legibles.
    - Contenedor deslizable (`px-10 transition-transform duration-300 ease-out`) con `transform: translateY({trackTranslateY}px)`:
      1. **Parte 1 — Bloque de Información y Controles del Reproductor**: Mide exactamente **`452px` de alto** (`h-[452px] pt-7 pb-4 flex flex-col justify-between`).
         - Arriba a la izquierda: Título del video en reproducción (`text-[20px] leading-[25px] font-bold`) y canal/vistas (`text-[11px]`).
         - Abajo: Barra de progreso blanca (`0:08` a `{duración}`, progreso al `12%`) y fila de controles dividida en 3 zonas:
           - Izquierda: Inicial del canal + píldora `Description` + campana `Bell`.
           - Centro: Botón anterior `⏮`, botón `Play` central (`40×40px`, blanco activo en Paso 0, translúcido en Pasos 1..4; al hacer clic vuelve al Paso 0) y botón siguiente `⏭`.
           - Derecha: Cápsula translúcida con 5 íconos (`Like`, `Dislike`, `Share`, `Maximize`, `Settings`).
      2. **Parte 2 — Cuadrícula de Videos Sugeridos (5 filas × 3 columnas = 15 tarjetas)**:
         - Cada fila (`grid grid-cols-3 gap-5`) tiene una altura fija de **`242px`** (`h-[242px]`) y un margen inferior de **`24px`** (`mb-[24px]`), sumando un paso exacto de **`266px` por fila**:
           - Miniatura 16:9: **`168px` de alto** (`h-[168px] w-full rounded-[12px]`, aprox. `300×168px` por columna) con badge de duración abajo a la derecha.
           - Bloque de texto debajo de la miniatura: **`74px` de alto** (`h-[74px] pt-2.5`), con título a 2 líneas (`text-[15px] leading-[19px] font-bold text-white line-clamp-2`, `maxWidth: '25ch'`) + 2 líneas de canal, vistas y tiempo (`text-[11px]`).
      3. **Fórmula Matemática de `trackTranslateY`**:
         - **Paso 0 (`1. Video`)**: `translateY = 0px`. El bloque de controles ocupa `0..452px` y la **Fila 1** comienza en `y = 452px`, por lo que en los `560px` de la TV asoman exactamente los **`108px` superiores** de las 3 primeras miniaturas (sin verse sus títulos todavía).
         - **Paso 1 (`2. Fila 1`)**: `translateY = -254px`. La **Fila 1** sube a `y = 198px..440px` (viéndose los 3 packs 100% enteros con sus miniaturas y títulos completos) y la **Fila 2** se posiciona en `y = 464px`, dejando asomar los **`96px` superiores** de las siguientes 3 miniaturas en el borde inferior.
         - **Paso `k` (`k >= 1`)**: `translateY = -(254 + (k - 1) * 266)px`. En cualquier fila `k`, los 3 packs de la fila activa se ven enteros en `y = 198px..440px` y los 3 packs de la fila `k + 1` asoman `96px` abajo. Además, hacer clic directamente sobre la fila que asoma abajo avanza automáticamente al siguiente paso.

---

### MÓDULO 5: Datos (`DataDashboardView.tsx` y `utils/exportData.ts`)

Panel de control analítico y centro de respaldos del perfil activo.

- **Botones Superiores de Respaldo**:
  1. **`Exportar JSON`**: Descarga `tubestacker_{profile}_{YYYY-MM-DD}.json` con metadatos del perfil, lista de categorías, lista de tags y todos los registros enriquecidos (`EnrichedPackagingRecord`, que añade `thumbnailMaxResUrl`, `thumbnailHqUrl` y `createdAtISO`).
  2. **`Exportar CSV`**: Descarga `tubestacker_{profile}_{YYYY-MM-DD}.csv` con prefijo BOM UTF-8 (`\uFEFF`) para compatibilidad directa con Excel y Google Sheets, escapando comillas y saltos de línea. Columnas: `id, videoId, title, channelTitle, category, tags, favorite, notes, youtubeUrl, thumbnailMaxResUrl, thumbnailHqUrl, createdAtISO`.
  3. **`Importar JSON`**: Lee un archivo `.json` (acepta tanto un array directo de items como el objeto exportado `{ items: [...] }`), valida que tengan `videoId` y `title`, filtra duplicados que ya existan en el perfil y fusiona automáticamente las categorías y tags nuevos en Firestore y `localStorage`.
- **4 Tarjetas de KPIs**:
  1. `Total de Packs` almacenados en el perfil activo.
  2. `Canales únicos` (cantidad de canales de referencia distintos).
  3. `Favoritos` (cantidad y porcentaje sobre el total).
  4. `Packs con notas` (cantidad de packs anotados y total de tags configurados).
- **Distribución y Acciones Masivas de Miniaturas**:
  - **Barras de progreso por Categoría**: Muestra cantidad y porcentaje (`%`) de packs en cada categoría, seguido del ranking de los **8 tags más usados**.
  - **Botón `Descargar N miniaturas (.jpg)`**: Descarga secuencialmente todas las miniaturas del repositorio como archivos individuales `{categoria}_{videoId}.jpg` (intenta `maxresdefault.jpg` y si falla usa `hqdefault.jpg`), con una pausa de `220ms` entre cada descarga y contador de progreso en vivo (`Descargando X/Y...`).
  - **Botón `Copiar URLs de miniaturas HD`**: Copia al portapapeles todas las URLs `maxresdefault.jpg` separadas por salto de línea (`\n`).
- **Tabla Completa de Registros**:
  - Muestra vista previa de miniatura (`16:9`), `videoId` monoespaciado, título + nota en cursiva, canal, categoría, `#tags` y enlaces rápidos `JPG` (abre miniatura HD) y `YT` (abre el video en YouTube).

---

### MÓDULO 6: Ajustes (`SettingsView.tsx`)

- Permite configurar el parámetro **`Canal por defecto al comparar packs`** específico para el perfil activo (`Johnny` o `Guido`).
- Al guardar, actualiza `defaultChannelName` tanto en el documento `profiles/{profileId}/config/preferences` de Firestore como en `localStorage` (`tubeswipe_channel_{profileId}_v1`).
- Este nombre de canal (y su inicial para el avatar) se inyecta automáticamente en todas las tarjetas del usuario dentro de los módulos **Mis Videos**, **Comparar** y **Testing**.

---

## 8. Enlaces Compartibles por URL (`utils/shareUrl.ts`)

- La utilidad `generateShareUrl` / `parseShareUrl` permite serializar una colección de hasta 200 `PackagingItem` y 100 `tags` en un objeto compacto (`{ items: [{ v, t, c, cat, tags, n, fav }], tags }`), codificarlo en Base64 UTF-8 seguro y añadirlo al hash de la URL (`#share=...`).
- Al abrir la aplicación con un hash `#share=...`, `useProfileWorkspace` decodifica los packs, los carga en la vista, muestra un banner verde superior (`"Colección compartida cargada: N packagings"`) y limpia el hash de la barra de direcciones mediante `window.history.replaceState`.
