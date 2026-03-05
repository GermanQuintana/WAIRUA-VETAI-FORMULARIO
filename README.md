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
VITE_CIMAVET_BASE_URL=
VITE_CIMAVET_API_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Estructura

- `src/data/entries.ts`: dataset inicial de ejemplo.
- `src/types.ts`: tipos de datos terapeuticos y referencias.
- `src/services/cimavet.ts`: cliente de integracion CIMAVet (lista paginada, detalle por `nregistro`, carga de catalogo y filtro local por nombre/principio activo).
- `supabase/schema.sql`: propuesta inicial de modelo relacional para autenticacion y contenido colaborativo.

## Estado de integracion con CIMAVet

- Endpoint de lista: `GET /medicamentos/?pagina=&tamanioPagina=`.
- Endpoint de detalle: `GET /medicamento/?nregistro=`.
- Busqueda actual implementada: filtro local sobre catalogo CIMAVet por `nombre` y `pactivos`.
- Filtro opcional por especie: se apoya en consulta de detalle por `nregistro`.

## Proxima fase recomendada

- Login con Supabase Auth y Google OAuth.
- Roles (`viewer`, `editor`, `reviewer`, `admin`) para control de cambios.
- Flujo editorial con estados (`draft`, `under_review`, `approved`).
- Sincronizacion bidireccional con API de Cimavet.
- Auditoria de cambios por entrada y trazabilidad de referencias.

## Open source

- Licencia MIT.
- PRs con plantilla de evidencia: fuente, tipo de estudio, especie y calidad de recomendacion.
