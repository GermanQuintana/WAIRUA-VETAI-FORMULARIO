# WAIRUA VetAI - Guia Terapeutica Veterinaria (Open Source)

Web app responsive para consulta terapeutica veterinaria con soporte de evidencia cientifica.

## Vision del producto

- Busqueda por principio activo, nombre comercial, especie y patologia.
- Busqueda local + busqueda en vivo en CIMAVet desde la pantalla principal.
- Indices por sistemas, glosario por principio activo, glosario por nombre comercial e indice por patologia.
- Formulario clinico rapido para orientar seleccion inicial segun especie/patologia.
- Fichas con dosis, indicaciones, contraindicaciones y referencias cientificas.
- Proyecto abierto para que profesionales aporten mejoras y nuevas entradas.

## Stack actual

- Frontend: React + TypeScript + Vite.
- Estilos: CSS nativo, responsive, modo dia/noche.
- Idiomas: espanol e ingles (cambio en interfaz).

## Ejecutar en local

```bash
npm install
npm run dev
```

Variables de entorno (copia `.env.example` a `.env`):

```bash
VITE_APP_BASE_PATH=/
VITE_CIMA_BASE_URL=https://cima.aemps.es/cima/rest
VITE_CIMAVET_BASE_URL=https://cimavet.aemps.es/cimavet/rest
VITE_CIMAVET_API_KEY=
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Notas rapidas:

- `VITE_APP_BASE_PATH=/` es el valor correcto para Vercel. Solo cambia si publicas en un subdirectorio.
- Si faltan `VITE_SUPABASE_URL` o `VITE_SUPABASE_ANON_KEY`, la app se publica en modo demo sin login real.
- `VITE_CIMA_BASE_URL` y `VITE_CIMAVET_BASE_URL` tienen fallback por defecto, pero conviene fijarlos tambien en Vercel para que el build quede explicito.

## Despliegue MVP en Vercel

1. Importa el repositorio en Vercel.
2. Configura en Vercel las mismas variables del bloque anterior para `Production`, `Preview` y, si quieres, `Development`.
3. En Supabase Auth define la `Site URL` de produccion y anade las URLs de Vercel permitidas en `Redirect URLs`.
4. Si vas a activar cobro premium, despliega tambien el esquema y las Edge Functions descritas en `supabase/stripe-setup.md`.

## Estructura

- `src/data/entries.ts`: dataset inicial de ejemplo.
- `src/types.ts`: tipos de datos terapeuticos y referencias.
- `src/services/cimavet.ts`: cliente de integracion CIMAVet (lista paginada, detalle por `nregistro`, carga de catalogo y filtro local por nombre/principio activo).
- `src/services/cima.ts`: cliente de integracion con CIMA humana (busqueda por nombre comercial y principio activo, detalle por `nregistro` y enlaces a ficha tecnica/prospecto).
- `supabase/schema.sql`: propuesta inicial de modelo relacional para autenticacion y contenido colaborativo.

## Estado de integracion con CIMAVet

- Endpoint de lista: `GET /medicamentos/?pagina=&tamanioPagina=`.
- Endpoint de detalle: `GET /medicamento/?nregistro=`.
- Busqueda actual implementada: filtro local sobre catalogo CIMAVet por `nombre` y `pactivos`.
- Filtro opcional por especie: se apoya en consulta de detalle por `nregistro`.

## Estado actual del MVP

- Login con Supabase Auth y Google OAuth.
- Roles (`viewer`, `contributor`, `editor`, `reviewer`, `admin`) para control de cambios.
- Cada perfil tiene una `access_key` WAIRUA para integrar otras herramientas del ecosistema, aunque la ruta preferente sigue siendo usar la misma cuenta Supabase/Google.
- Flujo editorial con estados `draft`, `under_review`, `approved` y `publication_status`.
- Integracion con Stripe lista para Edge Functions de Supabase.
- Suscripciones previstas: usuario individual 18 EUR/mes; clinica 39 EUR/mes + 7 EUR/veterinario/mes.

## Siguientes pasos recomendados

- Validar el login OAuth en la URL final de Vercel.
- Revisar CORS y experiencia real de CIMAVet/CIMA desde produccion.
- Sembrar contenido editorial inicial en Supabase y ajustar roles del equipo.
- Activar webhook y portal de Stripe cuando quieras abrir premium.

## Estado de integracion con CIMA humana

- Endpoint de lista: `GET /medicamentos?nombre=` y `GET /medicamentos?practiv1=`.
- Endpoint de detalle: `GET /medicamento?nregistro=`.
- Busqueda actual implementada: combinacion de consulta por nombre comercial y principio activo usando la API oficial de CIMA.
- Enlaces disponibles en UI: ficha tecnica y prospecto cuando CIMA los expone en `docs`.

## Open source

- Licencia MIT.
- PRs con plantilla de evidencia: fuente, tipo de estudio, especie y calidad de recomendacion.
