import anthropic
import os

client = anthropic.Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))

CARLOS_PROFILE = """
Nombre: Carlos Riveros
Empresa: HYC Proyectos de Ingeniería SAS (Colombia)
Rol: CEO y Director de Proyectos
Experiencia: 10+ años en construcción, mantenimiento, obras civiles y gestión de proyectos en Colombia
Habilidades clave:
- Gestión integral de proyectos de construcción (desde diseño hasta entrega)
- Mantenimiento preventivo y correctivo de instalaciones
- Remodelaciones, adecuaciones y mejoras en edificios comerciales, industriales y de salud
- Gestión de equipos multidisciplinarios (ingenieros, maestros, técnicos)
- Control de costos, cronogramas y calidad
- Comunicación efectiva con clientes corporativos B2B
- Conocimiento de normas NSR-10, RETIE, y estándares colombianos de construcción
Idiomas: Español (nativo), Inglés (profesional)
"""

async def generate_proposal(job: dict) -> str:
    prompt = f"""Eres Carlos Riveros, CEO de HYC Proyectos de Ingeniería SAS en Colombia.
Debes escribir una propuesta GANADORA para este job en Upwork.

PERFIL DE CARLOS:
{CARLOS_PROFILE}

JOB A APLICAR:
Título: {job['title']}
Descripción: {job['description']}
Budget: {job['budget']}
URL: {job['url']}

INSTRUCCIONES PARA LA PROPUESTA:
- Longitud: exactamente 200-250 palabras
- Idioma: inglés (profesional pero cercano)
- Estructura:
  1. Párrafo 1 (gancho): muestra que leíste el job y entiendes el problema específico
  2. Párrafo 2 (experiencia): 2-3 logros concretos y medibles relevantes para este job
  3. Párrafo 3 (propuesta): qué harías específicamente para este proyecto
  4. Cierre: llamado a la acción, disponibilidad para una llamada
- NO uses frases genéricas como "I am a hardworking professional"
- SÍ usa números concretos cuando sea posible
- Tono: experto, directo, confiable
- NO menciones que eres de Colombia si no es relevante

Escribe SOLO la propuesta, sin comentarios adicionales."""

    message = client.messages.create(
        model='claude-opus-4-8',
        max_tokens=600,
        messages=[{'role': 'user', 'content': prompt}],
    )

    return message.content[0].text.strip()
