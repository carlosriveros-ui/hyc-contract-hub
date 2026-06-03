// Agente de Precios — monitorea precios de insumos de construcción en Colombia

const INSUMOS = [
  { nombre: 'Cemento gris x50kg', keywords: 'precio cemento gris 50kg Colombia 2026' },
  { nombre: 'Acero de refuerzo 1/2"', keywords: 'precio acero refuerzo varilla 1/2 Colombia 2026' },
  { nombre: 'Acero de refuerzo 3/8"', keywords: 'precio varilla acero 3/8 Colombia 2026' },
  { nombre: 'Concreto 3000 PSI', keywords: 'precio concreto premezclado 3000 psi Colombia' },
  { nombre: 'Concreto 3500 PSI', keywords: 'precio concreto premezclado 3500 psi Colombia' },
  { nombre: 'Concreto 4000 PSI', keywords: 'precio concreto premezclado 4000 psi Colombia' },
  { nombre: 'Concreto 5000 PSI', keywords: 'precio concreto premezclado 5000 psi Colombia' },
  { nombre: 'Recebo compactado', keywords: 'precio recebo compactado Colombia m3 2026' },
  { nombre: 'Arena de río', keywords: 'precio arena rio Colombia m3 construccion' },
  { nombre: 'Gravilla triturada', keywords: 'precio gravilla triturada Colombia m3' },
  { nombre: 'Teja fibrocemento', keywords: 'precio teja fibrocemento Colombia 2026' },
  { nombre: 'Teja termoacústica', keywords: 'precio teja termoacustica Colombia' },
  { nombre: 'Pintura vinilo interior', keywords: 'precio pintura vinilo interior Colombia galon' },
  { nombre: 'Enchape cerámico piso', keywords: 'precio enchape ceramico piso Colombia m2' },
  { nombre: 'Tubería PVC 4"', keywords: 'precio tuberia PVC 4 pulgadas Colombia' },
  { nombre: 'Cable THHN #12', keywords: 'precio cable THHN calibre 12 Colombia metro' },
  { nombre: 'Tablero eléctrico 12 ctos', keywords: 'precio tablero electrico 12 circuitos Colombia' },
];

export async function runPricesAgent(runAgent) {
  const prompt = `Eres el agente de inteligencia de precios de HYC Proyectos. Tu misión es monitorear los precios actuales de insumos de construcción en Colombia para que la empresa pueda presupuestar correctamente.

**Insumos a monitorear:**
${INSUMOS.map((i, idx) => `${idx + 1}. ${i.nombre}`).join('\n')}

**Proceso:**
Para cada grupo de insumos (agrupar por categoría), haz búsquedas con web_search:
- Categoría 1 (Concretos y cemento): busca precios actuales 2026
- Categoría 2 (Aceros): busca precios metro lineal o kg
- Categoría 3 (Materiales pétreos y rellenos): precios por m3
- Categoría 4 (Cubiertas): precios por m2 o unidad
- Categoría 5 (Acabados): precios por m2 o galón
- Categoría 6 (Eléctricos): precios por metro o unidad

Para los más importantes, usa fetch_url para verificar precios en:
- https://www.construdata.com (si está accesible)
- Páginas de distribuidores como Homecenter, Construrama, Ferrocementos

**Reporte final:**
Crea una tabla de precios con:
- Insumo | Precio referencia | Unidad | Fuente | Variación estimada
- Indicadores de alerta: ↑ sube, ↓ baja, → estable
- Observaciones de mercado: ¿hay escasez? ¿variaciones importantes?

**Conclusión:**
¿Hay insumos con variaciones significativas que afecten presupuestos actuales de HYC?

Envía el reporte completo por Telegram. Si hay variaciones importantes en precios (>10%), usa nivel "warning".`;

  await runAgent(prompt, { source: 'prices-agent', date: new Date().toISOString() });
}
