# PLAYBOOK de video — cómo producir cualquier video de Carlos / HYC / PLL

> Claude: sigue este archivo **cada vez** que Carlos pida un video, un reel, un clip, un guion o una pieza audiovisual.
> Inventario y estado de cuentas: revisado 2026-11-01 (ver §7; re-verificar saldos antes de gastar).

---

## 1. Primeras preguntas (deducirlas del pedido; preguntar solo lo que falte)

1. **Marca**: HYC Proyectos · Carlos Riveros · Project Leader Lab (PLL).
2. **Tipo**: ¿Carlos sale hablando? ¿es animado/con datos? ¿es didáctico? ¿se recorta de algo largo?
3. **Plataforma → formato** (§5).
4. **¿Hay material?** grabación (Zoom, Drive, archivo), datos de la app, fotos de obra, guion.
5. **¿Publicar o solo producir?** Publicar o gastar créditos SIEMPRE requiere confirmación explícita.

---

## 2. Matriz de decisión — qué herramienta usar

| Pedido | Ruta | Herramientas |
|---|---|---|
| "Quiero grabar un video / reel / qué digo" | **Guion → Carlos graba → edición** | skill `video-script-hyc` (obligatoria) → Carlos graba → §3-A |
| Video de HYC con datos (avance de contrato, informe, resultados, cifras) | **Animado por código** | **Revideo** `videos/hyc/` (datos de la app/Supabase vía `variables`) |
| Frase, tip, anuncio animado de Carlos o PLL | **Animado por código** | **Remotion** `src/remotion/` |
| Explicar un concepto de gestión paso a paso (curvas, diagramas, fórmulas) — PLL | **Didáctico** | **Manim** `videos/explicativos/` (+ voz §4) |
| Webinar, clase, charla larga, grabación de Zoom → clips cortos | **Repurposing** | **OpusClip** (créditos de sobra) → ajustes con `opusclip_edit_clip` |
| Unir grabaciones de obra/visitas con logo, título, música | **Edición** | **MoviePy** `videos/editor/editar.py` |
| Hablando a cámara, quitar silencios + subtítulos rápido | **Edición** | MoviePy `--recortar-silencios --subtitulos` (o Descript, §3-B) |
| Pulido para TikTok/Reels (efectos, plantillas de moda, audio en tendencia) | **Manual** | **CapCut** (Carlos) con el paquete de edición §3-C |
| Corregir lo que se dijo editando texto, muletillas, sonido de estudio | **Manual** | **Descript** (Carlos) con el paquete §3-C |
| Narración en off (sin que Carlos grabe) | **Voz** | ElevenLabs (§4) |
| B-roll que no se puede filmar (planos genéricos, conceptos) | **IA generativa** | ElevenLabs `creative_generate_video` (cuesta créditos; `estimate_only` primero). Higgsfield sin saldo |
| Miniatura, portada, gráfico para el post del video | **Diseño** | Canva (brand kit) o skill `image` |
| Copy del post que acompaña el video | **Texto** | `linkedin-content` / `li-post` (Carlos, PLL) · `brand-hyc` (HYC) |
| Plan mensual de videos / calendario | **Estrategia** | `agencia-marketing-hyc` · `social-content-engine` |
| Brief para un editor freelance | **Brief** | `agencia-marketing-hyc` (brief para editor de video) |

**Regla de herramientas de código** (CLAUDE.md): HYC → Revideo · Carlos/PLL → Remotion · didáctico PLL → Manim · grabaciones (cualquier marca) → MoviePy. Nunca Remotion con marca HYC.

---

## 3. Flujos completos

### 3-A. Carlos habla a cámara (el más común)

1. **Guion** con `video-script-hyc` (formato A/B/C según duración; rótulos `[RÓTULO]` y `[B-ROLL]` incluidos).
2. Carlos graba (celular vertical para Reels/Shorts; horizontal para YouTube).
3. Edición — elegir UNA:
   - **Rápida/automática**: `python editar.py --marca <m> --clips ... --formato 9:16 --recortar-silencios --subtitulos [--musica]`
   - **Fina**: Descript (texto, muletillas, Studio Sound) → exportar → CapCut si quiere efectos/tendencias.
4. Si el video dura > 3 min: subirlo a **OpusClip** para sacar 3–5 clips; aplicar colores de marca con `opusclip_edit_clip` → `set_style` (captionColor / highlightColor de `videos/marcas.json`).
5. Copy del post (`linkedin-content`) + miniatura (Canva).
6. Publicar/programar con OpusClip **solo con aprobación** (cuentas en §7).

### 3-B. Repurposing (video largo → clips)

Zoom (`recordings_list`) o Drive → OpusClip `submit_project` (plantilla vertical con karaoke) → revisar clips con Carlos → `edit_clip` (quitar muletillas/pausas, colores de marca, overlay de título) → `export_clip` → copy + programar.
Alternativa local sin créditos: MoviePy con cortes manuales.

### 3-C. Paquete de edición para CapCut / Descript (lo que Claude entrega)

No hay conector de CapCut ni Descript: Carlos edita, Claude prepara:
- Guion final y **lista de rótulos** con tiempo aproximado y texto exacto.
- **Archivo .srt** (MoviePy `--subtitulos`) para importar subtítulos ya corregidos.
- **Lista de B-roll** y música sugerida (sin copyright para LinkedIn).
- **Colores y tipografía** de la marca (§6) para configurar el estilo de subtítulos y textos.
- Gráficos ya renderizados (Remotion/Revideo/Manim en MP4 o PNG) para insertar.
- Descript: usar Studio Sound, quitar muletillas, *Overdub* solo para correcciones con la voz real de Carlos.
- CapCut: plantillas de subtítulo animado con colores de marca; no usar stickers/efectos que choquen con la marca HYC.

### 3-F. Plantillas Remotion (Carlos Riveros / PLL)

`npx remotion render src/remotion/index.ts <Composición> salida.mp4` (o `npx remotion studio src/remotion/index.ts` para editar; requiere `@remotion/cli@4.0.539`):
- `PresentacionCarlos` — presentación personal 1:1 (~11,5 s): nombre + cargo → pilares (construcción de campo, gerencia de proyectos, IA aplicada) → frase de cierre + CTA. Textos editables por props.
- `PresentacionPLL` — presentación de Project Leader Lab 1:1 (25 s): marco dorado + etiqueta → pregunta → 3 temas numerados → mensaje de apoyo → nombre + slogan (énfasis serif itálico) + CTA. Textos de la base de marca `videos/marca-pll.md` (slogan aprobado).
- `ReelCarlos` — reel vertical 9:16 (1080×1920, 27 s) de Carlos: gancho + giro → 2 puntos numerados → perspectiva → pregunta + firma. Texto en zona segura (15 % arriba/abajo libre), `textWrap: balance`, barra de progreso. Guion con reglas de `video-script-hyc` y sin cifras.
- `PostMarcaPersonal` / `PostProjectLeader` — frase con firma 1:1 (6 s).
- `CostosEAC01` — "Ingeniería de costos en 30 segundos" #01, 4:5 (1080×1350, 30 s): barras, burbujas, área e histograma en SVG + música generada (`videos/producciones/2026-11-costos-01/`).

### 3-D. Video animado con datos (HYC)

Plantillas Revideo listas en `videos/hyc/` (`npm run render -- <nombre>` → `output/<nombre>.mp4`):
- `presentacion` — presentación de marca 1:1 (~11 s): franjas rojas + nombre → cifras con conteo (201 proyectos · 650.000 m² intervenidos · +20 años de experiencia) → cierre rojo "CONSTRUIMOS CONFIANZA" + web.
- `resumen-contrato` — avance de un contrato 16:9 (cliente, sedes, % de actividades).
- Texto pequeño sobre negro: en blanco, no en rojo (el rojo sobre `#211F20` no da contraste); rojo para franjas, barras y fondos.

Datos de la app (Supabase: contrato, sedes, actividades) → `variables.datos` en `videos/hyc/src/render.ts` → `npm run render` → (opcional) MoviePy para unirlo con grabaciones de obra → OpusClip/manual para publicar.

### 3-E. Didáctico PLL

Escenas Manim en `videos/explicativos/`: `IAConCriterio` (1:1, ~34 s: pregunta → informe → qué prepara la IA / qué valida el responsable → decisión con criterio → idea central → pregunta de aplicación → slogan) y `CurvaS` (16:9). Identidad PLL en Manim: marco dorado, etiqueta, retícula discreta (`reticula` de marcas.json), énfasis serif itálico solo en "criterio y propósito".

Guion corto (1 idea) → escena Manim → narración ElevenLabs (o voz de Carlos grabada) → MoviePy para unir audio + video + música → subtítulos.

---

## 4. Voz

- **Preferido: la voz real de Carlos.** No hay voz clonada de Carlos en ElevenLabs (verificado). Hasta crearla, toda narración sintética es de un locutor de biblioteca — **no presentarla como si fuera Carlos**.
- Voces de biblioteca sugeridas (español colombiano, tono profesional):
  - `Y4HwpMNrBWN5dFKi5Lw8` — "Carlos – Premium Latin American Spanish Narrator" (es-colombian, cálida, confiable).
  - `4PN5DHmrfIgZksvIrawS` — narrador colombiano documental, pausado (≈145 ppm), ideal para Manim/PLL.
- Siempre mostrar a Carlos qué voz se usó. La generación de voz gasta créditos de ElevenLabs.

---

## 5. Formatos por plataforma

| Plataforma | Formato | Duración | Notas |
|---|---|---|---|
| LinkedIn feed (Carlos / HYC) | 1:1 o 4:5 (1080×1080 / 1080×1350) | 30–90 s | Subtítulos siempre (85 % se ve sin sonido) |
| Reels / Shorts / TikTok | 9:16 (1080×1920) | 30–60 s | Texto fuera del 15 % inferior y superior (interfaz) |
| YouTube | 16:9 (1920×1080) | 3–20 min | Miniatura propia; capítulos |
| Presentación a cliente HYC | 16:9 | 1–3 min | Sin música de tendencia; tono institucional |

---

## 6. Marca (resumen; fuente única `videos/marcas.json`)

- **Cifras de HYC (confirmadas por Carlos, 1-nov-2026):** 201 proyectos · 650.000 m² **intervenidos** (nunca "construidos") · +20 años de experiencia. **No usar** 167 proyectos ni 405.000 m² ni los desgloses por categoría. Estas cifras son de HYC: no atribuirlas a Carlos ni a PLL.
- **Project Leader Lab:** base de marca en `videos/marca-pll.md`. Slogan **aprobado**: "Lidera proyectos con criterio y propósito". Posicionamiento, voz, pilares y demás textos siguen como propuesta hasta que Carlos los apruebe.

- **HYC**: rojo `#C52026`, negro `#211F20`, blanco. Tipografía Gotham → Montserrat → Arial. Slogan *Construimos Confianza*. **Logo original, nunca recoloreado.** Motivos: franjas verticales rojas, flechas/triángulos. En texto: **HYC**, nunca "H&C".
- **Carlos Riveros**: fondo `#10100E`, blanco cálido `#F2F0E7`, dorado `#C99B64`. Composición editorial, alineada a la izquierda.
- **Project Leader Lab**: misma paleta que Carlos; marco dorado, etiqueta "PROJECT LEADER LAB", composición centrada.
- ⚠️ La skill `brand-hyc` aún dice `#CC0607` / grafito `#373435`: **manda `videos/marcas.json`** (guía visual aprobada más reciente).
- IA generativa: nunca generar obras, clientes o logos "reales" de HYC (alucina); nunca pedir texto dentro del video generado — los textos van como overlay por código.

---

## 7. Inventario de cuentas y conectores (2026-11-01)

| Recurso | Estado | Uso recomendado |
|---|---|---|
| **OpusClip** | ✅ 2.881 min de crédito · 900/mes de API · solo plantillas preset | Repurposing + publicación. Crear plantillas de marca (colores §6) en la app |
| OpusClip — cuentas para publicar | YouTube Carlos · Instagram Carlos · Instagram HYC · Facebook (Carlos, CR, HYC) · LinkedIn HYC (página) · LinkedIn Carlos (perfil) | Publicar/programar **solo con aprobación** |
| **ElevenLabs** | ✅ Conectado · sin voz clonada de Carlos · sin brand kit | Voz en off, B-roll IA (veo / seedance / runway), lipsync, avatar (heygen-avatar4) |
| **Higgsfield** | ⚠️ Plan free, 0,5 créditos | No usar hasta recargar |
| **Canva** | ✅ 1 brand kit | Miniaturas, portadas, gráficos |
| **Zoom** | ✅ Conectado | Fuente de grabaciones (clases, reuniones) para repurposing |
| **Google Drive** | ✅ Conectado | Fuente de videos/fotos de obra |
| **Adobe** (Quick Cut, resize, social variations) | ❌ No conecta en sesiones en la nube (proxy) | Usar MoviePy `--formato` para redimensionar |
| **Postiz** | ❌ Sin configurar (falta `POSTIZ_API_URL`) | Programar con OpusClip mientras tanto |
| **CapCut / Descript** | Sin conector — los usa Carlos | Paquete de edición §3-C |
| Remotion / Revideo / Manim / MoviePy | ✅ En este repo (`src/remotion`, `videos/*`) | Ver matriz §2 |

---

## 8. Reglas de costo y aprobación

- **Gratis / local**: Remotion, Revideo, Manim, MoviePy, auto-editor, faster-whisper.
- **Gasta créditos** (avisar costo antes con `estimate_only` cuando exista): ElevenLabs (voz, video, imagen), OpusClip (minutos de fuente), Higgsfield.
- **Publicar** en cualquier red: confirmación explícita de Carlos en cada publicación, mostrando cuenta, copy y video.
- Nunca reintentar una generación pagada que "parece" fallida sin revisar su estado primero (se cobra dos veces).
