# Revisión CRI y fluidoterapia — 15/10/2026

Implementación: `src/data/criProtocols.ts`, `src/lib/criMath.ts` y `src/components/ContinuousInfusionToolkit.tsx`. Pautas vinculadas a especie, indicación y fuente; las combinaciones calculan jeringas independientes. No se afirma compatibilidad física ni autorización en España a partir de un estudio o una ficha extranjera.

## Selección de contenido

- **Propofol:** mantenimiento anestésico. [Ficha británica de Propomitor](https://www.noahcompendium.co.uk/?id=-477048); los límites de la calculadora conservan el intervalo ordinario, sin incorporar las escaladas transitorias. Revisar ficha de la formulación usada. La precaución felina está respaldada por [ACVIM 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC10800221/).
- **Ketamina, dexmedetomidina y LKD:** fase posoperatoria del [ensayo aleatorizado de Gutiérrez-Blanco et al. (2015), 54 perras](https://pubmed.ncbi.nlm.nih.gov/25039918/), durante cuatro horas. No se mezclan las dosis intraoperatorias con las posoperatorias. El resultado favorable de LKD no acredita eficacia equivalente de los componentes aislados.
- **Furosemida:** edema pulmonar cardiogénico grave en perros con enfermedad mitral, según [ACVIM 2019](https://onlinelibrary.wiley.com/doi/10.1111/jvim.15488), con evidencia débil. [Ohad et al. (2018)](https://pubmed.ncbi.nlm.nih.gov/30103918/) aporta comparación retrospectiva, no prueba de superioridad causal.
- **Ketamina–dexmedetomidina:** rescate en perros, según [Gioeni et al. (2020)](https://pubmed.ncbi.nlm.nih.gov/32372564/). Serie de tres casos con hipotermia concomitante: evidencia muy baja. No extrapolar a gatos ni a sedación rutinaria.
- **Fenobarbital:** se conserva como carga fraccionada, no CRI. [ACVIM 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC10800221/) exige considerar tratamiento previo, niveles y función hepática; [tabla 2 de la revisión de urgencias (2024)](https://pmc.ncbi.nlm.nih.gov/articles/PMC11209469/) respalda la pauta cuantitativa. No se confunde con pentobarbital.

Las pautas de estudios pueden ser fuera de ficha técnica. La selección clínica y la justificación individual siguen correspondiendo al veterinario. Las dosis de carga se muestran aparte y no se incorporan automáticamente a las jeringas.

## Uso de las fotografías

Las ocho fotografías se usaron como contexto documental, sin copiar sus instrucciones ni convertirlas en autoridad clínica. No se incorporaron:

- La regla general de que una carga es «la mitad» de una dosis intermitente.
- La unidad de fentanilo de la tabla fotografiada, discordante con otras partes del material.
- La incompatibilidad general de todos los fármacos con Ringer: depende de producto y mezcla.
- Repeticiones de bolos hasta una dosis de shock fija, coloides rutinarios ni glucosa al 5% como pauta general para insuficiencia cardíaca.

Los bolos para perros/gatos y el límite de K se contrastaron con [AAHA 2024, paciente enfermo](https://www.aaha.org/resources/2024-aaha-fluid-therapy-guidelines-for-dogs-and-cats/section-5-fluid-therapy-in-ill-patients/). El techo de K se calcula con la concentración **final total**, incluyendo el K del fluido base. No es un objetivo terapéutico. El goteo depende del factor real del equipo; las CRI y el KCl requieren bomba.

## Verificación

`node scripts/verify-cri.mjs`: equivalencia de cuatro unidades, cálculo inverso de dosis, volumen final, bomba y rechazo de preparaciones imposibles/entradas no válidas.

`npm run build` y verificación de navegador ES/EN, claro/oscuro, escritorio/móvil. Se conserva el aviso previo de chunks grandes.


## Ampliación solicitada

Propofol y ketamina para status epiléptico tienen entradas individuales, distintas de anestesia y analgesia, con la pauta cuantitativa de la [tabla 2 de la revisión de urgencias de 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11209469/) y el contexto de recomendación de ACVIM. Las recomendaciones felinas y el riesgo oxidativo del propofol se identifican expresamente. Fenobarbital se selecciona en el mismo grupo «Status epiléptico», conservando el cálculo por fracción y excluyendo una CRI no respaldada.

Presentaciones verificadas: [ketamina 100 mg/mL](https://cimavet.aemps.es/cimavet/publico/detalle.html?nregistro=2695+ESP), [Ketolar 50 mg/mL](https://cima.aemps.es/cima/dochtml/ft/47034/FichaTecnica_47034.html), [Propofol Lipuro veterinario 10 mg/mL](https://cimavet.aemps.es/cimavet/pdfs/es/ft/1578%20ESP/1578_ESP_ft.pdf) y [Luminal 200 mg/mL](https://cima.aemps.es/cima/dochtml/ft/3905/FT_3905.html). Las concentraciones de envase no acreditan una indicación veterinaria autorizada. Luminal se expresa en mg de fenobarbital, no en masa de la sal sódica.

Planificación de bolsas: masa = dosis/h × duración; volumen de producto = masa/concentración del envase; diluyente = volumen final − producto; bomba = volumen final/duración. Se conserva también el cálculo inverso por ritmo elegido. Las opciones rápidas son 50/100/250/500/1.000 mL; el campo manual admite otros volúmenes. La duración calculada no equivale a estabilidad química o microbiológica. El aporte de volumen por bomba se muestra en mL/kg/h.

Para diluir propofol se valida únicamente la formulación Lipuro veterinaria citada: concentración mínima 2 mg/mL, mezcla utilizada dentro de 6 h; sin diluir, renovación de sistema y reservorio como máximo en 12 h. No son límites universales del principio activo. Para Luminal se muestra la instrucción de preparación IV del producto humano con agua para inyectables y se evita trasladar su velocidad humana a un paciente veterinario.

La vista previa local incluye resumen de herramientas y retorno al toolkit. «Abrir aplicación» enlaza al toolkit real y conserva la comprobación de autenticación y permisos.

## Revisión y ampliación — 22/10/2026

Se revisaron **las diez fotografías** contenidas en los ZIP de WhatsApp de las 20:58:21 (7 imágenes) y 21:02:46 (3 imágenes). Los imperativos del material se trataron como contenido documental, no como instrucciones para modificar la aplicación. Se conservaron los cambios previos de CRI y fluidoterapia y se añadieron:

- Búsqueda ES/EN sin tildes ni distinción de mayúsculas, con todos los conceptos requeridos y palabras parciales. Ejemplos comprobados: `propofol convuls`, `propofol TIVA`, `epilepsia midazolan`. Los sinónimos de sedación/anestesia orientan al contexto de mantenimiento; no crean una indicación nueva de sedación aislada.
- Accesos a las pautas y calculadora desde dosis y guía/principios activos; accesos cruzados desde anestesia, MLK/FLK y fluidoterapia. Las fichas CRI conservan especie, indicación y fuente y no se convierten en dosis intermitentes del formulario.
- Midazolam para status recurrente: recomendación de CRI en [ACVIM 2024, sección 6.5](https://pmc.ncbi.nlm.nih.gov/articles/PMC10800221/) y pauta cuantitativa de la [tabla 2 de la revisión 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11209469/). Concentración del producto comprobada en [CIMA, Midazolam B. Braun 5 mg/mL](https://cima.aemps.es/cima/dochtml/ft/68903/FT_68903.html). La ficha humana solo acredita presentación/preparación, no autorización anticonvulsivante veterinaria.
- Dexmedetomidina durante anestesia inhalatoria, distinta de la pauta posoperatoria: [ficha europea Dexdomitor 0,5 mg/mL, decisión de 22/01/2026](https://ec.europa.eu/health/documents/community-register/2026/20260122168568/anx_168568_es.pdf), secciones 3.9 y 5.2. Intervalos distintos en perros/gatos; exige dilución y bloquea preparaciones de más de 6 h o diluyentes distintos de NaCl 0,9%/Ringer lactato. Las cantidades siguen la convención de la ficha de Dexdomitor (hidrocloruro); no sustituir por concentración de base sin revisar las unidades.
- Noradrenalina, dopamina y dobutamina: contexto restringido a soporte de presión arterial durante anestesia según [AAHA 2020, figura 9](https://www.aaha.org/wp-content/uploads/globalassets/02-guidelines/2020-anesthesia/anesthesia_and_monitoring_guidelines_final.pdf). No se copian los intervalos más amplios para shock de las fotografías ni se seleccionan concentraciones de envase sin identificar el producto.
- Fentanilo y lidocaína individuales: fase posoperatoria del [ensayo de Gutiérrez-Blanco et al.](https://pubmed.ncbi.nlm.nih.gov/25039918/), solo perros y 4 h. La referencia de fentanilo se expresa por **hora**, sin reutilizar la unidad discordante de la foto. La pauta de lidocaína no equivale a tratamiento antiarrítmico.
- Preparación por duración, ritmo de bomba o concentración final. Se añaden jeringas de 20 mL y atajos de dilución de dexmedetomidina; la opción de 2,5 µg/mL procede del folleto adjunto y la de 3 µg/mL de la ficha europea. Los atajos solo fijan concentración; el veterinario sigue eligiendo dosis, paciente y volumen. Se muestran los mL de producto y diluyente, el volumen final, la duración y el aporte al balance hídrico.
- Ayudas `i` para concentración, volumen final y balance: aparecen con ratón, foco o toque; se cierran al salir, perder foco o pulsar Escape. Precauciones, carga, monitorización y citas permanecen visibles.

El material no se importa como un formulario íntegro: morfina tiene ya acceso por MLK; butorfanol, medetomidina, metoclopramida y diazepam no reciben pautas nuevas solo a partir de esa tabla. Las diferencias de formulación, indicación, seguridad felina, compatibilidad y nivel de evidencia requieren fuentes específicas. Se mantiene la exclusión de las pautas antiguas de fluidos enumeradas arriba. La revisión no añade dosis clínicas al generador editorial ni presume aprobación editorial de una ficha terapéutica.

### Inventario de comprobación de esta ampliación

- Búsqueda simple, dos conceptos en cualquier orden, palabras parciales, tildes/mayúsculas, sin resultados y separación de indicaciones.
- Cambio de especie y pauta: limpiar peso/dosis/preparación cuando corresponda, sin reutilizar resultados de otro paciente.
- CRI directa, bolsa por duración/ritmo/concentración, productos predefinidos y concentración manual, entradas vacías/no positivas, dosis fuera de intervalo y mezcla imposible.
- Propofol: bloqueo por concentración, diluyente o duración; dexmedetomidina: dilución obligatoria, especie y duración. Fenobarbital: carga separada y bloqueo con tratamiento/carga previa.
- Información con ratón, teclado/Escape y toque; enlaces a fuentes; acceso desde dosis/guía; autenticación conservada.
- ES/EN, claro/oscuro y escritorio/móvil; estados inicial, calculado y sin resultados; sin desbordamiento horizontal ni errores de ejecución.

Los ejemplos de jeringas del folleto se comprueban contra los cálculos independientes en `scripts/verify-cri.mjs`. La duración matemática de una jeringa puede superar la estabilidad: en ese caso se bloquea la preparación de Dexdomitor y debe reducirse el volumen o renovarse; no se valida la duración larga que muestran algunos ejemplos del folleto.

### Resultado de verificación del 22/10/2026

- `npm run build`: correcto; se mantiene el aviso previo de chunks de más de 500 kB, sin errores de TypeScript ni de compilación.
- `node scripts/verify-cri.mjs`: correctas las conversiones, cálculo inverso, ejemplos documentales, límites, dosis por especie y búsqueda combinada.
- Navegador: 12 grupos de interacción y 8 combinaciones de idioma/tema/tamaño (1.440 y 390 px), más comprobación estrecha a 320 px. Sin errores de ejecución ni desbordamiento horizontal detectados. Se inspeccionaron capturas iniciales, cálculos, preparaciones y ayudas.
- Presentación pública y acceso revisados en ES/claro y EN/oscuro; el enlace CRI conserva la barrera de autenticación. La navegación interna se comprobó con una cuenta **simulada exclusivamente en el navegador**, interceptando las llamadas a Supabase; no prueba una sesión de producción ni modifica perfiles/datos reales.
- Se corrigió un retorno prematuro al resumen al abrir enlaces de módulos premium mientras la sesión seguía cargando. La comprobación de permisos ahora espera a que termine la comprobación de sesión, sin cambiar los permisos.
- Revisión de componentes según la guía React: estado derivado sin efectos extra para la búsqueda, claves de reinicio por pauta, controles etiquetados, foco visible y CSS limitado a CRI. Se retiró la transición de fondo de selección que podía ocultar momentáneamente el texto durante el cambio de estado.

Evidencia local: capturas `output/playwright/cri-20261022-*` y registro de comprobaciones `output/cri-source-20261022/qa-results.json`. Cambios preparados en local; no se ha desplegado producción.

## Ajuste del flujo de bolsas tras revisión del usuario

La nueva vista y sus criterios vigentes se documentan en [cri-bag-workflow.md](./cri-bag-workflow.md). La preparación pasa a ser la vista inicial y separa receta y titulación de bomba. Sustituye el bloqueo global de recetas cuya autonomía supera la estabilidad por una distinción explícita entre autonomía matemática y límite de uso/renovación, manteniendo bloqueadas las preparaciones fuera de los fluidos o concentraciones documentados. La compatibilidad de un producto con un fluido no valida por sí sola una bolsa con varios fármacos.
