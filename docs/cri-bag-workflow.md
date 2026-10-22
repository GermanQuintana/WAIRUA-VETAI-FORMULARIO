# Preparación CRI por bolsa — 22/10/2026

La vista principal abre «Preparar bolsa / jeringa». Se eligen volumen final (20, 50, 100, 250, 500, 1.000 mL o manual), fluido y presentaciones. La cantidad se determina mediante dosis y duración prevista, ritmo de referencia o concentración final. Es necesario fijar una de esas tres variables: el tamaño de bolsa y la dosis por sí solos no determinan cuánta masa debe contener.

La receta permanece fija al cambiar la «Velocidad elegida» del resultado. El ajuste recalcula dosis administrada, mL/kg/h y autonomía por volumen. La «Velocidad inicial de referencia» corresponde matemáticamente a la dosis mínima de la pauta seleccionada; la ayuda aclara que no es un bolo ni una orden universal de inicio. Las dosis fuera del intervalo se señalan expresamente. En combinaciones, cada bomba puede ajustarse de forma independiente y el aporte total suma todas las bombas.

El volumen elegido es **final**, incluyendo el fármaco. Se muestran mL y mg de producto, mL de diluyente y el volumen que se debe retirar de una bolsa llena. La autonomía hasta vaciar la bolsa se distingue del límite de utilización de la mezcla. Un cálculo de 25 h no acredita estabilidad durante 25 h: se conserva el cálculo de volumen y se avisa del límite de renovación o descarte que corresponda.

## Fluidos y compatibilidad

Datos por presentación en `src/data/criPreparation.ts`; una concentración introducida manualmente no hereda automáticamente la validación de un producto comercial.

- [Dexdomitor 0,5 mg/mL, ficha europea 2026](https://ec.europa.eu/health/documents/community-register/2026/20260122168568/anx_168568_es.pdf): NaCl 0,9% o Ringer lactato para CRI; seis horas tras dilución. No hay superioridad universal de uno de los dos fluidos. La ficha distingue la compatibilidad con ketamina en la misma jeringa (dos horas) de la dilución de Dexdomitor en fluido. No se trasladan estos datos a cualquier mezcla conjunta diluida de ambos fármacos en una bolsa de 100–500 mL.
- [Propofol Lipuro veterinario](https://cimavet.aemps.es/cimavet/pdfs/es/ft/1578%20ESP/1578_ESP_ft.pdf): NaCl 0,9% o glucosa 5% en las opciones de la calculadora, al menos 2 mg/mL, seis horas tras dilución. Sin diluir: renovación del sistema/reservorio como máximo a las doce horas. Ringer no se habilita como diluyente de esta formulación.
- [Midazolam B. Braun 5 mg/mL](https://cima.aemps.es/cima/dochtml/ft/68903/FT_68903.html): NaCl 0,9%, glucosa 5%, Ringer o Hartmann; intervalo documentado 0,015–0,15 mg/mL. La estabilidad fisicoquímica de 24 h no sustituye la obligación de preparación aséptica e inicio inmediato.
- [Ketolar 50 mg/mL](https://cima.aemps.es/cima/dochtml/ft/47034/FichaTecnica_47034.html): NaCl 0,9% o glucosa 5%, diluciones descritas a 1 y 2 mg/mL. Otras concentraciones se mantienen como cálculo matemático sin atribuir la estabilidad de esa ficha.
- [Seguril 10 mg/mL](https://cima.aemps.es/cima/dochtml/ft/39968/FichaTecnica_39968.html): diluyente indicado, salino isotónico; controlar pH neutro/ligeramente alcalino y utilizar lo antes posible. No se asigna un tiempo de estabilidad sin fuente.
- [Ketamidor 100 mg/mL](https://cimavet.aemps.es/cimavet/pdfs/es/ft/2695%2BESP/FT_2695%2BESP.pdf): la ficha no aporta una validación de las diluciones de la calculadora, y contraindica los trastornos convulsivos. Se explicita la diferencia entre la pauta de rescate del consenso ACVIM y la ficha de esta formulación. Los volúmenes se identifican como cálculo para revisión, sin declarar validada la mezcla.
- [Estudio de estabilidad LKD](https://ejhp.bmj.com/content/33/1/80): concentraciones de dexmedetomidina 1 µg/mL, ketamina 1 mg/mL y lidocaína 10 mg/mL en NaCl 0,9% y jeringas de polipropileno. La proporción no reproduce la pauta posoperatoria seleccionada y no demuestra estabilidad de otras proporciones ni de bolsas de Ringer. Se conservan preparaciones separadas y se explica la limitación.

La nueva investigación [S-ketamina–dexmedetomidina de 2026](https://pubmed.ncbi.nlm.nih.gov/42553891/) tampoco se convierte en una autorización genérica de bolsa conjunta: utiliza S-ketamina, concentraciones equimolares de 0,25 mM y viales de vidrio de 5 mL. No reproduce los productos, concentraciones ni envases de la calculadora.

## Comprobación

Inventario: elección de bolsa y fluido; cambios de presentación; dosis y concentración; preparación por duración, bomba y concentración final; invariancia de receta al ajustar la bomba; cálculo inverso de dosis y duración; límites de concentración y fluido; autonomía versus estabilidad; compatibilidad de combinaciones y suma de aportes; reinicio de paciente y pauta; cero, vacío, concentración desconocida y mezcla imposible; ES/EN, claro/oscuro, escritorio/móvil y ayudas de teclado/toque.

Ejemplo independiente: perro de 10 kg, propofol 0,2 mg/kg/min, stock 10 mg/mL, 100 mL finales y referencia 25 mL/h: 48 mL de producto + 52 mL de fluido. A 12,5 mL/h administra 0,1 mg/kg/min y el volumen duraría 8 h, pero la preparación diluida debe renovarse antes de 6 h. A 50 mL/h administra 0,4 mg/kg/min y dura 2 h. En ambos ajustes permanecen los mismos 48 mL de fármaco en la receta.

Los límites son documentales y específicos del producto; la selección y la titulación clínica corresponden al veterinario. No se ha modificado producción.

Preferencias confirmadas por el usuario: Dexdomitor 0,5 mg/mL y ketamina 100 mg/mL; posteriormente ha concretado Ketamidor y Ketabel, en frascos de 10 mL. Ketamidor queda como primera opción y se elimina el aviso de marca pendiente. El selector distingue concentración (100 mg/mL) de contenido total del frasco (1.000 mg/10 mL).

### Ampliación de marcas de ketamina, 22/10/2026

Todas las opciones siguientes tienen formato autorizado de 10 mL y concentración de 100 mg/mL. Se enlaza la ficha oficial, sin afirmar existencias ni comercialización actual de cada formato:

- [Ketamidor, 2695 ESP](https://cimavet.aemps.es/cimavet/pdfs/es/ft/2695%2BESP/FT_2695%2BESP.pdf): sin receta de dilución validada en la ficha; no mezclar con otros medicamentos en ausencia de estudios. Contraindicación de trastornos convulsivos.
- [Ketabel, 4052 ESP](https://cimavet.aemps.es/cimavet/pdfs/es/ft/4052%2BESP/FT_4052%2BESP.pdf): no fija diluyente ni estabilidad de las bolsas; incompatibilidad con barbitúricos y diazepam. Precaución en trastornos convulsivos.
- [Ketexx, 4090 ESP](https://cimavet.aemps.es/cimavet/pdfs/es/ft/4090%2BESP/FT_4090%2BESP.pdf): sin receta de dilución validada; no mezclar con otros medicamentos en ausencia de estudios. Precaución en trastornos convulsivos.
- [Anesketin, 2834 ESP](https://cimavet.aemps.es/cimavet/pdfs/es/ft/2834%2BESP/FT_2834%2BESP.pdf): permite NaCl 0,9%, cloruro sódico compuesto y lactato sódico compuesto (Ringer/Hartmann); no fija concentración ni duración de estabilidad diluida. Contraindica convulsiones/epilepsia.
- [Anaestamine, 3138 ESP](https://cimavet.aemps.es/cimavet/pdfs/es/ft/3138%2BESP/FT_3138%2BESP.pdf): permite NaCl 0,9%, Ringer y Ringer lactato; no fija concentración ni duración de estabilidad diluida. No mezclar con otros fármacos; precaución en trastornos convulsivos.

Los 28 días indicados en estos productos tras abrir el frasco no se convierten en estabilidad de la bolsa. Las advertencias por convulsiones se muestran según producto tanto en preparación como en cálculo de bomba. La nota de dexmedetomidina–ketamina exige revisar también la ficha de la marca de ketamina elegida.

Verificación de esta ampliación: cinco opciones con concentración/volumen/fuente correctos; igualdad de cantidades con las cinco marcas a igual concentración; reglas de salino/Ringer/glucosa sin herencia de estabilidad; advertencias distintas en status; ES/EN, claro/oscuro, escritorio/móvil y ayuda del frasco por teclado.

### Resultado

`npm run build`, `node scripts/verify-cri.mjs` y `git diff --check` correctos. Se mantiene el aviso previo de chunks grandes. Navegador: siete grupos de comprobaciones funcionales, ocho combinaciones ES/EN, claro/oscuro y 1.440/390 px, más ancho de 320 px y ayudas táctiles. También se verificó el espacio clínico con una cuenta simulada en el navegador y sin llamadas de escritura a producción. No se detectaron errores de ejecución ni desbordamiento horizontal en esas comprobaciones. Capturas: `output/playwright/cri-bag-20261022-*`; registro: `output/cri-source-20261022/bag-qa-results.json`.
