import { DoseCalculatorEntry, Species } from '../types';

const rawSpreadsheetDoseTable = `Categoría	Subcategoría	Principio activo	AMEG UE	Especie	Indicación	Dosis	Unidad	Vía	Frecuencia	Duración	Observaciones	Bibliografía
Antiinfecciosos Sistémicos	Aminoglucósidos	Amikacina	C	Gato	Dosis usual	10-15	mg/kg	IV/IM/SC	c24h		Farmacopea de EE. UU.	
Antiinfecciosos Sistémicos	Aminoglucósidos	Amikacina	C	Gato	Infecciones respiratorias graves	10	mg/kg	IV/IM/SC	c24h		No administrar a pacientes con insuficiencia renal ni deshidratados.	
Antiinfecciosos Sistémicos	Aminoglucósidos	Amikacina	C	Perro	Dosis usual	15-30	mg/kg	IV/IM/SC	c24h		Farmacopea de EE. UU.	
Antiinfecciosos Sistémicos	Aminoglucósidos	Amikacina	C	Perro	Infecciones respiratorias graves	15	mg/kg	IV/IM/SC	c24h		No administrar a pacientes con insuficiencia renal ni deshidratados.	
Antiinfecciosos Sistémicos	Aminoglucósidos	Amikacina	C	Perro/Gato	Choque	15	mg/kg	IV	c24h		No administrar a pacientes con insuficiencia renal ni deshidratados.	
Antiinfecciosos Sistémicos	Aminoglucósidos	Estreptomicina	C	Perro	Brucelosis	5-10	mg/kg	IM	c12h			
Antiinfecciosos Sistémicos	Aminoglucósidos	Gentamicina	C	Gato	Dosis usual	5-8	mg/kg	IV/IM/SC	c24h		Farmacopea de EE. UU.	
Antiinfecciosos Sistémicos	Aminoglucósidos	Gentamicina	C	Gato	Infecciones respiratorias graves	5-8	mg/kg	IV	c24h		No administrar a pacientes con insuficiencia renal, deshidratados ni hembras gestantes.	
Antiinfecciosos Sistémicos	Aminoglucósidos	Gentamicina	C	Perro	Dosis usual	10-15	mg/kg	IV/IM/SC	c24h		Farmacopea de EE. UU.	
Antiinfecciosos Sistémicos	Aminoglucósidos	Gentamicina	C	Perro	Infecciones respiratorias graves	9-14	mg/kg	IV	c24h		No administrar a pacientes con insuficiencia renal, deshidratados ni hembras gestantes.	
Antiinfecciosos Sistémicos	Aminoglucósidos	Gentamicina	C	Perro/Gato	Choque	8	mg/kg	IV	c24h		No administrar a pacientes con insuficiencia renal, deshidratados ni hembras gestantes.	
Antiinfecciosos Sistémicos	Aminoglucósidos	Neomicina	C	Perro/Gato	Encefalopatía hepática	20	mg/kg	VO	c8h			
Antiinfecciosos Sistémicos	Aminoglucósidos	Paromomicina	C	Perro	Criptosporidiosis	10	mg/kg	VO	c8h	5-10 días		
Antiinfecciosos Sistémicos	Aminoglucósidos	Tobramicina	C	Perro/Gato	Choque	2-4	mg/kg	IV	c8h			
Antiinfecciosos Sistémicos	Antifúngicos	Amfotericina B		Gato	Criptococosis	0,5-0,8	mg/kg	IV diluida	2-3 veces por semana	hasta dosis acumulativa de 20 mg/kg	Diluir en 400 mL de NaCl al 0,45% y glucosa al 2,5%.	
Antiinfecciosos Sistémicos	Antifúngicos	Fluconazol		Gato	Cistitis fúngica	50	mg/gato	VO	c12h			
Antiinfecciosos Sistémicos	Antifúngicos	Fluconazol		Perro	Cistitis fúngica	1,25-2,50	mg/kg	VO/IV	c12h			
Antiinfecciosos Sistémicos	Antifúngicos	Fluconazol		Perro/Gato	Aspergilosis	2,5-5,0	mg/kg	VO	c12h	3-6 meses	Ver dosis en caso de afectación del SNC.	
Antiinfecciosos Sistémicos	Antifúngicos	Fluconazol		Perro/Gato	Criptococosis	10	mg/kg	VO	c12h	3-6 meses		
Antiinfecciosos Sistémicos	Antifúngicos	Fluconazol		Perro/Gato	Dermatofitosis felina y dermatitis canina por Malassezia	5	mg/kg	VO	c24h			
Antiinfecciosos Sistémicos	Antifúngicos	Itraconazol		Gato	Criptococosis	50-100	mg/gato	VO	c24h	8-9 meses	50 mg/gato en gatos <3,2 kg y 100 mg/gato en gatos >3,2 kg. No administrar en insuficiencia hepática o renal, ni a gestantes o lactantes.	
Antiinfecciosos Sistémicos	Antifúngicos	Itraconazol		Gato	Dermatofitosis	5	mg/kg	VO	c24h	en semanas alternas		
Antiinfecciosos Sistémicos	Antifúngicos	Itraconazol		Perro	Dermatitis por Malassezia	5	mg/kg	VO	c24h	2 días consecutivos a la semana		
Antiinfecciosos Sistémicos	Antifúngicos	Itraconazol		Perro	Dermatofitosis	5-10	mg/kg	VO	c24h	al mes, pasar a semanas alternas		
Antiinfecciosos Sistémicos	Antifúngicos	Itraconazol		Perro/Gato	Aspergilosis; rinitis alérgica o linfoplasmocitaria	5-10	mg/kg	VO	c24-12h	3-6 meses	Usar c12h en rinitis alérgica o linfoplasmocitaria.	
Antiinfecciosos Sistémicos	Antifúngicos	Posaconazol		Gato	Aspergilosis	2,5-4,5	mg/kg	VO	c12h		No administrar a hembras gestantes ni lactantes.	
Antiinfecciosos Sistémicos	Antifúngicos	Voriconazol		Gato	Aspergilosis	5-12	mg/kg	VO	c24h		Vigilar posibles efectos secundarios.	
Antiinfecciosos Sistémicos	Antivirales	Famciclovir		Gato	Herpesvirosis felina	62,5-125,0	mg/gato	VO	c12-24h			
Antiinfecciosos Sistémicos	Antivirales	Remdesivir		Gato	Peritonitis infecciosa felina	8-15	mg/kg	SC	c24h			
Antiinfecciosos Sistémicos	Antivirales	Zidovudina		Gato	Leucemia felina vírica	5-10	mg/kg	VO/SC	c12h	7 semanas		
Antiinfecciosos Sistémicos	Carbapenémicos	Imipenem-cilastatina	A	Perro/Gato	Infecciones respiratorias bacterianas multirresistentes	3-10	mg/kg	IV/IM	c8h		Dosis expresada como imipenem; usar la dosis superior por vía IV en caso de neumonía.	
Antiinfecciosos Sistémicos	Carbapenémicos	Meropenem	A	Gato	Infecciones respiratorias bacterianas multirresistentes	10	mg/kg	SC/IM/IV	c12h			
Antiinfecciosos Sistémicos	Carbapenémicos	Meropenem	A	Perro	Infecciones respiratorias bacterianas multirresistentes	24	mg/kg	IV	c12h		Alternativa a 8,5 mg/kg SC c12h.	
Antiinfecciosos Sistémicos	Carbapenémicos	Meropenem	A	Perro	Infecciones respiratorias bacterianas multirresistentes	8,5	mg/kg	SC	c12h		Alternativa: 24 mg/kg IV c12h.	
Antiinfecciosos Sistémicos	Cefalosporinas 1ª gen.	Cefadroxilo	C	Gato	Neumonía bacteriana	22	mg/kg	VO	c24h		No ha quedado demostrada su seguridad durante la gestación y lactancia.	
Antiinfecciosos Sistémicos	Cefalosporinas 1ª gen.	Cefadroxilo	C	Perro	Neumonía bacteriana	11-22	mg/kg	VO	c12h		No ha quedado demostrada su seguridad durante la gestación y lactancia.	
Antiinfecciosos Sistémicos	Cefalosporinas 1ª gen.	Cefadroxilo	C	Perro/Gato	Piodermas caninas e infecciones bacterianas del tracto urinario	10-22	mg/kg	VO	c12h		No ha quedado demostrada su seguridad durante la gestación y lactancia.	
Antiinfecciosos Sistémicos	Cefalosporinas 1ª gen.	Cefalexina	C	Perro/Gato	Colangitis neutrofílica y pancreatitis felinas; hepatitis crónica canina no asociada al cobre	15	mg/kg	VO	c12h			
Antiinfecciosos Sistémicos	Cefalosporinas 1ª gen.	Cefalexina	C	Perro/Gato	Otitis intensa	22	mg/kg	VO	c12h			
Antiinfecciosos Sistémicos	Cefalosporinas 1ª gen.	Cefalexina	C	Perro/Gato	Piodermas caninas; infecciones bacterianas del tracto urinario; mastitis con pH leche >7,4	15-30	mg/kg	VO	c12h		En mastitis y piodermas intensas, usar la dosis superior.	
Antiinfecciosos Sistémicos	Cefalosporinas 1ª gen.	Cefazolina	C	Perro/Gato	Choque	20	mg/kg	IV	c8h			
Antiinfecciosos Sistémicos	Cefalosporinas 1ª gen.	Cefazolina	C	Perro/Gato	Colangitis neutrofílica y pancreatitis felinas; hepatitis crónica canina no asociada al cobre	15-30	mg/kg	SC/IM	c8h			
Antiinfecciosos Sistémicos	Cefalosporinas 1ª gen.	Cefazolina	C	Perro/Gato	Neumonía bacteriana	25	mg/kg	SC/IM/IV	c6h			
Antiinfecciosos Sistémicos	Cefalosporinas 3ª gen.	Cefotaxima	B	Perro/Gato	Meningitis bacteriana	30-80	mg/kg	IV	c6-8h			
Antiinfecciosos Sistémicos	Cefalosporinas 3ª gen.	Cefovecina	B	Perro	Piodermas caninas; infección del tracto respiratorio superior	8	mg/kg	SC	cada 14 días		Ver frecuencia en infecciones respiratorias en el capítulo correspondiente. No administrar a animales de menos de 8 semanas; no ha quedado demostrada su seguridad durante la gestación y lactancia.	
Antiinfecciosos Sistémicos	Fluoroquinolonas	Enrofloxacino	B	Gato	Hemoplasmosis	5	mg/kg	VO	c24h		No administrar a animales en crecimiento o menores de 8 meses (gatos), 12 meses (perros) y 18 meses (razas gigantes); precaución en epilepsia o trastornos del cartílago de crecimiento; no administrar a gestantes ni lactantes. En dosis >5 mg/kg c24h existe riesgo de daño retiniano en gatos.	
Antiinfecciosos Sistémicos	Fluoroquinolonas	Enrofloxacino	B	Perro	Enteritis crónica	10-15	mg/kg	VO	c24h			
Antiinfecciosos Sistémicos	Fluoroquinolonas	Enrofloxacino	B	Perro/Gato	Choque						Ver posología en el artículo correspondiente.	
Antiinfecciosos Sistémicos	Fluoroquinolonas	Enrofloxacino	B	Perro/Gato	Colangitis neutrofílica y pancreatitis felinas; hepatitis crónica canina no asociada al cobre	5	mg/kg	VO	c24h		Combinado con metronidazol.	
Antiinfecciosos Sistémicos	Fluoroquinolonas	Enrofloxacino	B	Perro/Gato	Diarrea aguda	5	mg/kg	SC/IV lento	c24h			
Antiinfecciosos Sistémicos	Fluoroquinolonas	Enrofloxacino	B	Perro/Gato	Infecciones respiratorias	5-20	mg/kg	VO/IM/IV	c24h			
Antiinfecciosos Sistémicos	Fluoroquinolonas	Enrofloxacino	B	Perro/Gato	Otitis intensa	5	mg/kg	VO/SC	c24h		Frente a Pseudomonas aeruginosa, 20 mg/kg VO/SC c24h.	
Antiinfecciosos Sistémicos	Fluoroquinolonas	Enrofloxacino	B	Perro/Gato	Piodermas caninas; piometra; orquitis-epididimitis; prostatitis por gramnegativos; infecciones bacterianas del tracto urinario	5	mg/kg	VO/SC	c24h		En piodermas intensas, hasta 20 mg/kg diarios.	
Antiinfecciosos Sistémicos	Fluoroquinolonas	Marbofloxacino	B	Gato	Hemoplasmosis	2	mg/kg	VO	c24h		No administrar a animales en crecimiento, menores de 16 semanas (gatos), 12 meses (perros) o 18 meses (razas gigantes), ni a pacientes con epilepsia; no ha quedado demostrada su seguridad durante la gestación y lactancia.	
Antiinfecciosos Sistémicos	Fluoroquinolonas	Marbofloxacino	B	Perro/Gato	Infecciones respiratorias	2,7-5,5	mg/kg	VO	c24h		No administrar a animales en crecimiento, menores de 16 semanas (gatos), 12 meses (perros) o 18 meses (razas gigantes), ni a pacientes con epilepsia; no ha quedado demostrada su seguridad durante la gestación y lactancia.	
Antiinfecciosos Sistémicos	Fluoroquinolonas	Pradofloxacino	B	Gato	Hemoplasmosis	5	mg/kg	VO	c24h		No administrar a perros en crecimiento de razas pequeñas, medianas y grandes (<12 meses) o gigantes (<18 meses), a gatos menores de 6 semanas, a epilépticos, ni a hembras gestantes o lactantes.	
Antiinfecciosos Sistémicos	Fluoroquinolonas	Pradofloxacino	B	Perro/Gato	Infecciones respiratorias	5	mg/kg	VO	c12h		Para comprimidos; en solución oral en gatos, 7,5 mg/kg VO c24h.	
Antiinfecciosos Sistémicos	Fluoroquinolonas	Pradofloxacino	B	Perro/Gato	Piodermas caninas	3	mg/kg	VO	c24h		En solución oral, 5 mg/kg.	
Antiinfecciosos Sistémicos	Imidazoles	Metronidazol	D	Gato	Enteritis crónica	15	mg/kg	VO	c24h			
Antiinfecciosos Sistémicos	Imidazoles	Metronidazol	D	Gato	Gastritis por Helicobacter	10	mg/kg	VO	c12h		Combinado con otros fármacos.	
Antiinfecciosos Sistémicos	Imidazoles	Metronidazol	D	Gato	Tétanos	250	mg/gato	VO	c12-24h			
Antiinfecciosos Sistémicos	Imidazoles	Metronidazol	D	Perro	Enteritis crónica	10	mg/kg	VO	c12h			
Antiinfecciosos Sistémicos	Imidazoles	Metronidazol	D	Perro	Tétanos	10	mg/kg	VO	c8h			
Antiinfecciosos Sistémicos	Imidazoles	Metronidazol	D	Perro/Gato	Choque e infecciones respiratorias graves	8-15	mg/kg	IV	c8h			
Antiinfecciosos Sistémicos	Imidazoles	Metronidazol	D	Perro/Gato	Colangitis neutrofílica y pancreatitis felinas; hepatitis crónica canina no asociada al cobre	7,5	mg/kg	VO	c12h		Combinado con enrofloxacina.	
Antiinfecciosos Sistémicos	Imidazoles	Metronidazol	D	Perro/Gato	Diarrea aguda	10-20	mg/kg	IV/VO	c12h			
Antiinfecciosos Sistémicos	Imidazoles	Metronidazol	D	Perro/Gato	Encefalopatía hepática	7,5	mg/kg	VO	c12h			
Antiinfecciosos Sistémicos	Imidazoles	Metronidazol	D	Perro/Gato	Enfermedad periodontal	10	mg/kg	VO	c12h		Combinado o no con espiramicina.	
Antiinfecciosos Sistémicos	Imidazoles	Ronidazol	D	Gato	Tricomoniasis	30	mg/kg	VO	c24h	2 semanas		
Antiinfecciosos Sistémicos	Lincosamidas	Clindamicina	C	Gato	Infecciones respiratorias	10-15	mg/kg	VO/SC	c12h		En neumonía bacteriana, hasta 20 mg/kg IV/SC c12h.	
Antiinfecciosos Sistémicos	Lincosamidas	Clindamicina	C	Perro	Infecciones respiratorias	10	mg/kg	VO/SC	c12h		En neumonía bacteriana, hasta 20 mg/kg IV/SC c12h.	
Antiinfecciosos Sistémicos	Lincosamidas	Clindamicina	C	Perro	Neosporosis	12,5	mg/kg	VO	c8h	4-8 semanas	Combinada con sulfadiazina-trimetoprim.	
Antiinfecciosos Sistémicos	Lincosamidas	Clindamicina	C	Perro/Gato	Choque	11	mg/kg	IV lento	c8h		No ha quedado demostrada su seguridad durante la gestación y lactancia.	
Antiinfecciosos Sistémicos	Lincosamidas	Clindamicina	C	Perro/Gato	Enfermedad periodontal y gingivoestomatitis crónica felina; prostatitis por grampositivos	5,5-11,0	mg/kg	VO	c12h			
Antiinfecciosos Sistémicos	Lincosamidas	Clindamicina	C	Perro/Gato	Piodermas caninas y abscesos	11	mg/kg	VO	c24h		En piodermas intensas, hasta 10 mg/kg c12h.	
Antiinfecciosos Sistémicos	Lincosamidas	Clindamicina	C	Perro/Gato	Toxoplasmosis	12,5	mg/kg	VO	c12h	4 semanas		
Antiinfecciosos Sistémicos	Lincosamidas	Lincomicina	C	Perro/Gato	Mastitis con pH leche <7,3	15	mg/kg	VO	c8h			
Antiinfecciosos Sistémicos	Macrólidos	Azitromicina	C	Perro/Gato	Babesiosis canina por B. gibsoni y B. vulpes; cytauxzoonosis felina	10	mg/kg	VO	c24h	10 días	Asociada a atovacuona.	
Antiinfecciosos Sistémicos	Macrólidos	Azitromicina	C	Perro/Gato	Dosis usual	3-5	mg/kg	VO	c24h	3-4 dosis	Si se necesita tratamiento prolongado, administrar 3-4 días a la semana (en días alternos o 3 días consecutivos).	
Antiinfecciosos Sistémicos	Macrólidos	Azitromicina	C	Perro/Gato	Infecciones respiratorias	5-10	mg/kg	VO	c12h el primer día, seguido c72h			
Antiinfecciosos Sistémicos	Macrólidos	Claritromicina	C	Perro/Gato	Gastritis por Helicobacter	7,5	mg/kg	VO	c12h		Combinada con otros fármacos.	
Antiinfecciosos Sistémicos	Macrólidos	Eritromicina	C	Perro/Gato	Mastitis con pH leche <7,3; prostatitis por grampositivos	10	mg/kg	VO	c8h			
Antiinfecciosos Sistémicos	Macrólidos	Tilosina	C	Gato	Criptosporidiosis	10-15	mg/kg	VO	c12h			
Antiinfecciosos Sistémicos	Macrólidos	Tilosina	C	Perro	Enteritis crónica	25	mg/kg	VO	c24h			
Antiinfecciosos Sistémicos	Penicilinas	Amoxicilina	D	Perro/Gato	Abscesos	20	mg/kg	VO	c12h		No ha quedado demostrada su seguridad durante la gestación y lactancia.	
Antiinfecciosos Sistémicos	Penicilinas	Amoxicilina	D	Perro/Gato	Colangitis neutrofílica y pancreatitis felinas; hepatitis crónica canina no asociada al cobre	10-20	mg/kg	VO	c12h		No ha quedado demostrada su seguridad durante la gestación y lactancia.	
Antiinfecciosos Sistémicos	Penicilinas	Amoxicilina	D	Perro/Gato	Encefalopatía hepática	10-15	mg/kg	VO	c8h		No ha quedado demostrada su seguridad durante la gestación y lactancia.	
Antiinfecciosos Sistémicos	Penicilinas	Amoxicilina	D	Perro/Gato	Gastritis por Helicobacter	20	mg/kg	VO	c12h		Combinada con otros fármacos. No ha quedado demostrada su seguridad durante la gestación y lactancia.	
Antiinfecciosos Sistémicos	Penicilinas	Amoxicilina	D	Perro/Gato	Infecciones bacterianas del tracto urinario	12-22	mg/kg	VO	c8-12h		No ha quedado demostrada su seguridad durante la gestación y lactancia.	
Antiinfecciosos Sistémicos	Penicilinas	Amoxicilina	D	Perro/Gato	Profilaxis tratamiento periodontal	20	mg/kg	IM	Dosis única	30 min antes	No ha quedado demostrada su seguridad durante la gestación y lactancia.	
Antiinfecciosos Sistémicos	Penicilinas	Amoxicilina + ácido clavulánico	C	Gato	Infección del tracto respiratorio superior	12,5	mg/kg	VO	c12h		Dosis de la asociación. Se recomienda relación amoxicilina:ácido clavulánico 4:1. No ha quedado demostrada su seguridad durante la gestación y lactancia.	
Antiinfecciosos Sistémicos	Penicilinas	Amoxicilina + ácido clavulánico	C	Perro	Infección del tracto respiratorio superior	11	mg/kg	VO	c12h		Dosis de la asociación. Se recomienda relación amoxicilina:ácido clavulánico 4:1. No ha quedado demostrada su seguridad durante la gestación y lactancia.	
Antiinfecciosos Sistémicos	Penicilinas	Amoxicilina + ácido clavulánico	C	Perro/Gato	Discospondilitis y artritis supurativa	12,5-22,0	mg/kg	VO	c12h		Dosis de la asociación. Se recomienda relación amoxicilina:ácido clavulánico 4:1. No ha quedado demostrada su seguridad durante la gestación y lactancia.	
Antiinfecciosos Sistémicos	Penicilinas	Amoxicilina + ácido clavulánico	C	Perro/Gato	Infecciones urogenitales intensas	12,5-25,0	mg/kg	VO	3 veces al día		Dosis de la asociación. Se recomienda relación amoxicilina:ácido clavulánico 4:1. No ha quedado demostrada su seguridad durante la gestación y lactancia.	
Antiinfecciosos Sistémicos	Penicilinas	Amoxicilina + ácido clavulánico	C	Perro/Gato	Neumonía bacteriana	10-20	mg/kg	VO	c8h		Dosis de la asociación. Se recomienda relación amoxicilina:ácido clavulánico 4:1. No ha quedado demostrada su seguridad durante la gestación y lactancia.	
Antiinfecciosos Sistémicos	Penicilinas	Amoxicilina + ácido clavulánico	C	Perro/Gato	Piodermas caninas; diarrea aguda; colangitis neutrofílica y pancreatitis felinas; hepatitis crónica canina no asociada al cobre; piometra; infecciones bacterianas del tracto urinario	12,5-25,0	mg/kg	VO	c12h		Dosis de la asociación. Se recomienda relación amoxicilina:ácido clavulánico 4:1. No ha quedado demostrada su seguridad durante la gestación y lactancia.	
Antiinfecciosos Sistémicos	Penicilinas	Ampicilina	D	Perro/Gato	Choque	20-40	mg/kg	IV	c6-8h			
Antiinfecciosos Sistémicos	Penicilinas	Ampicilina	D	Perro/Gato	Diarrea aguda	10-20	mg/kg	IV	c6-8h		Régimen alternativo.	
Antiinfecciosos Sistémicos	Penicilinas	Ampicilina	D	Perro/Gato	Diarrea aguda	22	mg/kg	VO	c8-12h		Régimen alternativo.	
Antiinfecciosos Sistémicos	Penicilinas	Ampicilina	D	Perro/Gato	Encefalopatía hepática	20	mg/kg	IV	c6-8h			
Antiinfecciosos Sistémicos	Penicilinas	Ampicilina	D	Perro/Gato	Mastitis con pH leche >7,4 y metritis	22	mg/kg	VO	c8h			
Antiinfecciosos Sistémicos	Penicilinas	Ampicilina	D	Perro/Gato	Neumonía bacteriana	22-30	mg/kg	IV/SC	c8h			
Antiinfecciosos Sistémicos	Penicilinas	Bencilpenicilina	D	Perro/Gato	Choque	20.000-40.000	UI/kg	IV	c4-6h			
Antiinfecciosos Sistémicos	Penicilinas	Bencilpenicilina	D	Perro/Gato	Tétanos	20.000-100.000	UI/kg	IV	c6h	10 días		
Antiinfecciosos Sistémicos	Penicilinas	Bencilpenicilina-procaína	D	Perro/Gato	Tétanos	20.000-100.000	UI/kg	IM	c12h	10 días		
Antiinfecciosos Sistémicos	Sueros inmunes e inmunoglobulinas	Antitoxina tetánica		Perro	Tétanos						Ver posología en el artículo correspondiente.	
Antiinfecciosos Sistémicos	Sueros inmunes e inmunoglobulinas	Inmunoglobulina humana		Perro	Anemia y trombocitopenia inmunomediadas	280-700	mg/kg	IV	dosis única	una sola dosis		
Antiinfecciosos Sistémicos	Sulfamidas	Trimetoprim o sulfamida o combinación	D	Perro	Neosporosis	15	mg/kg	VO	c12h	4-8 semanas	Conjuntamente con clindamicina.	
Antiinfecciosos Sistémicos	Sulfamidas	Trimetoprim o sulfamida o combinación	D	Perro/Gato	Coccidiosis	50-60	mg/kg	VO	c24h	5-20 días	Dosis expresada como sulfadimetoxina.	
Antiinfecciosos Sistémicos	Sulfamidas	Trimetoprim o sulfamida o combinación	D	Perro/Gato	Mastitis con pH leche <7,3; infecciones bacterianas del tracto urinario; neumonía bacteriana; piodermas caninas	15-30	mg/kg	VO	c12h		Dosis de la combinación.	
Antiinfecciosos Sistémicos	Sulfamidas	Trimetoprim o sulfamida o combinación	D	Perro/Gato	Orquitis-epididimitis y prostatitis; infecciones respiratorias	15	mg/kg	VO	c12h		Dosis de la combinación.	
Antiinfecciosos Sistémicos	Tetraciclinas	Doxiciclina	D	Gato	Hemoplasmosis	5	mg/kg	VO	c12h	4 semanas		
Antiinfecciosos Sistémicos	Tetraciclinas	Doxiciclina	D	Perro	Ehrlichiosis y anaplasmosis	5	mg/kg	VO	c12h	28 días		
Antiinfecciosos Sistémicos	Tetraciclinas	Doxiciclina	D	Perro	Leptospirosis	5	mg/kg	VO/IV	c12h	2 semanas		
Antiinfecciosos Sistémicos	Tetraciclinas	Doxiciclina	D	Perro	Lupus eritematoso discoide; retinitis inmunomediada; brucelosis						Ver posologías en los artículos correspondientes.	
Antiinfecciosos Sistémicos	Tetraciclinas	Doxiciclina	D	Perro	Piodermas por estafilococos multirresistentes	10	mg/kg	VO	c24h			
Antiinfecciosos Sistémicos	Tetraciclinas	Doxiciclina	D	Perro/Gato	Borreliosis de Lyme	10	mg/kg	VO	c24h	4 semanas		
Antiinfecciosos Sistémicos	Tetraciclinas	Doxiciclina	D	Perro/Gato	Enfermedad periodontal	5	mg/kg	VO	c12h			
Antiinfecciosos Sistémicos	Tetraciclinas	Doxiciclina	D	Perro/Gato	Infecciones respiratorias; pododermatitis felina por células plasmáticas	10	mg/kg	VO	al día, en una o dos tomas			
Antiinfecciosos Sistémicos	Tetraciclinas	Doxiciclina	D	Perro/Gato	Rinitis alérgica o linfoplasmocitaria	3-5	mg/kg	VO	c12h			
Antiinfecciosos Sistémicos	Tetraciclinas	Minociclina	D	Gato	Infecciones respiratorias	8,8 o 50 mg/gato	mg/kg	VO	c24h		La referencia recoge 8,8 mg/kg o 50 mg/gato VO c24h.	
Antiinfecciosos Sistémicos	Tetraciclinas	Minociclina	D	Perro	Brucelosis	12	mg/kg	VO	c12h			
Antiinfecciosos Sistémicos	Tetraciclinas	Minociclina	D	Perro	Infecciones respiratorias	5	mg/kg	VO	c12h			
Antiinfecciosos Sistémicos	Tetraciclinas	Minociclina	D	Perro	Piodermas por estafilococos multirresistentes	5-10	mg/kg	VO	c12h			
Antiinfecciosos Sistémicos	Tetraciclinas	Tetraciclina	D	Perro	Lupus eritematoso discoide						Ver posología en el artículo correspondiente.	
Antiparasitarios	Antiparasitarios externos	Fipronil		Perro/Gato	Antiparasitario externo (según parasitosis y presentación; ver tabla 63)			tópica	según parasitosis		Spot on: no aplicar a animales menores de 8 semanas, ni gatos de <1 kg ni perros de <2 kg.	
Antiparasitarios	Antiparasitarios externos	Imidacloprid		Gato	Antiparasitario externo (ver tabla 63)	1	aplicación	tópica	cada 3-4 semanas		Según peso.	
Antiparasitarios	Antiparasitarios externos	Nitenpiram		Gato	Diagnóstico de la dermatitis alérgica por picadura de pulgas	1	comprimido	VO	cada 48 horas	1 mes		
Antiparasitarios	Antiparasitarios externos	Nitenpiram		Perro	Miasis	1	comprimido	VO	dosis única			
Antiparasitarios	Antiparasitarios externos	Nitenpiram		Perro/Gato	Pulgas	1	comprimido	VO	con la frecuencia requerida			
Antiparasitarios	Avermectinas y milbemicinas	Doramectina		Perro	Sarna demodécica generalizada de perros adultos	0,6	mg/kg	SC	cada 7 días	hasta dos raspados negativos con intervalo de un mes	No administrar a perros de raza collie, shetland o bobtail, o sus cruces, sin valorar si el individuo es portador de una mutación del gen MDR1.	
Antiparasitarios	Avermectinas y milbemicinas	Ivermectina		Gato	Prevención de dirofilariosis	24	mcg/kg	VO	mensual			
Antiparasitarios	Avermectinas y milbemicinas	Ivermectina		Perro	Eliminación de microfilarias	50	mcg/kg	VO				
Antiparasitarios	Avermectinas y milbemicinas	Ivermectina		Perro	Prevención de dirofilariosis	6-12	mcg/kg	VO	mensual			
Antiparasitarios	Avermectinas y milbemicinas	Ivermectina		Perro/Gato	Sarnas sarcóptica, notoédrica y otodéctica; dermatitis por Cheyletiella	0,3	mg/kg	VO semanal o SC quincenal		4-8 semanas		
Antiparasitarios	Avermectinas y milbemicinas	Milbemicina + praziquantel		Gato	Antiparasitario general (ver tabla 62)	mínimo 2 + 5	mg/kg	VO			Milbemicina + praziquantel, respectivamente.	
Antiparasitarios	Avermectinas y milbemicinas	Milbemicina + praziquantel		Perro	Antiparasitario general (ver tabla 62)	mínimo 0,5 + 5	mg/kg	VO			Milbemicina + praziquantel, respectivamente. Para Thelazia callipaeda, dos dosis separadas una semana; para Angiostrongylus vasorum, cuatro dosis semanales.	
Antiparasitarios	Babesicidas	Atovacuona		Gato	Cytauxzoonosis	15	mg/kg	VO	c8h	15 días	Asociada a azitromicina.	
Antiparasitarios	Babesicidas	Atovacuona		Perro	Babesiosis por B. gibsoni y B. vulpes	17-25	mg/kg	VO	c12h	10 días	Asociada a azitromicina; presentación atovacuona-proguanil.	
Antiparasitarios	Babesicidas	Atovacuona		Perro	Babesiosis por B. gibsoni y B. vulpes	13,3	mg/kg	VO	c8h	10 días	Asociada a azitromicina.	
Antiparasitarios	Babesicidas	Imidocarb		Gato	Babesiosis por Babesia canis	3,5-5,0	mg/kg	IM/SC	2 dosis	separadas 10 días		
Antiparasitarios	Babesicidas	Imidocarb		Perro	Babesiosis por Babesia canis y Babesia vogeli	6,6	mg/kg	IM/SC	2 dosis	separadas 15 días		
Antiparasitarios	Babesicidas	Imidocarb		Perro	Hepatozoonosis	5	mg/kg	SC	cada 7 días	4 semanas		
Antiparasitarios	Benzoimidazoles	Fenbendazol		Perro	Neumonía eosinofílica	25-50	mg/kg	VO	c24h	20 días		
Antiparasitarios	Benzoimidazoles	Fenbendazol		Perro/Gato	Antiparasitario general (ver tabla 62)	75	mg/kg	VO	c24h	2 días		
Antiparasitarios	Benzoimidazoles	Fenbendazol		Perro/Gato	Giardiosis	50	mg/kg	VO	c24h	3-5 días		
Antiparasitarios	Benzoimidazoles	Flubendazol		Perro/Gato	Antiparasitario general (ver tabla 62)	22	mg/kg	VO	c24h	2-3 días		
Antiparasitarios	Benzoimidazoles	Mebendazol		Perro/Gato	Antiparasitario general (ver tabla 62)	20	mg/kg	VO	c24h	3 días (nematodosis) o 5 días (teniosis)	No administrar a hembras durante los dos primeros tercios de gestación.	
Antiparasitarios	Benzoimidazoles, solos o combinados	Fenbendazol + pirantel + praziquantel		Perro	Antiparasitario general (ver tabla 62)	20 + 5 + 5	mg/kg	VO			Dosis respectivas de la combinación.	
Antiparasitarios	Benzoimidazoles, solos o combinados	Oxibendazol + niclosamida		Perro/Gato	Antiparasitario general (ver tabla 62)	0,625	mL/kg	VO	dosis diaria		Dosis diaria recomendada por el fabricante.	
Antiparasitarios	Filaricidas	Melarsomina		Perro	Dirofilariosis (adultos)	2,5	mg/kg	IM profundo	2 dosis	separadas 24 horas	En pacientes con parasitosis intensa se recomienda inyectar un mes antes una sola dosis.	
Antiparasitarios	Isoxazolinas	Afoxolaner		Perro	Antiparasitario externo (según parasitosis; ver tabla 63)			VO	según parasitosis			
Antiparasitarios	Isoxazolinas	Afoxolaner		Perro	Miasis	1	comprimido	VO	dosis única			
Antiparasitarios	Isoxazolinas	Afoxolaner + milbemicina		Perro	Antiparasitario externo (según parasitosis; ver tabla 63)			VO	según parasitosis			
Antiparasitarios	Isoxazolinas	Afoxolaner + milbemicina		Perro	Miasis	1	comprimido	VO	dosis única			
Antiparasitarios	Isoxazolinas	Esafoxolaner + eprinomectina + praziquantel		Gato	Antiparasitario (según parasitosis; ver tabla 63)			tópica	según parasitosis			
Antiparasitarios	Isoxazolinas	Fluralaner		Perro/Gato	Antiparasitario externo (según parasitosis; ver tabla 63)			VO/tópica	según parasitosis		Indicaciones fuera de prospecto en pgs. 394 y 396.	
Antiparasitarios	Isoxazolinas	Fluralaner + moxidectina		Gato	Antiparasitario (según parasitosis; ver tabla 63)			tópica	según parasitosis		Indicaciones fuera de prospecto en pg. 394.	
Antiparasitarios	Isoxazolinas	Lotilaner		Perro/Gato	Antiparasitario externo (según parasitosis; ver tabla 63)			VO	según parasitosis			
Antiparasitarios	Isoxazolinas	Lotilaner + milbemicina		Perro	Antiparasitario (según parasitosis; ver tabla 63)			VO	según parasitosis			
Antiparasitarios	Isoxazolinas	Sarolaner		Perro	Antiparasitario externo (según parasitosis; ver tabla 63)			VO	según parasitosis		Indicaciones fuera de prospecto en pgs. 394 y 396.	
Antiparasitarios	Isoxazolinas	Sarolaner + moxidectina + pirantel		Perro	Antiparasitario (según parasitosis; ver tabla 63)			VO	según parasitosis		Indicaciones fuera de prospecto en pgs. 394 y 396.	
Antiparasitarios	Isoxazolinas	Tigolaner + praziquantel + emodepsida		Gato	Antiparasitario (según parasitosis; ver tabla 63)			tópica	según parasitosis			
Antiparasitarios	Leishmanicidas	Alopurinol		Gato	Leishmaniosis	20	mg/kg	VO	al día en una o dos tomas	>6 meses		
Antiparasitarios	Leishmanicidas	Alopurinol		Perro	Leishmaniosis	10	mg/kg	VO	c12h	6-12 meses		
Antiparasitarios	Leishmanicidas	Alopurinol		Perro	Urolitos de urato: disolución	15	mg/kg	VO	c12h			
Antiparasitarios	Leishmanicidas	Alopurinol		Perro	Urolitos de urato: prevención de recidivas	5-7	mg/kg	VO	c12-24h			
Antiparasitarios	Leishmanicidas	Meglumina antimoniato		Gato	Leishmaniosis	20-50	mg/kg	SC	c24h	30 días		
Antiparasitarios	Leishmanicidas	Meglumina antimoniato		Perro	Leishmaniosis	100	mg/kg	SC	c24h	4-6 semanas		
Antiparasitarios	Leishmanicidas	Miltefosina		Perro	Leishmaniosis	2	mg/kg	VO	c24h	28 días	No administrar a hembras gestantes ni lactantes ni a perros en reproducción.	
Antiparasitarios	Otros antihelmínticos	Epsiprantel + pirantel		Perro	Antiparasitario general (ver tabla 62)	5,5 + 5	mg/kg	VO			Dosis respectivas de la combinación.	
Antiparasitarios	Otros antihelmínticos	Febantel + pirantel		Perro	Antiparasitario general (ver tabla 62)	15 + 5	mg/kg	VO			Dosis respectivas de la combinación.	
Antiparasitarios	Otros antihelmínticos	Febantel + pirantel + praziquantel		Perro	Antiparasitario general (ver tabla 62)	15 + 5 + 5	mg/kg	VO			Dosis respectivas de la combinación.	
Antiparasitarios	Otros antihelmínticos	Levamisol		Perro	Lupus eritematoso sistémico	2-5	mg/kg	VO	c48h		Máximo 150 mg; combinado con prednisona.	
Antiparasitarios	Otros antihelmínticos	Oxantel + pirantel + praziquantel		Perro	Antiparasitario general (ver tabla 62)	20 + 5 + 5	mg/kg	VO			Dosis respectivas de la combinación.	
Antiparasitarios	Otros antihelmínticos	Pirantel + praziquantel		Gato	Antiparasitario general (ver tabla 62)	según peso	comprimidos	VO	dosis única		1/2 comprimido para gatos 1-2 kg; 1 comprimido para 2-4 kg; 1,5 comprimidos para 4-6 kg; 2 comprimidos para >6 kg.	
Antiparasitarios	Otros antihelmínticos	Praziquantel		Perro/Gato	Antiparasitario general (ver tabla 62)	5	mg/kg	VO			Sin superar 180 mg/perro ni 35 mg/gato.	
Antiparasitarios	Otros antihelmínticos	Praziquantel + emodepsida		Gato	Antiparasitario general (ver tabla 62)	12 + 3	mg/kg	tópica	dosis única		Praziquantel + emodepsida, respectivamente; mínimo 0,14 mL/kg.	
Antiparasitarios	Otros antihelmínticos	Praziquantel + emodepsida		Perro	Antiparasitario general (ver tabla 62)	5 + 1	mg/kg	VO			Praziquantel + emodepsida, respectivamente.	
Antiparasitarios	Otros antihelmínticos	Toltrazurilo		Perro/Gato	Coccidiosis	20	mg/kg	VO	c24h	3 días		
Antiparasitarios	Otros antihelmínticos	Toltrazurilo + emodepsida		Perro	Antiparasitario general (ver tabla 62)	9 + 0,45	mg/kg	VO			Toltrazurilo + emodepsida, respectivamente.	
Antiparasitarios	Otros antiparasitarios externos	Dinotefuran + piriproxifeno		Gato	Pulgas	1	aplicación	tópica	cada 4 semanas			
Antiparasitarios	Otros antiparasitarios externos	Dinotefuran + piriproxifeno + permetrina		Perro	Antiparasitario externo (según parasitosis; ver tabla 63)	1	aplicación	tópica	cada 4 semanas			
Antiparasitarios	Otros antiparasitarios externos	Fipronil + metopreno		Perro/Gato	Antiparasitario externo (según parasitosis y presentación; ver tabla 63)			tópica	según parasitosis			
Antiparasitarios	Otros antiparasitarios externos	Fipronil + metopreno + eprinomectina + praziquantel		Gato	Antiparasitario (según parasitosis; ver tabla 63)			tópica	según parasitosis			
Antiparasitarios	Otros antiparasitarios externos	Fipronil + permetrina		Perro	Antiparasitario externo (según parasitosis; ver tabla 63)			tópica	según parasitosis		Indicaciones fuera de prospecto en pgs. 394 y 396.	
Antiparasitarios	Otros antiparasitarios externos	Fipronil + piriproxifeno		Perro/Gato	Antiparasitario externo (según parasitosis y especie; ver tabla 63)			tópica	según parasitosis			
Antiparasitarios	Otros antiparasitarios externos	Imidacloprid + flumetrina		Perro/Gato	Pulgas, garrapatas y piojos masticadores; prevención de leishmaniosis			collar	continuo	7-8 meses para prevención de leishmaniosis		
Antiparasitarios	Otros antiparasitarios externos	Imidacloprid + moxidectina		Perro	Eliminación de microfilarias y tratamiento de neumonía eosinofílica	1	aplicación	tópica	dosis única			
Antiparasitarios	Otros antiparasitarios externos	Imidacloprid + moxidectina		Perro/Gato	Antiparasitario (según parasitosis; ver tabla 63)			tópica	según parasitosis			
Antiparasitarios	Otros antiparasitarios externos	Imidacloprid + permetrina		Perro	Antiparasitario externo (según parasitosis; ver tabla 63)			tópica	según parasitosis			
Antiparasitarios	Otros antiparasitarios externos	Piretrinas-piretroides		Perro	Antiparasitario externo (ver tabla 63)			tópica/collar	según parasitosis		Frecuencia de aplicación o recambio según parasitosis.	
Aparato cardiovascular	Agentes activos sobre el sistema renina-angiotensina	Imidapril		Perro/Gato	Insuficiencia cardiaca	0,25	mg/kg	VO	c24h	inicialmente	No administrar a pacientes con lesión renal aguda, cardiopatía hipertrófica obstructiva o estenosis circulatorias relevantes, ni a hembras gestantes ni lactantes.	
Aparato cardiovascular	Antagonistas beta-adrenérgicos	Esmolol		Perro	Arritmias ventriculares	0,5	mg/kg	IV lento				
Aparato cardiovascular	Antagonistas beta-adrenérgicos	Esmolol		Perro/Gato	Taquicardia supraventricular independiente del nódulo atrioventricular	0,25-0,50	mg/kg	IV lento	inicialmente			
Aparato cardiovascular	Antagonistas beta-adrenérgicos	Esmolol		Perro/Gato	Taquicardia supraventricular y aleteo/fibrilación auricular en anestesia	50-200	mcg/kg/min	IV	infusión continua		Alternativamente 50-100 mcg/kg IV lento.	
Aparato cardiovascular	Antiarrítmicos	Amiodarona		Perro/Gato	Taquicardia supraventricular independiente del nódulo atrioventricular	5-15	mg/kg	VO	c12h		En fibrilación atrial canina y arritmias ventriculares, ver posologías en los artículos correspondientes.	
Aparato cardiovascular	Antiarrítmicos	Atropina		Gato	Disnea grave	0,025	mg/kg	SC/IM				
Aparato cardiovascular	Antiarrítmicos	Atropina		Perro	Disnea grave	0,02-0,04	mg/kg	SC/IM				
Aparato cardiovascular	Antiarrítmicos	Atropina		Perro	Síndrome del seno enfermo	0,04	mg/kg	SC/VO	c6-8h			
Aparato cardiovascular	Antiarrítmicos	Atropina		Perro/Gato	Antagonismo de signos muscarínicos de la intoxicación por carbamatos y organofosforados	0,1-0,2	mg/kg	IV + SC	inicial		Administrar una cuarta parte por vía IV lenta y el resto por vía SC inicialmente.	
Aparato cardiovascular	Antiarrítmicos	Atropina		Perro/Gato	Bradiarritmias en choque no cardiogénico	0,02	mg/kg	IV				
Aparato cardiovascular	Antiarrítmicos	Atropina		Perro/Gato	Bradicardia sinusal en anestesia	0,02-0,04	mg/kg	IV				
Aparato cardiovascular	Antiarrítmicos	Flecainida		Perro	Fibrilación atrial	1-5	mg/kg	VO	c8-12h			
Aparato cardiovascular	Antiarrítmicos	Lidocaína		Gato	Complejos ventriculares prematuros en anestesia	0,5	mg/kg	IV				
Aparato cardiovascular	Antiarrítmicos	Lidocaína		Perro	Arritmias ventriculares	2	mg/kg	IV lento	hasta 3 dosis cada 5 min		Si se necesita, repetir hasta 3 dosis y continuar con 25-80 mcg/kg/min IV.	
Aparato cardiovascular	Antiarrítmicos	Lidocaína		Perro	Complejos ventriculares prematuros en anestesia	1,0-2,0	mg/kg	IV				
Aparato cardiovascular	Antiarrítmicos	Lidocaína		Perro	Dolor	2	mg/kg	IV	bolo		Seguido de 3-6 mg/kg/h intraoperatorio o 1-3 mg/kg/h posoperatorio.	
Aparato cardiovascular	Antiarrítmicos	Lidocaína		Perro/Gato	Prevención de taquiarritmias en anestesia con tiopental	0,5-3,0	mg/kg	IV				
Aparato cardiovascular	Antiarrítmicos	Mexiletina		Perro	Arritmias ventriculares	4-8	mg/kg	VO	c8h			
Aparato cardiovascular	Antiarrítmicos	Propafenona		Perro	Fibrilación atrial	3-4	mg/kg	VO	c8h			
Aparato cardiovascular	Antiarrítmicos	Sotalol		Perro	Fibrilación atrial y arritmias ventriculares	0,5-2,0	mg/kg	VO	c8-12h		No administrar en insuficiencia cardiaca congestiva.	
Aparato cardiovascular	Antiarrítmicos / β-bloqueantes	Atenolol		Gato	Cardiomiopatía hipertrófica y taquicardias supraventriculares dependientes o no del nódulo atrioventricular	6,25 mg/gato (<5 kg) o 12,5 mg/gato (>5 kg)		VO	c12-24h			
Aparato cardiovascular	Antiarrítmicos / β-bloqueantes	Atenolol		Gato	Hipertiroidismo	0,25-1,00	mg/kg	VO	c12-24h		Alternativamente, 6,25 mg/gato VO c12h.	
Aparato cardiovascular	Antiarrítmicos / β-bloqueantes	Atenolol		Perro	Insuficiencia cardiaca, taquicardias supraventriculares dependientes o no del nódulo atrioventricular, fibrilación atrial y arritmias ventriculares	0,3-0,6	mg/kg	VO	c12h	inicialmente		
Aparato cardiovascular	Antiarrítmicos / β-bloqueantes	Atenolol		Perro/Gato	Hipertensión en enfermedad renal crónica	2	mg/kg	VO	c12-24h			
Aparato cardiovascular	Antiarrítmicos / β-bloqueantes	Propranolol		Gato	Cardiomiopatía hipertrófica, taquicardia supraventricular dependiente del nódulo atrioventricular e hipertiroidismo	2,5-5,0 mg/gato		VO	c8h			
Aparato cardiovascular	Antiarrítmicos / β-bloqueantes	Propranolol		Perro	Insuficiencia cardiaca y taquicardia supraventricular dependiente del nódulo atrioventricular	0,1-2,0	mg/kg	VO	c8h			
Aparato cardiovascular	Antiarrítmicos / β-bloqueantes	Propranolol		Perro/Gato	Taquicardia supraventricular y aleteo/fibrilación auricular en anestesia	0,04-0,06	mg/kg	IV			No administrar a pacientes asmáticos o con insuficiencia cardiaca congestiva.	
Aparato cardiovascular	ARA II / SRAA	Telmisartán		Perro/Gato	Proteinuria, hipertensión arterial glomerular e hipertensión en enfermedad renal crónica	1-2	mg/kg	VO	c24h		No administrar a hembras gestantes ni lactantes.	
Aparato cardiovascular	Bloqueantes canales calcio	Amlodipino		Gato	Hipertensión	0,125-0,250	mg/kg	VO	c12-24h			
Aparato cardiovascular	Bloqueantes canales calcio	Amlodipino		Gato	Proteinuria, hipertensión arterial glomerular e hipertensión en enfermedad renal crónica	0,625-2,50 mg/gato		VO	c24h			
Aparato cardiovascular	Bloqueantes canales calcio	Amlodipino		Perro	Fallo cardiaco congestivo	0,1-0,5	mg/kg	VO	c12-24h			
Aparato cardiovascular	Bloqueantes canales calcio	Amlodipino		Perro	Proteinuria, hipertensión arterial glomerular e hipertensión en enfermedad renal crónica	0,10-0,75	mg/kg	VO	c24h			
Aparato cardiovascular	Bloqueantes canales calcio	Amlodipino		Perro/Gato	Hiperaldosteronismo primario	0,1 mg/kg o 0,625-1,250 mg/gato		VO	c12h			
Aparato cardiovascular	Bloqueantes canales calcio	Diltiazem		Gato	Fibrilación atrial	7,5 mg/gato o 30 mg/gato		VO	c8h o c24h		Dosis de acción sostenida para 30 mg/gato VO c24h.	
Aparato cardiovascular	Bloqueantes canales calcio	Diltiazem		Perro	Fibrilación atrial	0,5-1,5	mg/kg	VO	c8h		Alternativamente, 2-3 mg/kg VO c12h en formulación de acción sostenida (retard).	
Aparato cardiovascular	Bloqueantes canales calcio	Diltiazem		Perro	Taquicardias supraventriculares dependientes o no del nódulo atrioventricular	0,25	mg/kg	IV lento			Alternativamente, 2-3 mg/kg VO c12h en formulación de acción sostenida (retard).	
Aparato cardiovascular	Bloqueantes canales calcio	Diltiazem		Perro/Gato	Taquicardia supraventricular y aleteo/fibrilación auricular en anestesia	0,15	mg/kg	IV				
Aparato cardiovascular	Bloqueantes canales calcio	Verapamilo		Perro	Taquicardia supraventricular independiente del nódulo atrioventricular	5-10 mg/perro		VO	c12h	inicialmente	También 0,05-0,15 mg/kg IV lento.	
Aparato cardiovascular	Diuréticos	Espironolactona		Perro/Gato	Hiperaldosteronismo primario	2-4	mg/kg	VO	al día			
Aparato cardiovascular	Diuréticos	Espironolactona		Perro/Gato	Insuficiencia cardiaca	0,5-2,0	mg/kg	VO	c12-24h			
Aparato cardiovascular	Diuréticos	Furosemida		Gato	Edema pulmonar agudo	1-2	mg/kg	IV	c1-2h			
Aparato cardiovascular	Diuréticos	Furosemida		Perro	Edema pulmonar agudo	2-4	mg/kg	IV	c1-2h		Ver dosis de infusión continua en el artículo correspondiente.	
Aparato cardiovascular	Diuréticos	Furosemida		Perro/Gato	Hidrocefalia	0,5-2,0	mg/kg	VO	c12-24h	inicialmente		
Aparato cardiovascular	Diuréticos	Furosemida		Perro/Gato	Lesión renal aguda	0,25-1,00	mg/kg/h	IV	infusión constante			
Aparato cardiovascular	Diuréticos	Hidroclorotiazida		Gato	Insuficiencia cardiaca	1-2	mg/kg	VO	c12-48h			
Aparato cardiovascular	Diuréticos	Hidroclorotiazida		Perro	Insuficiencia cardiaca	2-4	mg/kg	VO	c12-48h			
Aparato cardiovascular	Diuréticos	Hidroclorotiazida		Perro	Urolitos de oxalato cálcico	2	mg/kg	VO	c24h		No administrar a pacientes con nefropatía.	
Aparato cardiovascular	Diuréticos	Hidroclorotiazida		Perro/Gato	Diabetes insípida nefrógena	2,5-5,0	mg/kg	VO	c12h			
Aparato cardiovascular	Diuréticos	Torasemida		Perro/Gato	Insuficiencia cardiaca y edema pulmonar con insuficiencia cardiaca avanzada	0,1-0,3	mg/kg	VO	c12-24h		No administrar a pacientes con insuficiencia renal, deshidratación intensa, hipovolemia o hipotensión.	
Aparato cardiovascular	Estimulantes cardiacos	Dobutamina		Gato	Insuficiencia miocárdica grave y choque cardiogénico	0,5-3,0	mcg/kg/min	IV	infusión continua			
Aparato cardiovascular	Estimulantes cardiacos	Dobutamina		Perro	Insuficiencia miocárdica grave y choque cardiogénico	2,5	mcg/kg/min	IV	infusión continua		Inicialmente; incrementar 25% cada 10-20 min hasta conseguir el efecto deseado.	
Aparato cardiovascular	Estimulantes cardiacos	Dopamina		Perro/Gato	Hipotensión anestésica	5-20	mcg/kg/min	IV	infusión continua			
Aparato cardiovascular	Estimulantes cardiacos	Dopamina		Perro/Gato	Insuficiencia miocárdica grave y choque	1	mcg/kg/min	IV	infusión continua		Inicialmente; incrementar 25-30% cada 30 min hasta conseguir el efecto deseado. En choque no cardiogénico la dosis inicial puede ser superior (hasta 2,5 mcg/kg/min).	
Aparato cardiovascular	Estimulantes cardíacos	Adrenalina (epinefrina)		Perro/Gato	Anafilaxia	0,1 mL/10 kg	solución 1/1.000	IM	dosis según respuesta		Ver consideraciones en el artículo correspondiente.	
Aparato cardiovascular	Estimulantes cardíacos	Adrenalina (epinefrina)		Perro/Gato	Broncoconstricción	0,02	mg/kg	SC/IM/IV				
Aparato cardiovascular	Estimulantes cardíacos	Adrenalina (epinefrina)		Perro/Gato	Hipotensión anestésica	0,1-1,0	mcg/kg/min	IV	infusión continua			
Aparato cardiovascular	Estimulantes cardíacos	Fenilefrina		Perro/Gato	Hipotensión anestésica	1-5	mcg/kg/min	IV	infusión continua			
Aparato cardiovascular	Estimulantes cardíacos	Noradrenalina (norepinefrina)		Perro/Gato	Choque no cardiogénico	0,1-2,0	mcg/kg/min	IV	infusión continua		Comenzar en el extremo inferior del rango y ajustar cada 5-15 min según presión arterial.	
Aparato cardiovascular	Estimulantes cardíacos	Noradrenalina (norepinefrina)		Perro/Gato	Hipotensión anestésica	0,2-2,0	mcg/kg/min	IV	infusión continua			
Aparato cardiovascular	Estimulantes cardíacos	Pimobendán		Gato	Insuficiencia cardiaca congestiva	0,25	mg/kg	VO	c12h			
Aparato cardiovascular	Estimulantes cardíacos	Pimobendán		Perro	Cardiomiopatía dilatada, degeneración mitral crónica, insuficiencia cardiaca crónica e hipertensión pulmonar secundaria a fallo cardiaco	0,25	mg/kg	VO	c12h			
Aparato cardiovascular	Estimulantes cardíacos	Pimobendán		Perro	Insuficiencia cardiaca aguda	0,15	mg/kg	IV				
Aparato cardiovascular	Estimulantes cardíacos	Pimobendán + Benazepril		Perro	Cardiomiopatía dilatada, degeneración mitral crónica, insuficiencia cardiaca crónica e hipertensión pulmonar secundaria a fallo cardiaco	0,25 + 0,50	mg/kg	VO	c12h		Corresponde a 0,25 mg/kg de pimobendán + 0,50 mg/kg de benazepril.	
Aparato cardiovascular	Glucósidos digitálicos	Digoxina		Gato	Insuficiencia cardiaca; taquicardia supraventricular dependiente del nódulo atrioventricular	0,007-0,015	mg/kg	VO	c12h		Máximo orientativo: 0,375 mg/gato VO cada 24 h (4-5 kg) o cada 48 h (gatos 2-3 kg).	
Aparato cardiovascular	Glucósidos digitálicos	Digoxina		Perro	Fibrilación atrial	0,003	mg/kg	VO	c12h		Máximo: 0,25 mg/perro VO c12h; ver posología parenteral en el artículo correspondiente.	
Aparato cardiovascular	Glucósidos digitálicos	Digoxina		Perro	Insuficiencia cardiaca; taquicardia supraventricular dependiente del nódulo atrioventricular	0,003-0,010	mg/kg	VO	c12h			
Aparato cardiovascular	IECAs / SRAA	Benazepril		Gato	Insuficiencia cardiaca	0,25-0,50	mg/kg	VO	c24h	inicialmente		
Aparato cardiovascular	IECAs / SRAA	Benazepril		Perro	Insuficiencia cardiaca	0,5	mg/kg	VO	c24h	inicialmente		
Aparato cardiovascular	IECAs / SRAA	Benazepril		Perro/Gato	Hipertensión arterial glomerular e hipertensión en enfermedad renal crónica	0,5-1,0	mg/kg	VO	c12-24h		No administrar a hembras gestantes ni a gatos de menos de 2,5 kg.	
Aparato cardiovascular	IECAs / SRAA	Enalapril		Gato	Insuficiencia cardiaca	0,25-0,50	mg/kg	VO	c12-24h	inicialmente		
Aparato cardiovascular	IECAs / SRAA	Enalapril		Perro	Insuficiencia cardiaca	0,5	mg/kg	VO	c12-24h	inicialmente		
Aparato cardiovascular	IECAs / SRAA	Enalapril		Perro/Gato	Hipertensión arterial glomerular e hipertensión en enfermedad renal crónica; glomerulonefritis	0,5-1,0	mg/kg	VO	c12-24h		No administrar a hembras gestantes.	
Aparato cardiovascular	Vasodilatadores	Nitroprusiato sódico		Perro/Gato	Edema pulmonar agudo	0,5-2,5	mcg/kg/min	IV	infusión continua			
Aparato cardiovascular	Vasodilatadores no IECA	Hidralazina		Perro/Gato	Edema pulmonar grave por insuficiencia mitral	0,5-2,0	mg/kg	VO	c12h			
Aparato cardiovascular	Vasodilatadores no IECA	Hidralazina		Perro/Gato	Hipertensión en enfermedad renal crónica	0,5	mg/kg	VO	c12h			
Aparato cardiovascular	Vasodilatadores no IECA	Sildenafilo		Perro	Hipertensión pulmonar	1-3	mg/kg	VO	c8-12h			
Aparato cardiovascular	Vasodilatadores no inhibidores de la angiotensina-convertasa	Pentoxifilina		Perro	Hipertensión pulmonar	10-15	mg/kg	VO	c12h			
Aparato cardiovascular	Vasodilatadores no inhibidores de la angiotensina-convertasa	Prazosina		Gato	Síndrome urológico de los felinos	0,25-0,50 mg/gato		VO	c8-12h			
Aparato cardiovascular	Vasodilatadores no inhibidores de la angiotensina-convertasa	Prazosina		Perro	Insuficiencia cardiaca, hipertensión sistémica e hipertensión pulmonar; feocromocitoma	0,5-1,0 mg/perro (<15 kg) / 1-2 mg/perro (>15 kg)		VO	c8h			
Aparato cardiovascular	Vasodilatadores no inhibidores de la angiotensina-convertasa	Tadalafilo		Perro	Hipertensión pulmonar	1-4	mg/kg	VO	c24h		Comenzando con la dosis inferior.	
Aparato cardiovascular	β-bloqueantes	Carvedilol		Perro	Fibrilación atrial	1,5-3,0 mg/perro		VO	c12h	inicialmente	No administrar a pacientes con insuficiencia cardiaca congestiva.	
Aparato cardiovascular	β-bloqueantes	Carvedilol		Perro	Insuficiencia cardiaca	1,5-3,0 mg/perro		VO	c12-24h			
Aparato Muscular	AINEs	Acetilsalicílico ácido		Perro	Trombosis	0,5	mg/kg	VO	c24h		No administrar a pacientes con insuficiencia renal, discrasia sanguínea o úlcera gastrointestinal.	
Aparato Muscular	AINEs	Firocoxib		Perro	Dolor e inflamación musculoesqueléticos agudos y crónicos	5	mg/kg	VO	c24h		En procesos crónicos se ajustará a la menor dosis que precise el paciente. No administrar a pacientes con discrasia sanguínea o úlcera gastrointestinal, hembras lactantes o gestantes, ni a cachorros de menos de 10 semanas de edad o 3 kg.	
Aparato Muscular	AINEs	Firocoxib		Perro	Dolor e inflamación quirúrgicos	5	mg/kg	VO	c24h	Empezando dos horas antes de la cirugía.	No administrar a pacientes con discrasia sanguínea o úlcera gastrointestinal, hembras lactantes o gestantes, ni a cachorros de menos de 10 semanas de edad o 3 kg.	
Aparato Muscular	AINEs	Grapiprant		Perro	Dolor asociado a enfermedad articular degenerativa leve o moderada	2	mg/kg	VO	c24h		No administrar a hembras lactantes o gestantes, a animales usados como reproductores, ni a perros de menos de 9 meses o 3,6 kg.	
Aparato Muscular	AINEs	Mavacoxib		Perro	Dolor e inflamación musculoesqueléticos crónicos	2	mg/kg	VO	según pauta	segunda dosis a los 14 días y posteriormente con periodicidad mensual	No administrar a pacientes con insuficiencia cardíaca, renal o hepática, discrasia sanguínea o úlcera gastrointestinal, hembras lactantes o gestantes, ni a perros de menos de 12 meses o 5 kg.	
Aparato Muscular	Analgésicos opioides	Buprenorfina		Gato	Dolor	5-20	mcg/kg	Transmucosa oral/IM/IV	c4-8h			
Aparato Muscular	Analgésicos opioides	Buprenorfina		Perro	Dolor	10-20	mcg/kg	IM/IV	c4-8h			
Aparato Muscular	Analgésicos opioides	Butorfanol		Perro	Colapso traqueal	0,55	mg/kg	VO	c6-12h		De la forma inyectable.	
Aparato Muscular	Analgésicos opioides	Butorfanol		Perro/Gato	Dolor visceral	0,1-0,4	mg/kg	IM/IV	c2-4h			
Aparato Muscular	Analgésicos opioides	Butorfanol		Perro/Gato	Tos	0,05-0,10	mg/kg	SC/IM	c6-12h			
Aparato Muscular	Analgésicos opioides	Butorfanol		Perro/Gato	Tos	0,5-1,0	mg/kg	VO	c6-12h		De la forma inyectable.	
Aparato Muscular	Analgésicos opioides	Codeína		Gato	Tos	0,25-4,00	mg/kg	VO	c8h		Usar con precaución.	
Aparato Muscular	Analgésicos opioides	Codeína		Perro	Tos	0,5-2,0	mg/kg	VO	c8h			
Aparato Muscular	Analgésicos opioides	Fentanilo		Gato	Control del dolor posoperatorio asociado con cirugía mayor ortopédica y de tejidos blandos	25	mcg/hora	Parche transdérmico				
Aparato Muscular	Analgésicos opioides	Fentanilo		Perro 10-20 kg	Control del dolor posoperatorio asociado con cirugía mayor ortopédica y de tejidos blandos	50	mcg/hora	Parche transdérmico				
Aparato Muscular	Analgésicos opioides	Fentanilo		Perro 20-30 kg	Control del dolor posoperatorio asociado con cirugía mayor ortopédica y de tejidos blandos	75	mcg/hora	Parche transdérmico				
Aparato Muscular	Analgésicos opioides	Fentanilo		Perro <10 kg	Control del dolor posoperatorio asociado con cirugía mayor ortopédica y de tejidos blandos	25	mcg/hora	Parche transdérmico				
Aparato Muscular	Analgésicos opioides	Fentanilo		Perro >30 kg	Control del dolor posoperatorio asociado con cirugía mayor ortopédica y de tejidos blandos	100	mcg/hora	Parche transdérmico				
Aparato Muscular	Analgésicos opioides	Fentanilo		Perro/Gato	Dolor	2-4	mcg/kg/hora	Parche transdérmico			Parches transdérmicos de uso humano; las posologías IV se describen en el artículo correspondiente.	
Aparato Muscular	Analgésicos opioides	Metadona		Perro/Gato	Dolor	0,1-0,5	mg/kg	IM/IV	c2-4h			
Aparato Muscular	Analgésicos opioides	Morfina		Gato	Dolor	0,1-0,5	mg/kg	IM	c2-4h			
Aparato Muscular	Analgésicos opioides	Morfina		Perro	Dolor	0,1-0,5	mg/kg	IM/IV	c2-4h			
Aparato Muscular	Analgésicos opioides	Petidina		Perro/Gato	Dolor	3-5	mg/kg	SC	c1-2h			
Aparato Muscular	Analgésicos opioides	Remifentanilo		Perro/Gato	Control del dolor intraoperatorio	0,25-1,00	mcg/kg/min	IV				
Aparato Muscular	Analgésicos opioides	Tramadol		Perro/Gato	Dolor	2-4	mg/kg	VO	c8h		No administrar a pacientes con epilepsia.	
Aparato Muscular	Miorrelajantes no benzodiazepinas	Metocarbamol		Perro/Gato	Espasmo muscular	20	mg/kg	VO	c8-12h			
Dermatología	Antiacnéicos	Benzoilo peróxido		Gato	Acné	2	aplicaciones	Tópica	al día		Al 2,5%.	
Dermatología	Antiacnéicos	Benzoilo peróxido		Perro	Acné	2	aplicaciones	Tópica	al día		Al 2,5-5,0%.	
Dermatología	Antiacnéicos	Clindamicina tópica		Perro/Gato	Acné y otras infecciones bacterianas cutáneas focales	2	aplicaciones	Tópica	al día		Pomada/gel/solución al 1%.	
Dermatología	Antiacnéicos	Fusídico ácido tópico		Perro/Gato	Acné y otras infecciones bacterianas cutáneas focales	2	aplicaciones	Tópica	al día		Presentaciones al 2%; puede combinarse con glucocorticoide.	
Dermatología	Antiacnéicos	Tretinoína tópica		Gato	Acné, hiperqueratosis nasal idiopática e hiperplasia de la glándula supracaudal canina	2	aplicaciones	Tópica	al día		Al 0,010-0,025%.	
Dermatología	Antiacnéicos	Tretinoína tópica		Perro	Acné, hiperqueratosis nasal idiopática e hiperplasia de la glándula supracaudal canina	2	aplicaciones	Tópica	al día		Al 0,05%.	
Dermatología	Antifúngicos	Ketoconazol		Perro	Dermatofitosis y dermatitis por Malassezia	10	mg/kg	VO	c24h			
Dermatología	Antifúngicos	Ketoconazol		Perro	Forunculosis anal						Ver posología en el artículo correspondiente.	
Dermatología	Antifúngicos	Ketoconazol		Perro/Gato	Aspergilosis	5-15	mg/kg	VO	c12h	6-10 semanas	No administrar a pacientes con insuficiencia hepática, ni a hembras gestantes ni lactantes.	
Dermatología	Antifúngicos	Miconazol tópico		Perro/Gato	Dermatitis por Malassezia	2	aplicaciones	Tópica	al día			
Dermatología	Antifúngicos	Sulfuro de cal		Perro/Gato	Dermatofitosis y dermatitis por Malassezia	3-6	%	Baño tópico	1-2 baños semanales		Sin aclarado posterior.	
Dermatología	Antifúngicos	Terbinafina		Perro	Dermatitis por Malassezia	30	mg/kg	VO	c24h	2 días consecutivos a la semana		
Dermatología	Antifúngicos	Terbinafina		Perro/Gato	Aspergilosis	15-20	mg/kg	VO	c12h	3-6 meses	No administrar a hembras gestantes ni lactantes, ni a pacientes con insuficiencia renal grave o hepatopatía crónica.	
Dermatología	Antifúngicos	Terbinafina		Perro/Gato	Dermatofitosis	30-40	mg/kg	VO	c24h			
Dermatología	Antifúngicos	Terbinafina tópica		Perro/Gato	Dermatofitosis	2	aplicaciones	Tópica	al día		Presentaciones tópicas tipo crema o aerosol.	
Dermatología	Antiseborreicos	Azufre + ácido salicílico		Perro	Seborrea seca			Baño tópico	cada 3-15 días			
Dermatología	Antiseborreicos	Benzoilo peróxido		Perro	Piodermas caninas	2,5	%	Baño tópico	2 baños semanales			
Dermatología	Antiseborreicos	Benzoilo peróxido		Perro	Seborrea grasa			Baño tópico	cada 3-15 días			
Dermatología	Antiseborreicos	Fitoesfingosina		Perro	Seborrea seca o grasa			Tópica	cada 3-15 días			
Dermatología	Antiseborreicos	Gluconato de zinc		Perro	Seborrea seca o grasa			Tópica	cada 3-15 días			
Dermatología	Antisépticos tópicos	Clorhexidina		Perro	Piodermas caninas	2-3	%	Baño tópico	2 baños semanales			
Dermatología	Antisépticos tópicos	Clorhexidina		Perro/Gato	Abscesos	0,05-0,10	%	Lavado tópico			No usar productos jabonosos.	
Dermatología	Antisépticos tópicos	Clorhexidina		Perro/Gato	Balanopostitis	lavados al 5	%	Tópica			No ha quedado demostrada su seguridad durante la gestación y lactancia.	
Dermatología	Antisépticos tópicos	Clorhexidina		Perro/Gato	Dermatitis por Malassezia	2-4	%	Baño tópico	2 baños semanales		Con o sin miconazol.	
Dermatología	Antisépticos tópicos	Clorhexidina		Perro/Gato	Limpieza de heridas	lavados al 0,5	%	Tópica			No usar productos jabonosos. No ha quedado demostrada su seguridad durante la gestación y lactancia.	
Dermatología	Antisépticos tópicos	Clorhexidina		Perro/Gato	Otitis externa	0,05-0,20	%	Lavado ótico			No usar productos jabonosos.	
Dermatología	Antisépticos tópicos	Povidona yodada		Perro/Gato	Mastitis y abscesos	lavados al 1	%	Tópica	c12h			
Dermatología	Antisépticos tópicos	Povidona yodada		Perro/Gato	Otitis externa	lavados al 0,1	%	Tópica				
Dermatología	Astringentes	Aluminio		Perro/Gato	Dermatitis exudativas (dermatitis aguda húmeda)	2-3	aplicaciones	Tópica	al día			
Dermatología	Glucocorticoides tópicos	Glucocorticoides tópicos de alta potencia		Perro/Gato	Dermatitis focales intensas (autoinmunes, aguda húmeda, etc.)	1-2	aplicaciones	Tópica	al día		No se recomienda su uso en infecciones de la piel ni en extensas áreas corporales de hembras gestantes. En aplicaciones a medio o largo plazo se recomiendan aceponatos, furoato de mometasona o prednicarbato.	
Dermatología	Glucocorticoides tópicos	Glucocorticoides tópicos de baja potencia		Perro	Dermatitis atópica	2	aplicaciones	Tópica	por semana	a largo plazo	Evitar su aplicación a extensas áreas corporales de hembras gestantes.	
Dermatología	Glucocorticoides tópicos	Glucocorticoides tópicos de baja potencia		Perro/Gato	Dermatitis focales leves o controladas (autoinmunes, aguda húmeda, etc.)	1	aplicación	Tópica	c12-72h		No se recomienda su uso en infecciones de la piel. En aplicaciones a medio o largo plazo se recomiendan moléculas con escaso efecto sobre la función adrenocortical: aceponatos.	
Dermatología	Inmunosupresores tópicos	Pimecrolimús		Perro	Queratitis seca que no responde a ciclosporina A	2	aplicaciones	Tópica	al día		Al 1%.	
Dermatología	Inmunosupresores tópicos	Tacrolimús		Perro	Dermatitis atópica y dermatitis autoinmunes focales (lupus eritematoso discoide, pénfigo focal)	2	aplicaciones	Tópica	al día		Al 0,1%.	
Dermatología	Inmunosupresores tópicos	Tacrolimús		Perro	Forunculosis anal	1-2	aplicaciones	Tópica	al día		Al 0,1%.	
Dermatología	Inmunosupresores tópicos	Tacrolimús		Perro	Queratitis seca que no responde a ciclosporina A y queratoconjuntivitis superficial crónica	2	aplicaciones	Tópica	al día		Al 0,03%.	
Dermatología	Retinoides sistémicos	Acitretina		Perro	Seborrea idiopática e ictiosis	0,5-1,0	mg/kg	VO	al día	inicialmente	En 1-2 tomas. No administrar a animales usados como reproductores.	
Dermatología	Retinoides sistémicos	Isotretinoína		Perro	Síndrome de comedones del schnauzer e ictiosis	1-2	mg/kg	VO	al día	inicialmente	En 1-2 tomas. No administrar a animales usados como reproductores.	
Dermatología	Tópicos para quemaduras	Sulfadiazina de plata		Perro/Gato	Quemaduras e infecciones bacterianas cutáneas focales	1-2	aplicaciones	Tópica	al día			
Dermatología	Tópicos para úlceras	Centella asiática		Perro/Gato	Heridas y úlceras	2	aplicaciones	Tópica	al día			
Dermatología	Tópicos para úlceras	Miel		Perro/Gato	Úlceras	1-2	aplicaciones	Tópica	al día			
Digestivo y Metabolismo	Adsorbentes intestinales y secuestradores de ácidos biliares	Carbón adsorbente		Perro/Gato	Lavado gástrico	1-3	g/kg	VO			Diluir al 10-20% en agua.	
Digestivo y Metabolismo	Adsorbentes intestinales y secuestradores de ácidos biliares	Colestiramina		Perro/Gato	Intoxicación por toxinas lipofílicas	0,3	g/kg	VO			Mezclado con comida húmeda.	
Digestivo y Metabolismo	Antieméticos	Maropitant		Gato	Vómitos	1	mg/kg	SC/IV lento	c24h			
Digestivo y Metabolismo	Antieméticos	Maropitant		Perro	Vómitos (esofagitis, gastritis, pancreatitis)	1	mg/kg	SC/IV lento	c24h			
Digestivo y Metabolismo	Antieméticos	Maropitant		Perro	Vómitos (esofagitis, gastritis, pancreatitis)	2	mg/kg	VO	c24h			
Digestivo y Metabolismo	Antieméticos	Ondansetrón		Perro/Gato	Vómitos (esofagitis, gastritis, pancreatitis)	0,5-1,0	mg/kg	IV/SC/IM/VO	c6-12h			
Digestivo y Metabolismo	Antieméticos	Ondansetrón		Perro/Gato	Vómitos en enfermedad renal crónica	0,1-0,2	mg/kg	VO	c8-12h			
Digestivo y Metabolismo	Antiinflamatorios intestinales	Budesónida		Gato	Asma felina	2 inhalaciones de 125-250	mcg	Inhalatoria	c12h	inicialmente	Según la intensidad del cuadro. No administrar a pacientes con perforación intestinal o hepatopatía grave.	
Digestivo y Metabolismo	Antiinflamatorios intestinales	Budesónida		Gato	Enteritis crónica inmunomediada	0,5-1,0	mg/gato	VO	c24h			
Digestivo y Metabolismo	Antiinflamatorios intestinales	Budesónida		Perro	Enteritis crónica inmunomediada	1-5	mg/perro	VO	c24h			
Digestivo y Metabolismo	Eméticos	Apomorfina		Perro	Inducción del vómito	0,1	mg/kg	SC	dosis única		No administrar a pacientes hipóxicos, disneicos, con convulsiones o con ingestión de cáusticos/disolventes/objetos cortantes.	
Digestivo y Metabolismo	Eméticos	Ropinirol		Perro	Inducción del vómito			Vía oftálmica	según presentación	1-2 dosis	Ver dosis en presentaciones.	
Digestivo y Metabolismo	Enemas/Supositorios	Citrato de sodio-lauril sulfoacetato de sodio		Perro/Gato	Estreñimiento ocasional	1	microenema	rectal	dosis única		No administrar a pacientes con enfermedad inflamatoria intestinal.	
Digestivo y Metabolismo	Enemas/Supositorios	Fosfato de sodio (enema)		Perro	Estreñimiento	80 mL (≈10 kg) o 140 mL (>10 kg)		rectal	dosis única		No administrar a pacientes de menos de 5 kg.	
Digestivo y Metabolismo	Estimulantes del apetito	Mirtazapina		Gato	Estimulante del apetito	1,88	mg/gato	VO	c24h		Cada 48 horas en caso de insuficiencia renal crónica; existe forma de aplicación tópica.	
Digestivo y Metabolismo	Estimulantes del apetito	Mirtazapina		Perro	Estimulante del apetito	3,75 (<7 kg); 7,5 (7-15 kg); 15 (16-30 kg); 30 (>30 kg)	mg	VO	c24h			
Digestivo y Metabolismo	Inhibidores de la bomba de protones	Esomeprazol		Perro/Gato	Úlcera gastroduodenal, esofagitis por reflujo y sangrado de la mucosa gástrica; pancreatitis	1	mg/kg	VO/IV	c12h		VO media hora antes de comer.	
Digestivo y Metabolismo	Inhibidores de la bomba de protones	Omeprazol		Perro	Hidrocefalia	10 mg (<20 kg) o 20 mg (>20 kg)		VO	c24h			
Digestivo y Metabolismo	Inhibidores de la bomba de protones	Omeprazol		Perro/Gato	Vómitos en enfermedad renal crónica	0,7	mg/kg	VO	c24h			
Digestivo y Metabolismo	Inhibidores de la bomba de protones	Omeprazol		Perro/Gato	Úlcera gastroduodenal, esofagitis por reflujo y sangrado de la mucosa gástrica; pancreatitis	1	mg/kg	VO	c12h		Media hora antes de comer.	
Digestivo y Metabolismo	Inhibidores de la bomba de protones	Omeprazol		Perro/Gato	Úlcera gastroduodenal, esofagitis por reflujo y sangrado de la mucosa gástrica; pancreatitis	0,7-1,0	mg/kg	VO	c24h		Media hora antes de comer.	
Digestivo y Metabolismo	Inhibidores de la motilidad intestinal	Loperamida		Gato	Colitis no bacteriana ni tóxica	0,05	mg/kg	VO	c8-12h		No administrar si hay riesgo de obstrucción intestinal ni con sangre en heces.	
Digestivo y Metabolismo	Inhibidores de la motilidad intestinal	Loperamida		Perro	Colitis no bacteriana ni tóxica	0,1-0,2	mg/kg	VO	c8-12h		No administrar si hay riesgo de obstrucción intestinal ni con sangre en heces.	
Digestivo y Metabolismo	Laxantes	Glicerol		Perro	Estreñimiento	1-2	supositorios pediátricos	rectal				
Digestivo y Metabolismo	Laxantes	Lactulosa		Gato	Estreñimiento	5-10	mL/gato	enema				
Digestivo y Metabolismo	Laxantes	Lactulosa		Gato	Estreñimiento	0,5	mL/kg	VO	c8-12h	inicialmente		
Digestivo y Metabolismo	Laxantes	Lactulosa		Perro	Estreñimiento	0,5-1,0	mL/kg	VO	c8h			
Digestivo y Metabolismo	Laxantes	Lactulosa		Perro/Gato	Encefalopatía hepática	0,1-0,5	mL/kg	VO	c8-12h		Ajustar a unas 3 deposiciones diarias, blandas pero con forma.	
Digestivo y Metabolismo	Laxantes	Malta		Gato	Estreñimiento leve	1-5	mL	VO	c24h			
Digestivo y Metabolismo	Laxantes	Parafina líquida		Perro/Gato	Estreñimiento	5-30	mL/animal	enema				
Digestivo y Metabolismo	Laxantes	Plantago ovata (ispagula) cutícula		Perro/Gato	Encefalopatía hepática	1-3	cucharaditas	VO	diario			
Digestivo y Metabolismo	Laxantes	Plantago ovata (ispagula) cutícula		Perro/Gato	Enteritis crónica de intestino grueso	1	g/kg	VO	diario			
Digestivo y Metabolismo	Laxantes	Plantago ovata (ispagula) cutícula		Perro/Gato	Estreñimiento	1-4	cucharaditas	VO	por comida			
Digestivo y Metabolismo	Procinéticos	Domperidona		Perro	Leishmaniosis	0,5	mg/kg	VO	c24h	1 mes		
Digestivo y Metabolismo	Procinéticos	Domperidona		Perro	Prevención de leishmaniosis	0,5	mg/kg	VO	c24h	1 mes	Repetir cada 4 meses.	
Digestivo y Metabolismo	Procinéticos	Domperidona		Perro/Gato	Íleo, vaciado gástrico retardado y vómitos biliosos	2-5	mg/animal	VO	c8-12h			
Digestivo y Metabolismo	Procinéticos	Metoclopramida		Perro/Gato	Vaciado gástrico retardado y vómitos biliosos	0,2-0,5	mg/kg	VO			Administrar 30-45 minutos antes de las comidas o de dormir.	
Digestivo y Metabolismo	Procinéticos	Metoclopramida		Perro/Gato	Vómitos en enfermedad renal crónica	0,1	mg/kg	VO	cada 8-12 horas			
Digestivo y Metabolismo	Procinéticos	Metoclopramida		Perro/Gato	Íleo	1-2	mg/kg/día	IV (infusión continua)	continuo			
Digestivo y Metabolismo	Protectores hepáticos	S-adenosilmetionina		Perro/Gato	Disfunción cognitiva	10-20	mg/kg	VO	c24h		Dosis de adenosil-S-metionina.	
Digestivo y Metabolismo	Protectores hepáticos	S-adenosilmetionina		Perro/Gato	Protector hepático	20	mg/kg	VO	c24h		Dosis de adenosil-S-metionina.	
Digestivo y Metabolismo	Protectores hepáticos	Silibina		Perro/Gato	Protector hepático	50-250	mg/animal	VO	c12-24h		Dosis de silibina.	
Digestivo y Metabolismo	Suplementos minerales	Calcio carbonato		Perro/Gato	Hiperfosfatemia	90-150	mg/kg	VO	al día			
Digestivo y Metabolismo	Suplementos minerales	Calcio carbonato		Perro/Gato	Hipocalcemia crónica	25-50	mg/kg	VO	al día		En varias tomas.	
Digestivo y Metabolismo	Suplementos minerales	Hierro		Gato	Anemia ferropénica	50-100	mg/gato	VO	al día		Sulfato ferroso; equivalente a 18-36 mg de hierro elemental aprox.	
Digestivo y Metabolismo	Suplementos minerales	Hierro		Perro	Anemia ferropénica	100-300	mg/perro	VO	al día		Sulfato ferroso; equivalente a 36-110 mg de hierro elemental aprox.	
Digestivo y Metabolismo	Suplementos minerales	Hierro		Perro/Gato	Anemia ferropénica	10	mg/kg	IM profundo	cada 3 semanas		Hierro (III) dextrano; equivalente a mg/kg de hierro (III). No administrar a pacientes con enfermedad cardiaca, renal o hepática.	
Digestivo y Metabolismo	Suplementos minerales	Potasio		Gato	Hiperaldosteronismo primario	2-6	mmol/gato	VO	al día		En 2-3 tomas.	
Digestivo y Metabolismo	Suplementos minerales	Potasio		Perro/Gato	Hipocaliemia	0,5-1,0	mmol/kg	VO	1-2 veces al día			
Digestivo y Metabolismo	Suplementos minerales	Zinc acetato		Perro	Hepatopatía asociada al cobre	100	mg/animal	VO	c12h	1-2 meses		
Digestivo y Metabolismo	Suplementos minerales	Zinc acetato		Perro	Hepatopatía asociada al cobre	25-50	mg/animal	VO	c12h		Dosis de mantenimiento tras 1-2 meses.	
Digestivo y Metabolismo	Suplementos nutricionales	Carnitina		Gato	Lipidosis hepática	250-500	mg/gato	VO	al día			
Digestivo y Metabolismo	Suplementos nutricionales	Carnitina		Perro	Cardiomiopatía dilatada	1-2	g/perro	VO	c8-12h			
Digestivo y Metabolismo	Suplementos nutricionales	Glutamina		Perro/Gato	Nutrición enterocitos	0,5-1,0	g/kg	VO	al día			
Digestivo y Metabolismo	Suplementos nutricionales	Palmitoiletanolamida		Gato	Dermatitis atópica	15	mg/kg	VO	c24h			
Digestivo y Metabolismo	Suplementos nutricionales	Palmitoiletanolamida		Perro	Dermatitis atópica	10	mg/kg	VO	c24h			
Digestivo y Metabolismo	Suplementos nutricionales	Ácido graso poliinsaturado		Perro	Enfermedad articular degenerativa	50-100	mg/kg	VO	c24h		De EPA y DHA.	
Digestivo y Metabolismo	Suplementos nutricionales	Ácido graso poliinsaturado		Perro/Gato	Dermatitis atópica	60-75	mg/kg	VO	c24h		De ácidos eicosapentaenoico (EPA) y docosahexaenoico (DHA).	
Digestivo y Metabolismo	Suplementos nutricionales	Ácido graso poliinsaturado		Perro/Gato	Insuficiencia cardiaca	30-40 de EPA y 20-25 de DHA	mg/kg	VO	c24h			
Digestivo y Metabolismo	Vitamina A	Retinol		Perro	Seborrea primaria idiopática y adenitis sebácea	500	UI/kg	VO	c12h			
Digestivo y Metabolismo	Vitamina C	Ácido ascórbico		Perro/Gato	Alcalinización del pH urinario	30	mg/kg	VO	c12-24h			
Digestivo y Metabolismo	Vitamina D y análogos	Alfacalcidol		Perro/Gato	Hipocalcemia crónica	0,01-0,03	mcg/kg	VO	c24h	inicialmente		
Digestivo y Metabolismo	Vitamina D y análogos	Calcitriol		Perro/Gato	Hiperparatiroidismo secundario renal	0,002-0,003	mcg/kg	VO	c24h			
Digestivo y Metabolismo	Vitamina D y análogos	Calcitriol		Perro/Gato	Hipocalcemia crónica	0,02-0,03	mcg/kg	VO	c24h	inicialmente		
Digestivo y Metabolismo	Vitamina E	Tocoferol		Perro/Gato	Protector hepático	50-400	UI/animal	VO	c24h			
Digestivo y Metabolismo	Vitaminas del complejo B	Cianocobalamina		Gato	Enteritis crónica; lipidosis hepática felina	250	mcg/gato	SC	semanal		Ver dosis oral en el capítulo correspondiente.	
Digestivo y Metabolismo	Vitaminas del complejo B	Cianocobalamina		Perro	Enteritis crónica; lipidosis hepática felina	250-1500	mcg/perro	SC	semanal		Ver dosis oral en el capítulo correspondiente.	
Digestivo y Metabolismo	Ácidos biliares	Ácido ursodesoxicólico		Perro/Gato	Hepatitis crónica y colangitis	10-15	mg/kg	VO	c24h			
Hematología y Oncología	Antianémicos	Darbepoetina alfa		Gato	Anemia no regenerativa	1	mcg/kg	SC	semanal	inicialmente		
Hematología y Oncología	Antianémicos	Darbepoetina alfa		Perro	Anemia no regenerativa	0,45	mcg/kg	SC	semanal	inicialmente		
Hematología y Oncología	Anticuerpos monoclonales	Bedinvetmab		Perro	Dolor asociado a enfermedad articular degenerativa	0,5-1,0	mg/kg	SC	mensual		Una vez al mes.	
Hematología y Oncología	Anticuerpos monoclonales	Frunevetmab		Gato	Dolor asociado a enfermedad articular degenerativa	1,0-2,8	mg/kg	SC	mensual		Una vez al mes.	
Hematología y Oncología	Anticuerpos monoclonales	Lokivetmab		Perro	Dermatitis atópica	1-2	mg/kg	SC	mensual o cada 4-8 semanas		Europa: dosis mínima 1 mg/kg una vez al mes; EE.UU.: dosis mínima 2 mg/kg cada 4-8 semanas.	
Hematología y Oncología	Antihemorrágicos	Fitomenadiona		Gato	Biopsia en lipidosis hepática	1	mg/kg	SC	c12-24h			
Hematología y Oncología	Antitrombóticos	Clopidogrel		Gato	Glomerulonefritis	18,75	mg/gato	VO	c24h			
Hematología y Oncología	Antitrombóticos	Clopidogrel		Gato	Trombosis	18,75	mg/gato	VO	c24h			
Hematología y Oncología	Antitrombóticos	Clopidogrel		Perro	Glomerulonefritis	2-4	mg/kg	VO	c24h		Con dosis de carga de 10 mg/kg.	
Hematología y Oncología	Antitrombóticos	Clopidogrel		Perro	Trombosis	2-4	mg/kg	VO	c24h		Con dosis de carga de 10 mg/kg.	
Hematología y Oncología	Antitrombóticos	Dalteparina		Gato	Trombosis	75	UI/kg	SC	c6h			
Hematología y Oncología	Antitrombóticos	Dalteparina		Perro	Trombosis	150-175	UI/kg	SC	c8h			
Hematología y Oncología	Antitrombóticos	Enoxaparina		Gato	Trombosis	0,75-1,00	mg/kg	SC	c6-12h			
Hematología y Oncología	Antitrombóticos	Enoxaparina		Perro	Trombosis	0,8-1,0	mg/kg	SC	c6-8h			
Hematología y Oncología	Antitrombóticos	Heparina sódica		Gato	Trombosis	250-275	UI/kg	IV	dosis inicial		Seguido de 150-250 UI/kg SC c6-8h.	
Hematología y Oncología	Antitrombóticos	Heparina sódica		Perro	Trombosis	200-250	UI/kg	IV	dosis inicial		Seguido de 200-250 UI/kg SC c6-8h.	
Hematología y Oncología	Antitrombóticos	Rivaroxabán		Gato	Trombosis	0,5-1,0	mg/kg	VO	c24h			
Hematología y Oncología	Antitrombóticos	Rivaroxabán		Perro	Trombosis	1-2	mg/kg	VO	c24h			
Hematología y Oncología	Citostáticos	Clorambucilo		Perro/Gato	Dermatitis inmunomediadas	0,1-0,2	mg/kg	VO	c24h			
Hematología y Oncología	Citostáticos	Clorambucilo		Perro/Gato	Glomerulonefritis inmunomediadas o autoinmunes	0,1-0,2	mg/kg	VO	c24-48h			
Hematología y Oncología	Citostáticos / ITK	Masitinib		Perro	Mastocitoma canino no extirpable grado II o III con receptor c-kit mutante confirmado	12,5	mg/kg	VO	c24h			
Hematología y Oncología	Citostáticos / ITK	Toceranib		Perro	Mastocitoma cutáneo canino no extirpable recurrente grado II o III	3,25	mg/kg	VO	c48h			
Hematología y Oncología	Coloides	Gelatina		Perro	Choque no cardiogénico e hipoproteinemia	2-4	mL/kg	IV lento				
Hematología y Oncología	Cristaloides	Calcio		Perro/Gato	Hipercalemia intensa	5-10	mg/kg de calcio	IV lento	en 15 minutos		Equivalente a 0,5-1,0 mL/kg de la presentación.	
Hematología y Oncología	Cristaloides	Calcio		Perro/Gato	Hipocalcemia aguda	5-15	mg/kg de calcio	IV lento			Equivalente a 0,5-1,5 mL/kg de la presentación.	
Hematología y Oncología	Cristaloides	Fosfato		Gato	Anemia hemolítica por hipofosfatemia	0,01-0,03	mmol/kg/h	IV infusión continua				
Hematología y Oncología	Cristaloides	Glucosa		Perro/Gato	Hipoglucemia	0,5	g/kg	IV bolo lento			Seguido de perfusión de glucosa al 2,5% o 5% en una solución equilibrada; cachorros: 1-3 mL de glucosa al 50%.	
Hematología y Oncología	Cristaloides	Mantenimiento, solución de		Perro/Gato	Fluidoterapia de mantenimiento	3-5	% del peso	IV	diario		En cachorros de menos de 12 semanas hasta el 12-20% de su peso.	
Hematología y Oncología	Cristaloides	NaCl 7,5%		Perro/Gato	Choque no cardiogénico y prevención del edema cerebral postraumático	3-5	mL/kg	IV lento				
Hematología y Oncología	Cristaloides	NaHCO3		Perro/Gato	Hipercaliemia moderada-intensa con acidosis metabólica	2-3	mmol/kg	IV	en 30 minutos			
Hematología y Oncología	Inmunosupresores	Azatioprina		Perro	Dermatitis; trombocitopenia; enteritis crónica; hepatitis crónica; artritis; glomerulonefritis inmunomediadas o autoinmunes	2	mg/kg	VO	c24h		Inicialmente.	
Hematología y Oncología	Inmunosupresores	Ciclosporina		Gato	Artritis inmunomediada felina; dermatitis inmunes caninas y felinas mediadas por linfocitos T y citotóxicas	7	mg/kg	VO	c24h		Inicialmente.	
Hematología y Oncología	Inmunosupresores	Ciclosporina		Gato	Asma	3	mg/kg	VO	c12h			
Hematología y Oncología	Inmunosupresores	Ciclosporina		Perro	Dermatitis atópica; enteritis crónica inmunomediada canina; dermatitis inmunes caninas y felinas mediadas por linfocitos T y citotóxicas	5	mg/kg	VO	c24h		Inicialmente. Ver combinación con ketoconazol en pg 398.	
Hematología y Oncología	Inmunosupresores	Ciclosporina		Perro/Gato	Glomerulonefritis inmunomediadas o autoinmunes	5-20	mg/kg	VO	c12h			
Hematología y Oncología	Inmunosupresores	Ciclosporina		Perro/Gato	Lupus eritematoso sistémico y hepatitis crónica inmunomediada	5	mg/kg	VO	c12-24h			
Hematología y Oncología	Inmunosupresores	Ciclosporina		Perro/Gato	Trombocitopenia inmunomediada primaria	5	mg/kg	VO	c12h			
Hematología y Oncología	Inmunosupresores	Leflunomida		Perro/Gato	Trombocitopenia inmunomediada primaria	2-4	mg/kg	VO	c24h			
Hematología y Oncología	Inmunosupresores	Micofenolato mofetilo		Perro	Glomerulonefritis y artritis inmunomediadas o autoinmunes	10	mg/kg	VO	c12h			
Hematología y Oncología	Inmunosupresores	Micofenolato mofetilo		Perro/Gato	Trombocitopenia inmunomediada primaria y lupus eritematoso sistémico	8-12	mg/kg	VO	c12h			
Hematología y Oncología	Interferones	Interferón omega recombinante felino		Gato	Calicivirosis aguda felina	2,5 millón	UI/kg	SC	c48h	3 dosis		
Hematología y Oncología	Interferones	Interferón omega recombinante felino		Gato	Gingivoestomatitis crónica	100000	UI/gato	mucosa oral	c24h			
Hematología y Oncología	Interferones	Interferón omega recombinante felino		Gato	Leucemia e inmunodeficiencia víricas	1 millón	UI/kg	SC	c24h	5 días consecutivos	Alternativa: 1 millón UI/kg SC en días 0, 14 y 60.	
Hematología y Oncología	Soluciones osmóticas	Manitol		Perro/Gato	Edema cerebral	0,5-1,0	g/kg	IV lento		inicialmente		
Hematología y Oncología	Soluciones osmóticas	Manitol		Perro/Gato	Glaucoma agudo	1,0-1,5	g/kg	IV lento				
Hematología y Oncología	Soluciones osmóticas	Manitol		Perro/Gato	Lesión renal aguda	0,25-1,00	g/kg	IV lento				
Hormonas / Endocrinología	Andrógenos	Testosterona		Perro macho	Incontinencia urinaria	2,2	mg/kg	IM	cada 4-8 semanas		No administrar a hembras gestantes ni a pacientes con hipertrofia de próstata, adenoma perianal o insuficiencia cardíaca, renal o hepática.	
Hormonas / Endocrinología	Antiandrógenos	Osaterona		Perro	Alopecia X	0,2-0,5	mg/kg	VO	c24h	7 días		
Hormonas / Endocrinología	Antiandrógenos	Osaterona		Perro	Hiperplasia prostática	0,2-0,5	mg/kg	VO	c24h	7 días		
Hormonas / Endocrinología	Antidiabéticos orales	Glipizida		Gato	Diabetes mellitus	2,5	mg/gato	VO	c12h	inicialmente	No administrar a pacientes con cetoacidosis.	
Hormonas / Endocrinología	Antiprogestágenos	Aglepristona		Gata	Hiperplasia fibroadenomatosa mamaria felina	10	mg/kg	SC	cada 24h	4-5 días consecutivos		
Hormonas / Endocrinología	Antiprogestágenos	Aglepristona		Perra	Abortivo	10	mg/kg	SC		repetir a las 24h	No administrar a diabéticos ni a pacientes con enfermedad renal, hepática o hipoadrenocorticismo.	
Hormonas / Endocrinología	Antiprogestágenos	Aglepristona		Perra	Complejo hiperplasia endometrial quística - piometra	10	mg/kg	SC		días 2, 7 y 14		
Hormonas / Endocrinología	Antiprogestágenos	Aglepristona		Perra	Hipersomatotropismo inducido por progestágenos	10	mg/kg	SC	cada 7 días			
Hormonas / Endocrinología	Antitiroideos	Metimazol		Gato	Hipertiroidismo	2,5-5,0	mg/gato	VO	al día en 2 tomas	inicialmente	No administrar a pacientes con diabetes mellitus, patologías autoinmunes, hepatopatía primaria grave o citopenias, ni a hembras lactantes ni gestantes.	
Hormonas / Endocrinología	Estrógenos	Estriol		Perra	Incontinencia urinaria	2	mg/perra	VO	c24h	inicialmente	No administrar a hembras gestantes, lactantes o menores de un año.	
Hormonas / Endocrinología	Glucocorticoides IV	Dexametasona IV		Perro	Hipoadrenocorticismo agudo	0,1-2,0	mg/kg	IV lento				
Hormonas / Endocrinología	Glucocorticoides IV	Dexametasona IV		Perro/Gato	Choque y anafilaxia	1-2	mg/kg	IV lento				
Hormonas / Endocrinología	Glucocorticoides IV	Metilprednisolona IV		Perro	Hipoadrenocorticismo agudo	1-2	mg/kg	IV lento	c6h		Succinato sódico.	
Hormonas / Endocrinología	Glucocorticoides IV	Metilprednisolona IV		Perro/Gato	Afecciones bronquiales inflamatorias agudas y edema laríngeo	2-4	mg/kg	IM/IV lento				
Hormonas / Endocrinología	Glucocorticoides LP	Metilprednisolona LP		Gato	Afecciones bronquiales inflamatorias	10-20	mg/gato	SC	cada 2-4 semanas			
Hormonas / Endocrinología	Glucocorticoides LP	Metilprednisolona LP		Gato	Dermatitis alérgicas	4-5	mg/kg	SC/IM	cada 2 meses o más			
Hormonas / Endocrinología	Glucocorticoides LP	Metilprednisolona LP		Perro/Gato	Queratitis no ulcerativa	5-40	mg	Vía subconjuntival				
Hormonas / Endocrinología	Glucocorticoides LP	Triamcinolona LP		Gato	Dermatitis alérgicas	5	mg/gato	SC/IM	cada 2 meses o más			
Hormonas / Endocrinología	Glucocorticoides LP	Triamcinolona LP		Perro/Gato	Queratitis no ulcerativa	2-10	mg	Vía subconjuntival				
Hormonas / Endocrinología	Glucocorticoides orales	Dexametasona oral		Gato	Dermatitis alérgicas	0,2	mg/kg	VO	c24h	inicialmente		
Hormonas / Endocrinología	Glucocorticoides orales	Metilprednisolona oral		Gato	Anemia y trombocitopenia inmunomediadas	2-4	mg/kg	VO	c24h	inicialmente	Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Metilprednisolona oral		Gato	Colangitis linfocitaria	1-2	mg/kg	VO	c12h	inicialmente	Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Metilprednisolona oral		Gato	Dermatitis autoinmunes (pénfigo foliáceo)	1,5-3,0	mg/kg	VO	al día	inicialmente	Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Metilprednisolona oral		Gato	Gingivoestomatitis crónica y enteritis crónica inmunomediada	2	mg/kg	VO	c24h	inicialmente	Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Metilprednisolona oral		Gato	Inflamación (otitis intensa, hernias discales)	2	mg/kg	VO	c24h	inicialmente	Algunos autores prefieren repartir la dosis diaria en dos tomas. Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Metilprednisolona oral		Gato	Prurito (dermatitis alérgicas); colangitis neutrofílica crónica felina	1-2	mg/kg	VO	c24h	inicialmente	Algunos autores prefieren repartir la dosis diaria en dos tomas. Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Metilprednisolona oral		Perro	Dermatitis autoinmunes; enteritis crónica inmunomediada canina	1,0-1,5	mg/kg	VO	c12h	inicialmente	Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Metilprednisolona oral		Perro	Hipoadrenocorticismo crónico	0,2	mg/kg	VO	c24h			
Hormonas / Endocrinología	Glucocorticoides orales	Metilprednisolona oral		Perro	Hipoglucemia crónica por hiperinsulinismo	0,25	mg/kg	VO	c12h	inicialmente		
Hormonas / Endocrinología	Glucocorticoides orales	Metilprednisolona oral		Perro	Inflamación (otitis intensa, hernias discales)	1	mg/kg	VO	c24h	inicialmente	Algunos autores prefieren repartir la dosis diaria en dos tomas. Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Metilprednisolona oral		Perro	Neuromiopatías y artritis inmunomediadas	1-2	mg/kg	VO	c12h	inicialmente	Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Metilprednisolona oral		Perro	Prurito (dermatitis alérgicas); enfermedad inflamatoria bronquial; uveítis	0,5-1,0	mg/kg	VO	c24h	inicialmente	Algunos autores prefieren repartir la dosis diaria en dos tomas. Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Metilprednisolona oral		Perro <25 kg	Anemia y trombocitopenia inmunomediadas	2	mg/kg	VO	c24h	inicialmente	En perros >25 kg: 40-60 mg/m². Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Metilprednisolona oral		Perro/Gato	Hepatitis crónica inmunomediada	1-2	mg/kg	VO	c24h	inicialmente	Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Prednisolona		Gato	Anemia y trombocitopenia inmunomediadas	2-4	mg/kg	VO	c24h	inicialmente	Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Prednisolona		Gato	Colangitis linfocitaria	1-2	mg/kg	VO	c12h	inicialmente	Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Prednisolona		Gato	Dermatitis autoinmunes (pénfigo foliáceo)	1,5-3,0	mg/kg	VO	al día	inicialmente	Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Prednisolona		Gato	Gingivoestomatitis crónica y enteritis crónica inmunomediada	2	mg/kg	VO	c24h	inicialmente	Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Prednisolona		Gato	Inflamación (otitis intensa, hernias discales)	2	mg/kg	VO	c24h	inicialmente	Algunos autores prefieren repartir la dosis diaria en dos tomas. Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Prednisolona		Gato	Prurito (dermatitis alérgicas); colangitis neutrofílica crónica felina	1-2	mg/kg	VO	c24h	inicialmente	Algunos autores prefieren repartir la dosis diaria en dos tomas. Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Prednisolona		Perro	Dermatitis autoinmunes; enteritis crónica inmunomediada canina	1,0-1,5	mg/kg	VO	c12h	inicialmente	Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Prednisolona		Perro	Hipoadrenocorticismo crónico	0,2	mg/kg	VO	c24h			
Hormonas / Endocrinología	Glucocorticoides orales	Prednisolona		Perro	Hipoglucemia crónica por hiperinsulinismo	0,25	mg/kg	VO	c12h	inicialmente		
Hormonas / Endocrinología	Glucocorticoides orales	Prednisolona		Perro	Inflamación (otitis intensa, hernias discales)	1	mg/kg	VO	c24h	inicialmente	Algunos autores prefieren repartir la dosis diaria en dos tomas. Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Prednisolona		Perro	Neuromiopatías y artritis inmunomediadas	1-2	mg/kg	VO	c12h	inicialmente	Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Prednisolona		Perro	Prurito (dermatitis alérgicas); enfermedad inflamatoria bronquial; uveítis	0,5-1,0	mg/kg	VO	c24h	inicialmente	Algunos autores prefieren repartir la dosis diaria en dos tomas. Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Prednisolona		Perro <25 kg	Anemia y trombocitopenia inmunomediadas	2	mg/kg	VO	c24h	inicialmente	En perros >25 kg: 40-60 mg/m². Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Prednisolona		Perro/Gato	Hepatitis crónica inmunomediada	1-2	mg/kg	VO	c24h	inicialmente	Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Prednisona		Gato	Anemia y trombocitopenia inmunomediadas	2-4	mg/kg	VO	c24h	inicialmente	Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Prednisona		Gato	Colangitis linfocitaria	1-2	mg/kg	VO	c12h	inicialmente	Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Prednisona		Gato	Dermatitis autoinmunes (pénfigo foliáceo)	1,5-3,0	mg/kg	VO	al día	inicialmente	Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Prednisona		Gato	Gingivoestomatitis crónica y enteritis crónica inmunomediada	2	mg/kg	VO	c24h	inicialmente	Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Prednisona		Gato	Inflamación (otitis intensa, hernias discales)	2	mg/kg	VO	c24h	inicialmente	Algunos autores prefieren repartir la dosis diaria en dos tomas. Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Prednisona		Gato	Prurito (dermatitis alérgicas); colangitis neutrofílica crónica felina	1-2	mg/kg	VO	c24h	inicialmente	Algunos autores prefieren repartir la dosis diaria en dos tomas. Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Prednisona		Perro	Dermatitis autoinmunes; enteritis crónica inmunomediada canina	1,0-1,5	mg/kg	VO	c12h	inicialmente	Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Prednisona		Perro	Hipoadrenocorticismo crónico	0,2	mg/kg	VO	c24h			
Hormonas / Endocrinología	Glucocorticoides orales	Prednisona		Perro	Hipoglucemia crónica por hiperinsulinismo	0,25	mg/kg	VO	c12h	inicialmente		
Hormonas / Endocrinología	Glucocorticoides orales	Prednisona		Perro	Inflamación (otitis intensa, hernias discales)	1	mg/kg	VO	c24h	inicialmente	Algunos autores prefieren repartir la dosis diaria en dos tomas. Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Prednisona		Perro	Neuromiopatías y artritis inmunomediadas	1-2	mg/kg	VO	c12h	inicialmente	Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Prednisona		Perro	Prurito (dermatitis alérgicas); enfermedad inflamatoria bronquial; uveítis	0,5-1,0	mg/kg	VO	c24h	inicialmente	Algunos autores prefieren repartir la dosis diaria en dos tomas. Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Prednisona		Perro <25 kg	Anemia y trombocitopenia inmunomediadas	2	mg/kg	VO	c24h	inicialmente	En perros >25 kg: 40-60 mg/m². Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Glucocorticoides orales	Prednisona		Perro/Gato	Hepatitis crónica inmunomediada	1-2	mg/kg	VO	c24h	inicialmente	Posología grupal compartida con prednisona/prednisolona/metilprednisolona oral.	
Hormonas / Endocrinología	Gonadotrofinas	Gonadotrofina coriónica humana (HCG)		Perra	Quistes ováricos	450-3.000	UI/perra	IM				
Hormonas / Endocrinología	Homeostasis del calcio	Alendrónico ácido		Perro	Hiperparatiroidismo primario	1-4	mg/kg	VO	cada 2-3 días			
Hormonas / Endocrinología	Homeostasis del calcio	Pamidrónico ácido		Gato	Hiperparatiroidismo primario	1,5-2,0	mg/kg	IV				
Hormonas / Endocrinología	Homeostasis del calcio	Pamidrónico ácido		Perro	Dolor en neoplasia ósea	1-2	mg/kg	IV lento	cada 3-4 semanas	en dos horas	Diluir en 4 mL/kg de NaCl al 0,9%.	
Hormonas / Endocrinología	Homeostasis del calcio	Pamidrónico ácido		Perro	Hiperparatiroidismo primario	1,3-2,0	mg/kg	IV	inicialmente			
Hormonas / Endocrinología	Homeostasis del calcio	Zoledrónico ácido		Perro	Dolor en neoplasia ósea	0,1-0,2	mg/kg	IV lento	cada 3-4 semanas	15 minutos	Máximo 4 mg totales; en 50-100 mL de NaCl al 0,9%.	
Hormonas / Endocrinología	Hormonas hiperglucemiantes	Glucagón		Perro	Hipoglucemia aguda por hiperinsulinismo	5	ng/kg/min	IV	continuo	inicialmente	Ver modo de administración en el capítulo correspondiente.	
Hormonas / Endocrinología	Hormonas liberadoras de gonadotrofinas	Buserelina		Perra	Quistes ováricos	0,8-6,0	mcg/perra	SC			Ver frecuencia en el artículo correspondiente.	
Hormonas / Endocrinología	Hormonas liberadoras de gonadotrofinas	Buserelina		Perro	Criptorquidia	10	mcg/perro	SC	semanal	3 dosis		
Hormonas / Endocrinología	Hormonas liberadoras de gonadotrofinas	Deslorelina		Perro	Alopecia X	4,7	mg/perro	SC				
Hormonas / Endocrinología	Hormonas liberadoras de gonadotrofinas	Deslorelina		Perro	Inducción de esterilidad transitoria	4,7	mg/perro	SC		mínimo 6 meses	La esterilidad se consigue a las 6 semanas de iniciar el tratamiento.	
Hormonas / Endocrinología	Hormonas tiroideas	Levotiroxina		Perro	Crisis hipotiroidea	5	mcg/kg	IV	c12h		No administrar a pacientes con insuficiencia adrenal.	
Hormonas / Endocrinología	Hormonas tiroideas	Levotiroxina		Perro	Hipotiroidismo	10	mcg/kg	VO	c12h	2-3 horas antes de la comida	Comprimidos.	
Hormonas / Endocrinología	Hormonas tiroideas	Levotiroxina		Perro	Hipotiroidismo	20	mcg/kg	VO	c24h	2-3 horas antes de la comida	Solución oral.	
Hormonas / Endocrinología	Inhibidores de la testosterona-5-alfa reductasa	Finasterida		Perro	Hiperplasia prostática	0,1-1,0	mg/kg	VO	c24h	1-4 meses		
Hormonas / Endocrinología	Inhibidores del cotransportador de sodio-glucosa tipo 2	Velagliflozina		Gato	Diabetes mellitus	1	mg/kg	VO	c24h		No administrar a pacientes con cetoacidosis ni intensamente deshidratados.	
Hormonas / Endocrinología	Insulinas	Insulina glargina		Gato	Diabetes mellitus	0,5	UI/kg	SC	c12h	inicialmente		
Hormonas / Endocrinología	Insulinas	Insulina protamina zinc		Gato	Diabetes mellitus	0,2-0,4	UI/kg	SC	c12h	inicialmente	Alternativa: 1-2 UI/gato SC c12h inicialmente.	
Hormonas / Endocrinología	Insulinas	Insulina protamina zinc		Gato	Diabetes mellitus	1-2	UI/gato	SC	c12h	inicialmente	Alternativa a 0,2-0,4 UI/kg.	
Hormonas / Endocrinología	Insulinas	Insulina protamina zinc		Perro	Diabetes mellitus	0,5-1,0	UI/kg	SC	al día	repartidas en una o dos dosis		
Hormonas / Endocrinología	Insulinas	Insulina regular (acción rápida)		Perro/Gato	Hipercaliemia moderada-intensa sin acidosis metabólica	0,25-0,50	UI/kg	IV			Seguido de 1-2 g de glucosa por unidad de insulina IV.	
Hormonas / Endocrinología	Insulinas	Insulina veterinaria (acción intermedia)		Gato	Diabetes mellitus	0,25-0,50	UI/kg	SC	c12h		Máximo 2-3 UI/gato por inyección.	
Hormonas / Endocrinología	Insulinas	Insulina veterinaria (acción intermedia)		Perro	Diabetes mellitus	0,25-0,50	UI/kg	SC	c12h		Comenzando con la dosis inferior.	
Hormonas / Endocrinología	Mineralocorticoides	Desoxicorticosterona		Perro	Hipoadrenocorticismo crónico	2,2	mg/kg	SC	cada 25 días	inicialmente	No ha quedado demostrada su seguridad durante la gestación y lactancia.	
Hormonas / Endocrinología	Mineralocorticoides	Fludrocortisona		Perro	Hipoadrenocorticismo crónico	0,01-0,02	mg/kg	VO	c24h			
Hormonas / Endocrinología	Oxitocina	Oxitocina		Perra	Metritis	5-20	UI/perra	IM	c12-24h		No administrar en pacientes con enfermedades cardiovasculares.	
Hormonas / Endocrinología	Progestágenos	Medroxiprogesterona		Perro	Hiposomatotropismo	2,5-5,0	mg/kg	SC	cada 3 semanas	6 dosis inicialmente	No administrar a pacientes con diabetes mellitus, neoplasias mamarias o piometra, a hembras gestantes o con alteraciones de las fases de proestro, estro o metaestro del ciclo estral, ni antes o durante el primer celo.	
Hormonas / Endocrinología	Prostaglandinas	Dinoprost		Gata	Complejo hiperplasia endometrial quística - piometra	0,1	mg/kg	SC	c24h			
Hormonas / Endocrinología	Prostaglandinas	Dinoprost		Perra	Complejo hiperplasia endometrial quística - piometra	0,025-0,050	mg/kg	SC	6-8 veces al día	2-3 días		
Hormonas / Endocrinología	Prostaglandinas	Dinoprost		Perra	Complejo hiperplasia endometrial quística - piometra	0,10-0,25	mg/kg	SC	c12-24h	3-8 días		
Hormonas / Endocrinología	Prostaglandinas	Dinoprost		Perra	Metritis	0,10-0,25	mg/kg	SC	c12-24h	3-8 días	No administrar en piometras cerradas.	
Hormonas / Endocrinología	Vasopresinas	Desmopresina		Gato	Diabetes insípida central	0,025-0,050	mg	VO	c12h	inicialmente	Comprimidos.	
Hormonas / Endocrinología	Vasopresinas	Desmopresina		Gato	Diabetes insípida central	1	gota/animal	vía conjuntival	c12h			
Hormonas / Endocrinología	Vasopresinas	Desmopresina		Perro	Diabetes insípida central	1-4	gotas/animal	vía conjuntival	c8-24h		Según tamaño.	
Hormonas / Endocrinología	Vasopresinas	Desmopresina		Perro 5-20 kg	Diabetes insípida central	0,1	mg	VO	c12h	inicialmente	Comprimidos.	
Hormonas / Endocrinología	Vasopresinas	Desmopresina		Perro <5 kg	Diabetes insípida central	0,05	mg	VO	c12h	inicialmente	Comprimidos.	
Hormonas / Endocrinología	Vasopresinas	Desmopresina		Perro >20 kg	Diabetes insípida central	0,2	mg	VO	c12h	inicialmente	Comprimidos.	
Otros Fármacos	Alcalinizantes urinarios	Potasio citrato		Perro/Gato	Acidosis metabólica en glomerulonefritis y alcalinización del pH urinario	0,3-0,5	mmol/kg	VO	c12h		No administrar a pacientes con enfermedad cardiaca.	
Otros Fármacos	Alcalinizantes urinarios	Potasio citrato		Perro/Gato	Urolitos de oxalato cálcico o de urato	75	mg/kg	VO	c12-24h		No administrar a pacientes con enfermedad cardiaca.	
Otros Fármacos	Antídotos	Atipamezol		Gato	Antagonismo de agonistas alfa2-adrenérgicos	0,2	mg/kg	IM			Para revertir xilacina; para revertir medetomidina, 0,1-0,4 mg/kg IM (o 2,5 veces la dosis en mcg de medetomidina administrada); para revertir dexmedetomidina, 5 veces la dosis administrada en mcg. No administrar a pacientes con insuficiencia renal, hepática o cardiaca, ni a hembras gestantes.	
Otros Fármacos	Antídotos	Atipamezol		Perro	Antagonismo de agonistas alfa2-adrenérgicos	0,2	mg/kg	IM			Para revertir xilacina; para revertir medetomidina, 0,05-0,40 mg/kg IM (o 5 veces la dosis en mcg de medetomidina administrada); para revertir dexmedetomidina, 10 veces la dosis administrada en mcg. No administrar a pacientes con insuficiencia renal, hepática o cardiaca, ni a hembras gestantes.	
Otros Fármacos	Antídotos	Atipamezol		Perro/Gato	Antagonismo de amitraz	50-200	mcg/kg	IM			Equivalente a 0,05-0,20 mg/kg. No administrar a pacientes con insuficiencia renal, hepática o cardiaca, ni a hembras gestantes.	
Otros Fármacos	Antídotos	Edrofonio		Perro/Gato	Antagonismo de relajantes musculares no benzodiazepínicos (bloqueantes neuromusculares)	0,5-1,0	mg/kg	IV			No administrar a pacientes con peritonitis u obstrucciones mecánicas del tracto gastrointestinal o urinario.	
Otros Fármacos	Antídotos	Flumazenilo		Perro/Gato	Antagonismo de benzodiazepinas	0,02-0,10	mg/kg	IV				
Otros Fármacos	Antídotos	Naloxona		Perro/Gato	Antagonismo de agonistas opioides	0,01-0,04	mg/kg	SC/IM/IV				
Otros Fármacos	Otros	Acetohidroxámico ácido		Perro	Urolitos de estruvita	12,5	mg/kg	VO	c12h		No administrar a pacientes con insuficiencia renal (creatinina >2,5 mg/dL).	
Otros Fármacos	Otros	Colchicina		Perro/Gato	Amiloidosis	0,01-0,03	mg/kg	VO	c24h			
Otros Fármacos	Otros	DL Metionina		Perro/Gato	Urolitos de estruvita	100	mg/kg	VO	c12h			
Otros Fármacos	Otros	Lotrifen		Perro	Abortivo	2,5	mg/kg	IM profunda			Administrar entre el día 9º y 13º después del acoplamiento. No administrar pasados 15 días del acoplamiento, ni en perras con hepatopatía, nefropatía o enfermedad gastrointestinal grave.	
Otros Fármacos	Otros	Melatonina		Perro	Distrofias foliculares, alopecia cíclica de los flancos, alopecia X y alopecias con patrón de distribución	3	mg/perro pequeño	VO	c12h		Según tamaño. No administrar a diabéticos.	
Otros Fármacos	Otros	Melatonina		Perro	Distrofias foliculares, alopecia cíclica de los flancos, alopecia X y alopecias con patrón de distribución	6-12	mg/perro mediano-grande	VO	c12h		Según tamaño. No administrar a diabéticos.	
Otros Fármacos	Otros	Oclacitinib		Perro	Dermatitis atópica y vasculitis canina de la punta auricular	0,4-0,6	mg/kg	VO	c12h	2 semanas	Seguido de una sola dosis diaria. No administrar a pacientes de menos de 12 meses o de menos de 3 kg, ni inmunodeprimidos o con cáncer progresivo.	
Otros Fármacos	Otros	Penicilamina		Perro	Hepatopatía asociada al cobre	15	mg/kg	VO	c12h			
Otros Fármacos	Otros	Tigilanol tiglato		Perro	Mastocitoma subcutáneo irresecable y no metastásico de menos de 8 cm³	volumen neoplasia (cm³) × 0,5	mL	Intraneoplásica			Máximo 0,15 mL/kg y 4 mL/perro.	
Otros Fármacos	Quelantes del fósforo	Calcio carbonato - Chitosán		Perro/Gato	Hiperfosfatemia	90-150	mg/kg de calcio carbonato	VO	al día			
Otros Fármacos	Quelantes del fósforo	Lantano carbonato		Perro/Gato	Hiperfosfatemia	12,5-25,0	mg/kg	VO	al día		Administrar en la comida.	
Otros Fármacos	Quelantes del fósforo	Sevelámero		Perro	Hiperfosfatemia	30-50	mg/kg	VO	c8h			
Respiratorio	Antihistamínicos H1	Ciproheptadina		Gato	Asma	2-4	mg/gato	VO	c12h			
Respiratorio	Antihistamínicos H1	Difenhidramina		Perro/Gato	Estomatitis por procesionaria	1-2	mg/kg	SC/IM/IV	c12h	1-3 días	No administrar a pacientes con retención urinaria, glaucoma o hipotiroidismo.	
Respiratorio	Antihistamínicos H1	Difenhidramina		Perro/Gato	Rinitis canina y urticaria	2-4	mg/kg	VO	c8h		No administrar a pacientes con retención urinaria, glaucoma o hipotiroidismo.	
Respiratorio	Antihistamínicos H1	Hidroxizina		Perro/Gato	Urticaria	2	mg/kg	VO	c12h			
Respiratorio	Antitusivos	Dextrometorfano		Perro/Gato	Tos	1-2	mg/kg	VO	c6-8h			
Respiratorio	Broncodilatadores	Teofilina		Gato	Afecciones bronquiales	5-7	mg/kg	VO	c12h			
Respiratorio	Broncodilatadores	Teofilina		Gato	Afecciones bronquiales	15	mg/kg	VO	c24h		De acción sostenida (retard), por la noche.	
Respiratorio	Broncodilatadores	Teofilina		Gato	Bloqueo atrioventricular de tercer grado	25	mg/kg	VO	c24h		De acción sostenida (retard).	
Respiratorio	Broncodilatadores	Teofilina		Gato	Insuficiencia cardiaca aguda	4	mg/kg	VO	c12h			
Respiratorio	Broncodilatadores	Teofilina		Gato	Insuficiencia cardiaca aguda	25	mg/kg	VO	c24h		De acción sostenida (retard).	
Respiratorio	Broncodilatadores	Teofilina		Perro	Afecciones bronquiales y síndrome canino del seno enfermo	10	mg/kg	VO	c12h		De acción sostenida (retard).	
Respiratorio	Broncodilatadores	Teofilina		Perro	Afecciones bronquiales y síndrome canino del seno enfermo	5-7	mg/kg	VO	c8h			
Respiratorio	Broncodilatadores	Teofilina		Perro	Insuficiencia cardiaca aguda	5-7	mg/kg	IV lento o VO	c8h			
Respiratorio	Broncodilatadores	Teofilina		Perro	Insuficiencia cardiaca aguda	10	mg/kg	VO	c12h		De acción sostenida (retard).	
Respiratorio	Descongestionantes nasales	Fenilefrina nasal		Perro/Gato	Rinitis	1-2	gotas	Intranasal	c8h			
Respiratorio	Glucocorticoides inhalados	Fluticasona		Gato	Asma felina	2 inhalaciones de 250	mcg	Inhalatoria	c12h	inicialmente	Según la intensidad del cuadro.	
Respiratorio	Glucocorticoides inhalados	Fluticasona		Perro	Colapso traqueal canino	100	mcg	Inhalatoria	c6-12h	inicialmente		
Respiratorio	Glucocorticoides inhalados	Fluticasona		Perro	Enfermedad respiratoria inflamatoria crónica (bronquitis crónica, bronquitis eosinofílica)	100 o 250	mcg	Inhalatoria	c12h	inicialmente	Según peso (<12 kg o >12 kg); 7-10 respiraciones con dispositivo apropiado (AeroDawg).	
Respiratorio	Mucolíticos	Acetilcisteína		Perro/Gato	Mucolítico	30-60	mg/kg	VO	c8-12h		Sin superar los 600 mg/dosis.	
Respiratorio	Mucolíticos	Bromhexina		Gato	Afecciones bronquiales	1	mg/kg	VO	c24h		No administrar a pacientes con edema pulmonar.	
Respiratorio	Mucolíticos	Bromhexina		Perro	Afecciones bronquiales	2,0-2,5	mg/kg	VO	c12h		No administrar a pacientes con edema pulmonar.	
Respiratorio	β2-agonistas	Clenbuterol		Gato	Afecciones bronquiales	1	mcg/kg	IM/SC/VO	c24h			
Respiratorio	β2-agonistas	Clenbuterol		Perro	Afecciones bronquiales	0,8	mcg/kg	IM/SC/VO	c12h			
Respiratorio	β2-agonistas	Salbutamol		Gato	Afecciones bronquiales	0,1-0,3	mg/kg	VO	c24h			
Respiratorio	β2-agonistas	Salbutamol		Gato	Asma felina	100	mcg	Inhalatoria	c12h			
Respiratorio	β2-agonistas	Salbutamol		Gato	Asma felina en crisis	100	mcg	Inhalatoria	cada 30 min		Máximo 8 inhalaciones.	
Respiratorio	β2-agonistas	Salbutamol		Perro	Afecciones bronquiales	0,02	mg/kg	VO	c12h		Si no mejora, aumentar hasta 0,05 mg/kg c8-12h, salvo que aparezcan temblores o inquietud.	
Respiratorio	β2-agonistas	Terbutalina		Gato	Afecciones bronquiales	0,625-1,250	mg/gato	VO	c12h			
Respiratorio	β2-agonistas	Terbutalina		Gato	Bloqueo atrioventricular de tercer grado	0,625	mg/gato	VO	c12h			
Respiratorio	β2-agonistas	Terbutalina		Perro	Afecciones bronquiales (grandes)	2,5-5,0	mg/animal	VO	c12h			
Respiratorio	β2-agonistas	Terbutalina		Perro	Afecciones bronquiales (medianos)	1,25-2,50	mg/animal	VO	c12h			
Respiratorio	β2-agonistas	Terbutalina		Perro	Afecciones bronquiales (pequeños)	0,625-1,250	mg/animal	VO	c12h			
Respiratorio	β2-agonistas	Terbutalina		Perro	Síndrome del seno enfermo	0,2	mg/kg	VO	c8-12h			
Sistema Nervioso	Agonistas α2-adrenérgicos	Clonidina		Perro	Prevención de fobia o ansiedad	0,01-0,05	mg/kg	VO	dosis única		Máximo 0,9 mg; 90-120 min antes del evento.	
Sistema Nervioso	Agonistas α2-adrenérgicos	Dexmedetomidina		Gato	Dolor (combinado con opioides)	5-15	mcg/kg	IM				
Sistema Nervioso	Agonistas α2-adrenérgicos	Dexmedetomidina		Gato	Dolor (combinado con opioides)	2,5-7,5	mcg/kg	IV				
Sistema Nervioso	Agonistas α2-adrenérgicos	Dexmedetomidina		Gato	Dolor (combinado con opioides, perfusión)	0,5-2,0	mcg/kg/h	IV				
Sistema Nervioso	Agonistas α2-adrenérgicos	Dexmedetomidina		Gato	Inducción del vómito	7	mcg/kg	IM	dosis única			
Sistema Nervioso	Agonistas α2-adrenérgicos	Dexmedetomidina		Gato	Inducción del vómito	3,5	mcg/kg	IV	dosis única			
Sistema Nervioso	Agonistas α2-adrenérgicos	Dexmedetomidina		Gato	Preanestesia	40	mcg/kg	IM				
Sistema Nervioso	Agonistas α2-adrenérgicos	Dexmedetomidina		Perro	Dolor (combinado con opioides)	1-10	mcg/kg	IM				
Sistema Nervioso	Agonistas α2-adrenérgicos	Dexmedetomidina		Perro	Dolor (combinado con opioides)	0,5-5,0	mcg/kg	IV				
Sistema Nervioso	Agonistas α2-adrenérgicos	Dexmedetomidina		Perro	Dolor (combinado con opioides, perfusión)	0,5-2,0	mcg/kg/h	IV				
Sistema Nervioso	Agonistas α2-adrenérgicos	Dexmedetomidina		Perro	Fobia al ruido	125	mcg/m²	mucosa gingival	dosis única			
Sistema Nervioso	Agonistas α2-adrenérgicos	Dexmedetomidina		Perro	Preanestesia	125-375	mcg/m²	IM/IV			En perro; ver tabla de conversión.	
Sistema Nervioso	Agonistas α2-adrenérgicos	Dexmedetomidina		Perro/Gato	Sedación profunda y anestesia de corta duración	5-20	mcg/kg	IM			En perro también 125-375 mcg/m²; ver combinaciones con opioides y ketamina.	
Sistema Nervioso	Agonistas α2-adrenérgicos	Medetomidina		Gato	Dolor (combinado con opioides)	10-30	mcg/kg	IM				
Sistema Nervioso	Agonistas α2-adrenérgicos	Medetomidina		Gato	Dolor (combinado con opioides)	5-15	mcg/kg	IV				
Sistema Nervioso	Agonistas α2-adrenérgicos	Medetomidina		Perro	Dolor (combinado con opioides)	4-10	mcg/kg	IM				
Sistema Nervioso	Agonistas α2-adrenérgicos	Medetomidina		Perro	Dolor (combinado con opioides)	2-5	mcg/kg	IV				
Sistema Nervioso	Agonistas α2-adrenérgicos	Medetomidina		Perro	Preanestesia	10-20	mcg/kg	IM/IV				
Sistema Nervioso	Agonistas α2-adrenérgicos	Medetomidina		Perro/Gato	Sedación profunda y anestesia de corta duración	10-50	mcg/kg	IM			Ver combinaciones con opioides y ketamina.	
Sistema Nervioso	Agonistas α2-adrenérgicos	Xilacina		Gato	Inducción del vómito	0,5-1,0	mg/kg	SC/IM				
Sistema Nervioso	Agonistas α2-adrenérgicos	Xilacina		Gato	Sedación	3	mg/kg	IM				
Sistema Nervioso	Agonistas α2-adrenérgicos	Xilacina		Perro	Dolor (combinado con opioides)	0,5-1,0	mg/kg	IM				
Sistema Nervioso	Agonistas α2-adrenérgicos	Xilacina		Perro	Sedación	1-3	mg/kg	IM				
Sistema Nervioso	Anestésicos generales	Ketamina		Perro/Gato	Crisis convulsiva refractaria	3-5	mg/kg	IV			Ver protocolo con dexmedetomidina.	
Sistema Nervioso	Anestésicos generales	Ketamina		Perro/Gato	Dolor	0,2-0,5	mg/kg	IV			+ 10 mcg/kg/min intraoperatorio o 2-5 mcg/kg/min posoperatorio.	
Sistema Nervioso	Anestésicos generales	Propofol		Perro/Gato	Crisis convulsiva	1-6	mg/kg	IV	dosis-efecto			
Sistema Nervioso	Anestésicos locales	Lidocaína anestesia		Perro	Analgesia epidural	0,2	mL/kg al 2%	epidural				
Sistema Nervioso	Anticolinesterásicos (parasimpáticomiméticos)	Neostigmina		Perro/Gato	Antagonismo de relajantes musculares no benzodiazepínicos (bloqueantes neuromusculares)	0,1	mg/kg	IV				
Sistema Nervioso	Anticolinesterásicos (parasimpáticomiméticos)	Neostigmina		Perro/Gato	Miastenia grave	0,04	mg/kg	SC/IM	cada 6h			
Sistema Nervioso	Anticolinesterásicos (parasimpáticomiméticos)	Piridostigmina		Perro/Gato	Miastenia grave	0,5-3,0	mg/kg	VO	c8-12h		Comenzando por la dosis inferior.	
Sistema Nervioso	Antidepresivos tricíclicos	Imipramina		Gato	Incontinencia urinaria	2,5-5,0	mg/gato	VO	c12h			
Sistema Nervioso	Antidepresivos tricíclicos	Imipramina		Perro	Incontinencia urinaria	5-15	mg/perro	VO	c12h			
Sistema Nervioso	Antidepresivos tricíclicos	Imipramina		Perro/Gato	Narcolepsia	0,5-1,5	mg/kg	VO	c12h		Comenzar con 0,5 mg/kg c12h.	
Sistema Nervioso	Antiepilépticos	Fenobarbital		Gato	Epilepsia	2,5	mg/kg	VO	c12h	inicialmente		
Sistema Nervioso	Antiepilépticos	Fenobarbital		Perro	Epilepsia	5	mg/kg	VO	al día en 2-3 tomas	inicialmente		
Sistema Nervioso	Antiepilépticos	Imepitoin		Perro	Epilepsia idiopática	10-20	mg/kg	VO	c12h	inicialmente		
Sistema Nervioso	Antiepilépticos	Imepitoin		Perro	Fobia al ruido	30	mg/kg	VO	c12h		Empezar 48 horas antes del evento.	
Sistema Nervioso	Antiepilépticos	Levetiracetam		Gato	Epilepsia	20	mg/kg	VO	c8h	inicialmente		
Sistema Nervioso	Antiepilépticos	Zonisamida		Gato	Epilepsia	5-15	mg/kg	VO	c12-24h			
Sistema Nervioso	Antiepilépticos	Zonisamida		Perro	Epilepsia	5	mg/kg	VO	c12h		Doble dosis si se combina con fenobarbital.	
Sistema Nervioso	Benzodiazepinas	Alprazolam		Gato	Crisis de pánico o de angustia	0,125-0,250	mg/gato	VO	dosis única o c8-24h			
Sistema Nervioso	Benzodiazepinas	Alprazolam		Perro	Crisis de pánico o de angustia	0,02-0,10	mg/kg	VO	dosis única o c6-12h		Al inicio de la ansiedad por separación.	
Sistema Nervioso	Benzodiazepinas	Clonazepam		Gato	Crisis de pánico o de angustia	0,05-0,25	mg/kg	VO	dosis única o c8-24h			
Sistema Nervioso	Benzodiazepinas	Clonazepam		Perro	Crisis de pánico o de angustia	0,1-1,0	mg/kg	VO	dosis única o c8-12h		Comenzar con la dosis baja.	
Sistema Nervioso	Benzodiazepinas	Clorazepato		Gato	Crisis de pánico o de angustia	0,5-2,0	mg/kg	VO	dosis única o c12-24h		En crisis grave: dosis única; a largo plazo c12-24h.	
Sistema Nervioso	Benzodiazepinas	Clorazepato		Perro	Crisis de pánico o de angustia	0,5-2,0	mg/kg	VO	dosis única o c8-12h		En crisis grave: dosis única; a largo plazo c8-12h.	
Sistema Nervioso	Benzodiazepinas	Diazepam		Gato	Crisis de pánico o de angustia	0,2-0,5	mg/kg	VO	c8-12h		Comenzar con la dosis menor.	
Sistema Nervioso	Benzodiazepinas	Diazepam		Perro	Crisis de pánico o de angustia	0,5-2,0	mg/kg	VO	dosis única o c4h			
Sistema Nervioso	Benzodiazepinas	Diazepam		Perro	Dolor (combinado con opioides)	0,25	mg/kg	IV				
Sistema Nervioso	Benzodiazepinas	Diazepam		Perro	Espasmo muscular	0,2-0,5	mg/kg	VO	c8-12h			
Sistema Nervioso	Benzodiazepinas	Diazepam		Perro/Gato	Crisis convulsiva	0,5-2,0	mg/kg	IV				
Sistema Nervioso	Benzodiazepinas	Lorazepam		Gato	Crisis de pánico o de angustia	0,02-0,10	mg/kg	VO	dosis única o c12-24h		Comenzar con la dosis menor e incrementarla progresivamente.	
Sistema Nervioso	Benzodiazepinas	Lorazepam		Perro	Crisis de pánico o de angustia	0,02-0,10	mg/kg	VO	dosis única o c8-24h		Al inicio de la ansiedad por separación.	
Sistema Nervioso	Benzodiazepinas	Midazolam		Perro	Dolor (combinado con opioides)	0,10-0,25	mg/kg	IM/IV				
Sistema Nervioso	Benzodiazepinas	Midazolam		Perro/Gato	Crisis convulsiva	0,2-0,5	mg/kg	IV				
Sistema Nervioso	Fenotiazinas	Acepromazina		Gato	Dolor (combinado con opioides)	0,04-0,08	mg/kg	SC/IM/IV				
Sistema Nervioso	Fenotiazinas	Acepromazina		Gato	Sedación	0,02-0,20	mg/kg	SC/IM/IV				
Sistema Nervioso	Fenotiazinas	Acepromazina		Gato	Síndrome urológico de los felinos (relajante uretral)	0,02-0,10	mg/kg	SC/IM/IV				
Sistema Nervioso	Fenotiazinas	Acepromazina		Gato	Síndrome urológico de los felinos (relajante uretral)	1-2	mg/gato	VO	c8-12h			
Sistema Nervioso	Fenotiazinas	Acepromazina		Perro	Dolor (combinado con opioides)	0,02-0,05	mg/kg	SC/IM/IV			Dosis total máxima 3 mg; en razas gigantes máximo 2 mg.	
Sistema Nervioso	Fenotiazinas	Acepromazina		Perro	Sedación	0,01-0,10	mg/kg	SC/IM/IV			Dosis total máxima 3 mg; en razas gigantes máximo 2 mg.	
Sistema Nervioso	Feromonas	Complejo análogo de feromonas felinas / fracción F3		Gato	Eliminación inadecuada felina y otros trastornos del comportamiento relacionados con ansiedad	complejo análogo de feromonas felinas o fracción F3		ambiental/tópica				
Sistema Nervioso	Feromonas	Feromona apaciguante canina		Perro	Ansiedad por separación y fobias	feromona apaciguante canina		ambiental/tópica				
Sistema Nervioso	Feromonas	Feromona de apaciguamiento felina		Gato	Reducción de conflictos entre gatos que conviven	feromona de apaciguamiento felina		ambiental				
Sistema Nervioso	Feromonas	Feromona interdigital felina		Gato	Facilita el rascado en el rascador	feromona interdigital felina		tópica				
Sistema Nervioso	Gabapentinoides	Gabapentina		Gato	Ansiedad por el transporte y la visita a la clínica veterinaria	50-100	mg/gato	VO			Dos horas antes de la visita.	
Sistema Nervioso	Gabapentinoides	Gabapentina		Gato	Previo a la anestesia	50-150	mg/gato	VO			2-3 horas antes de la visita.	
Sistema Nervioso	Gabapentinoides	Gabapentina		Perro	Previo a la anestesia	20-40	mg/kg	VO			2-3 horas antes de la visita.	
Sistema Nervioso	Inhibidores MAO-B	Selegilina		Perro	Disfunción cognitiva	0,5-1,0	mg/kg	VO	c24h		Comenzar con la menor dosis; se recomienda administrar por las mañanas.	
Sistema Nervioso	ISRSs	Fluoxetina		Gato	Trastornos del comportamiento relacionados con agresividad, ansiedad, trastornos compulsivos y eliminación inadecuada felina	0,5-1,0	mg/kg	VO	c24h			
Sistema Nervioso	ISRSs	Fluoxetina		Perro	Trastornos del comportamiento relacionados con agresividad, ansiedad, trastornos compulsivos y eliminación inadecuada felina	1-2	mg/kg	VO	c24h			
Sistema Nervioso	ISRSs	Paroxetina		Gato	Trastornos del comportamiento relacionados con agresividad, ansiedad, trastornos compulsivos y eliminación inadecuada felina	0,5-1,0	mg/kg	VO	c24h			
Sistema Nervioso	ISRSs	Paroxetina		Perro	Trastornos del comportamiento relacionados con agresividad, ansiedad, trastornos compulsivos y eliminación inadecuada felina	0,5-2,0	mg/kg	VO	c24h			
Sistema Nervioso	ISRSs	Sertralina		Gato	Trastornos del comportamiento relacionados con agresividad, ansiedad, trastornos compulsivos y eliminación inadecuada felina	0,5-1,0	mg/kg	VO	c24h			
Sistema Nervioso	ISRSs	Sertralina		Perro	Trastornos del comportamiento relacionados con agresividad, ansiedad, trastornos compulsivos y eliminación inadecuada felina	1-3	mg/kg	VO	c24h			
Sistema Nervioso	ISRSs / Otros	Trazodona		Gato	Ansiedad por el transporte y la visita a la clínica veterinaria	50	mg/gato	VO	dosis única		60-90 minutos antes de la visita.	
Sistema Nervioso	ISRSs / Otros	Trazodona		Perro	Previo a la anestesia	3,0-7,5	mg/kg	VO	dosis única		2-4 horas antes de la visita.	
Sistema Nervioso	ISRSs / Otros	Trazodona		Perro	Trastornos del comportamiento relacionados con ansiedad y fobias	2-5	mg/kg	VO	dosis única		Una hora antes del evento; ver consideraciones.	
Sistema Nervioso	Otros	Amantadina		Perro/Gato	Dolor crónico	3-5	mg/kg	VO	c12-24h			
Sistema Nervioso	Otros	Cannabidiol		Gato	Dolor asociado a enfermedad articular degenerativa	2-4	mg/kg	VO	c12h			
Sistema Nervioso	Otros	Cannabidiol		Perro	Dolor asociado a enfermedad articular degenerativa	1-2	mg/kg	VO	c12h			
Sistema Nervioso	Otros	Metamizol		Perro	Dolor posoperatorio	25-35	mg/kg	IM/IV lenta	c8-12h			
Sistema Nervioso	Otros	Metilfenidato		Perro	Narcolepsia	0,25	mg/kg	VO	c12-24h			
Sistema Nervioso	Otros	Paracetamol		Perro	Dolor	10	mg/kg	VO/IV	c8h			
Sistema Nervioso	Vasodilatadores cerebrales	Nicergolina		Perro/Gato	Disfunción cognitiva	0,25-0,50	mg/kg	VO	c24h		Se recomienda administrar por las mañanas.	
Sistema Nervioso	Vasodilatadores cerebrales	Propentofilina		Perro	Disfunción cognitiva	3-5	mg/kg	VO	c12h		Administrar una hora antes de las comidas.	
Urinario / Nefrología	Agonistas alfa-beta adrenérgicos	Efedrina		Gato	Incontinencia urinaria	2-4	mg/kg	VO	c8-12h		No administrar a pacientes con glaucoma.	
Urinario / Nefrología	Agonistas alfa-beta adrenérgicos	Efedrina		Perro	Incontinencia urinaria	1-2	mg/kg	VO	c8-12h		No administrar a pacientes con glaucoma.	
Urinario / Nefrología	Agonistas alfa-beta adrenérgicos	Fenilpropanolamina		Perro	Incontinencia urinaria	1-2	mg/kg	VO	c8-12h			
Urinario / Nefrología	Alcalinizantes urinarios	Sodio bicarbonato		Perro/Gato	Acidosis metabólica en glomerulonefritis y alcalinización del pH urinario	8-12	mg/kg	VO	c8-12h			
Urinario / Nefrología	Alcalinizantes urinarios	Sodio bicarbonato		Perro/Gato	Urolitos de urato	0,65-5,90	g/animal	VO	al día			
Urinario / Nefrología	Antiespasmódicos urinarios	Oxibutinina		Gato	Incontinencia urinaria	0,5	mg/gato	VO	c8-12h			
Urinario / Nefrología	Antiespasmódicos urinarios	Oxibutinina		Perro	Incontinencia urinaria	0,2-0,3	mg/kg	VO	c8-12h			
Órganos de los sentidos	Oftalmológicos / Agentes anticollagenasa	Acetilcisteína oftálmica		Perro/Gato	Úlcera corneal	2	gotas	Tópica ocular	c6-8h			
Órganos de los sentidos	Oftalmológicos / Agentes para diagnóstico	Fluoresceína sódica		Perro/Gato	Diagnóstico de úlceras corneales	1	gota	Tópica ocular	dosis única		Esperar 60 segundos y después lavar con suero fisiológico.	
Órganos de los sentidos	Oftalmológicos / Anestésicos locales	Anestésicos locales oftálmicos		Perro/Gato	Anestesia de corta duración para la exploración del ojo	1-3	gotas	Tópica ocular	dosis única			
Órganos de los sentidos	Oftalmológicos / Antibacterianos	Ciprofloxacino oftálmico		Perro/Gato	Infecciones del polo anterior del ojo (párpados, conjuntiva y córnea)	2	gotas / fina capa	Tópica ocular	c3-4h			
Órganos de los sentidos	Oftalmológicos / Antibacterianos	Cloranfenicol oftálmico		Perro/Gato	Infecciones del polo anterior del ojo (párpados, conjuntiva y córnea)	2	gotas / fina capa	Tópica ocular	c3-4h			
Órganos de los sentidos	Oftalmológicos / Antibacterianos	Clortetraciclina oftálmica		Perro/Gato	Infecciones del polo anterior del ojo (párpados, conjuntiva y córnea)	2	gotas / fina capa	Tópica ocular	c3-4h			
Órganos de los sentidos	Oftalmológicos / Antibacterianos	Gentamicina oftálmica		Perro/Gato	Infecciones del polo anterior del ojo (párpados, conjuntiva y córnea)	2	gotas / fina capa	Tópica ocular	c3-4h			
Órganos de los sentidos	Oftalmológicos / Antibacterianos	Oxitetraciclina oftálmica		Perro/Gato	Infecciones del polo anterior del ojo (párpados, conjuntiva y córnea)	2	gotas / fina capa	Tópica ocular	c3-4h			
Órganos de los sentidos	Oftalmológicos / Antibacterianos	Tobramicina oftálmica		Perro/Gato	Infecciones del polo anterior del ojo (párpados, conjuntiva y córnea)	2	gotas / fina capa	Tópica ocular	c3-4h			
Órganos de los sentidos	Oftalmológicos / Antibacterianos	Ácido fusídico oftálmico		Perro/Gato	Infecciones del polo anterior del ojo (párpados, conjuntiva y córnea)	2	gotas / fina capa	Tópica ocular	c3-4h			
Órganos de los sentidos	Oftalmológicos / Antiglaucoma y mióticos	Betaxolol		Perro/Gato	Glaucoma primario y secundario	2	gotas	Tópica ocular	c12h			
Órganos de los sentidos	Oftalmológicos / Antiglaucoma y mióticos	Bimatoprost		Perro/Gato	Glaucoma primario y secundario	2	gotas	Tópica ocular	c24h			
Órganos de los sentidos	Oftalmológicos / Antiglaucoma y mióticos	Brinzolamida		Perro/Gato	Glaucoma primario y secundario	2	gotas	Tópica ocular	c12h			
Órganos de los sentidos	Oftalmológicos / Antiglaucoma y mióticos	Dorzolamida		Perro/Gato	Glaucoma primario y secundario	2	gotas	Tópica ocular	c8h			
Órganos de los sentidos	Oftalmológicos / Antiglaucoma y mióticos	Latanoprost		Perro/Gato	Glaucoma primario y secundario	2	gotas	Tópica ocular	c12h			
Órganos de los sentidos	Oftalmológicos / Antiglaucoma y mióticos	Pilocarpina		Perro/Gato	Glaucoma primario y secundario	2	gotas	Tópica ocular	c6h			
Órganos de los sentidos	Oftalmológicos / Antiglaucoma y mióticos	Pilocarpina		Perro/Gato	Queratoconjuntivitis seca	2	gotas de colirio al 1%	Tópica ocular	c8h			
Órganos de los sentidos	Oftalmológicos / Antiglaucoma y mióticos	Pilocarpina		Perro/Gato	Queratoconjuntivitis seca	2-5	gotas	VO	c8h			
Órganos de los sentidos	Oftalmológicos / Antiglaucoma y mióticos	Pilocarpina		Perro/Gato	Queratoconjuntivitis seca	2-5	gotas	VO	c8h			
Órganos de los sentidos	Oftalmológicos / Antiglaucoma y mióticos	Pilocarpina		Perro/Gato	Queratoconjuntivitis seca	2-5	gotas	VO	c8h			
Órganos de los sentidos	Oftalmológicos / Antiglaucoma y mióticos	Pilocarpina		Perro/Gato	Queratoconjuntivitis seca	2-5	gotas	VO	c8h			
Órganos de los sentidos	Oftalmológicos / Antiglaucoma y mióticos	Pilocarpina		Perro/Gato	Queratoconjuntivitis seca	2-5	gotas	VO	c8h			
Órganos de los sentidos	Oftalmológicos / Antiglaucoma y mióticos	Pilocarpina		Perro/Gato	Queratoconjuntivitis seca	2-5	gotas	VO	c8h			
Órganos de los sentidos	Oftalmológicos / Antiglaucoma y mióticos	Pilocarpina		Perro/Gato	Queratoconjuntivitis seca	2-5	gotas	VO	c8h			
Órganos de los sentidos	Oftalmológicos / Antiglaucoma y mióticos	Pilocarpina		Perro/Gato	Queratoconjuntivitis seca	2-5	gotas	VO	c8h			
Órganos de los sentidos	Oftalmológicos / Antiglaucoma y mióticos	Pilocarpina		Perro/Gato	Queratoconjuntivitis seca	2-5	gotas	VO	c8h			
Órganos de los sentidos	Oftalmológicos / Antiglaucoma y mióticos	Pilocarpina		Perro/Gato	Queratoconjuntivitis seca	2-5	gotas	VO	c8h			
Órganos de los sentidos	Oftalmológicos / Antiglaucoma y mióticos	Pilocarpina		Perro/Gato	Queratoconjuntivitis seca	2-5	gotas	VO	c8h			
Órganos de los sentidos	Oftalmológicos / Antiglaucoma y mióticos	Pilocarpina		Perro/Gato	Queratoconjuntivitis seca	2-5	gotas	VO	c8h			
Órganos de los sentidos	Oftalmológicos / Antiglaucoma y mióticos	Pilocarpina		Perro/Gato	Queratoconjuntivitis seca	2-5	gotas	VO	c8h			`;

const asLocalized = (value: string) => ({ es: value, en: value });

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const parseDoseNumbers = (value: string) => {
  const matches = value.match(/\d+(?:[.,]\d+)?/g) ?? [];
  const numeric = matches
    .map((item) => Number(item.replace(',', '.')))
    .filter((item) => Number.isFinite(item));

  if (numeric.length === 0) {
    return { min: Number.NaN, max: Number.NaN, defaultValue: Number.NaN };
  }

  const min = Math.min(...numeric);
  const max = Math.max(...numeric);
  return { min, max, defaultValue: min };
};

const mapSpecies = (value: string): Species[] => {
  const normalized = normalizeText(value);
  const species: Species[] = [];

  if (normalized.includes('perro')) species.push('Dog');
  if (normalized.includes('gato')) species.push('Cat');
  if (normalized.includes('conejo')) species.push('Rabbit');
  if (normalized.includes('huron')) species.push('Ferret');
  if (normalized.includes('cobaya')) species.push('Guinea Pig');
  if (normalized.includes('chinchilla')) species.push('Chinchilla');
  if (normalized.includes('equino')) species.push('Equine');
  if (normalized.includes('psitac')) species.push('Psittacines');
  if (normalized.includes('reptil')) species.push('Reptiles');
  if (normalized.includes('rapaz')) species.push('Raptors');
  if (normalized.includes('paseriforme')) species.push('Passerines');
  if (normalized.includes('ave de corral') || normalized.includes('avicola') || normalized.includes('pollo')) species.push('Poultry');

  return species.length > 0 ? Array.from(new Set(species)) : ['Dog', 'Cat'];
};

const dedupeRows = (rows: string[]) => Array.from(new Set(rows.map((row) => row.trim()).filter(Boolean)));

const makeEntryId = (values: string[]) =>
  values
    .join(' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const spreadsheetDoseEntries: DoseCalculatorEntry[] = dedupeRows(rawSpreadsheetDoseTable.split('\n'))
  .slice(1)
  .map((line) => line.split('\t'))
  .map(([
    category,
    subcategory,
    activeIngredient,
    antibioticCategory,
    speciesLabel,
    indication,
    doseText,
    doseUnit,
    route,
    frequency,
    duration,
    observations,
    bibliography,
  ]) => {
    const dose = parseDoseNumbers(doseText ?? '');

    return {
      id: `sheet-${makeEntryId([activeIngredient ?? '', speciesLabel ?? '', indication ?? '', route ?? '', doseText ?? '', doseUnit ?? ''])}`,
      activeIngredient: activeIngredient ?? '',
      category: asLocalized(category ?? ''),
      subcategory: asLocalized(subcategory ?? ''),
      antibioticCategory: antibioticCategory || undefined,
      species: mapSpecies(speciesLabel ?? ''),
      speciesLabel: speciesLabel ?? '',
      route: route ?? '',
      indication: asLocalized(indication ?? ''),
      doseRangeMgKg: { min: dose.min, max: dose.max },
      defaultDoseMgKg: dose.defaultValue,
      doseText: doseText ?? '',
      doseUnit: doseUnit ?? '',
      frequency: frequency || undefined,
      duration: duration || undefined,
      observations: observations || undefined,
      bibliography: bibliography || undefined,
      concentration: { es: '', en: '' },
    };
  });
