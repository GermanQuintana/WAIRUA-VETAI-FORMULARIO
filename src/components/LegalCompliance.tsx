import { useEffect, useMemo, useState } from 'react';
import { Language } from '../i18n';

type LegalTopic = 'legal' | 'privacy' | 'terms' | 'cookies';

interface Props {
  lang: Language;
  contactEmail: string;
  compact?: boolean;
}

const COOKIE_NOTICE_KEY = 'wairua.cookie-notice';

const copy = {
  es: {
    legal: 'Aviso legal',
    privacy: 'Privacidad',
    terms: 'Condiciones',
    cookies: 'Cookies',
    contact: 'Contacto',
    close: 'Cerrar',
    acceptCookies: 'Aceptar y continuar',
    cookieBannerTitle: 'Cookies necesarias',
    cookieBannerText:
      'WAIRUA utiliza cookies técnicas y almacenamiento local necesarios para iniciar sesión, conservar tus preferencias y prestar el servicio.',
    legalTitle: 'Aviso legal',
    privacyTitle: 'Política de privacidad',
    termsTitle: 'Condiciones de uso',
    cookiesTitle: 'Política de cookies',
    legalItems: [
      'Titular del servicio: Wairua Veterinary Precision Medicine, S.L.U. (Sociedad Limitada Unipersonal), con NIF B25948050.',
      'Domicilio social: Avenida da Mariña 63, 2.º A, 27880 Burela, Lugo, España.',
      'Email de contacto y soporte: {email}.',
      'WAIRUA VetAI es una herramienta profesional de consulta veterinaria. La información se ofrece como apoyo técnico y no sustituye el criterio clínico, la ficha técnica oficial ni la normativa aplicable.',
      'El acceso puede requerir registro, validación de cuenta, suscripción o autorización por clínica.',
      'Los contenidos, estructura, marcas, textos, imágenes y desarrollos propios de la plataforma quedan protegidos por la normativa de propiedad intelectual e industrial.',
    ],
    privacyItems: [
      'Responsable del tratamiento: Wairua Veterinary Precision Medicine, S.L.U., NIF B25948050. Contacto de privacidad: {email}.',
      'Tratamos los datos que introduces para crear y gestionar tu cuenta, darte acceso a la plataforma, atender incidencias y administrar suscripciones o permisos profesionales.',
      'Datos tratados: email, nombre, datos profesionales opcionales, roles de acceso, información de suscripción, incidencias enviadas y datos técnicos necesarios para seguridad y funcionamiento.',
      'Base jurídica: ejecución del servicio solicitado, consentimiento cuando corresponda, cumplimiento de obligaciones legales e interés legítimo en seguridad, soporte y mejora de la plataforma.',
      'Servicios externos: Supabase para autenticación/base de datos, Google para login si eliges esa opción, Stripe para pagos y Vercel para alojamiento y despliegue.',
      'Puedes solicitar acceso, rectificación, supresión, oposición, limitación o portabilidad escribiendo a {email}.',
    ],
    termsItems: [
      'El usuario debe usar la plataforma de forma profesional, lícita y compatible con la práctica veterinaria responsable.',
      'Las dosis, fichas, calculadoras y enlaces oficiales deben verificarse siempre con ficha técnica, situación clínica, especie, comorbilidades y criterio del veterinario responsable.',
      'Está prohibido compartir credenciales, eludir controles de acceso o copiar masivamente contenidos sin autorización.',
      'La disponibilidad puede verse afectada por mantenimiento, incidencias técnicas, servicios externos o cambios normativos.',
      'WAIRUA puede modificar módulos, precios, condiciones de acceso o funcionalidades para mejorar el servicio o adaptarse a requisitos legales.',
    ],
    cookieItems: [
      'WAIRUA utiliza únicamente cookies técnicas y almacenamiento local necesarios para prestar el servicio solicitado. No se utilizan actualmente cookies analíticas, publicitarias ni de seguimiento.',
      'El almacenamiento local recuerda el idioma, el tema, la sesión de Supabase, las preferencias de acceso y datos temporales necesarios para invitaciones o herramientas clínicas.',
      'Los servicios de autenticación pueden utilizar almacenamiento técnico para mantener la sesión o completar el inicio de sesión que solicites.',
      'El servicio de pago puede utilizar almacenamiento técnico propio cuando solicitas acceder al checkout o al portal de facturación.',
      'Puedes eliminar estos datos desde la configuración del navegador. Al hacerlo, es posible que se cierre la sesión o se pierdan preferencias guardadas.',
    ],
  },
  en: {
    legal: 'Legal notice',
    privacy: 'Privacy',
    terms: 'Terms',
    cookies: 'Cookies',
    contact: 'Contact',
    close: 'Close',
    acceptCookies: 'Accept and continue',
    cookieBannerTitle: 'Necessary cookies',
    cookieBannerText:
      'WAIRUA uses technical cookies and local storage required to sign in, retain your preferences, and provide the service.',
    legalTitle: 'Legal notice',
    privacyTitle: 'Privacy policy',
    termsTitle: 'Terms of use',
    cookiesTitle: 'Cookie policy',
    legalItems: [
      'Service owner: Wairua Veterinary Precision Medicine, S.L.U. (a single-member limited company), Spanish tax ID B25948050.',
      'Registered office: Avenida da Mariña 63, 2nd A, 27880 Burela, Lugo, Spain.',
      'Contact and support email: {email}.',
      'WAIRUA VetAI is a professional veterinary reference tool. Its information supports technical work and does not replace clinical judgement, official product information, or applicable regulations.',
      'Access may require registration, account validation, subscription, or clinic authorization.',
      'The platform content, structure, marks, texts, images, and proprietary development are protected by intellectual and industrial property rules.',
    ],
    privacyItems: [
      'Data controller: Wairua Veterinary Precision Medicine, S.L.U., Spanish tax ID B25948050. Privacy contact: {email}.',
      'We process the data you enter to create and manage your account, provide platform access, handle issues, and manage subscriptions or professional permissions.',
      'Processed data: email, name, optional professional profile data, access roles, subscription information, support issues, and technical data required for security and operation.',
      'Legal basis: performance of the requested service, consent where applicable, compliance with legal obligations, and legitimate interest in security, support, and platform improvement.',
      'External services: Supabase for authentication/database, Google for login if you choose it, Stripe for payments, and Vercel for hosting and deployment.',
      'You can request access, rectification, erasure, objection, restriction, or portability by writing to {email}.',
    ],
    termsItems: [
      'Users must use the platform professionally, lawfully, and in line with responsible veterinary practice.',
      'Doses, records, calculators, and official links must always be checked against product information, clinical context, species, comorbidities, and the responsible veterinarian’s judgement.',
      'Sharing credentials, bypassing access controls, or massively copying content without authorization is forbidden.',
      'Availability may be affected by maintenance, technical incidents, external services, or regulatory changes.',
      'WAIRUA may change modules, prices, access conditions, or features to improve the service or comply with legal requirements.',
    ],
    cookieItems: [
      'WAIRUA only uses technical cookies and local storage required to provide the requested service. No analytics, advertising, or tracking cookies are currently used.',
      'Local storage remembers language, theme, the Supabase session, access preferences, and temporary data required for invitations or clinical tools.',
      'Authentication services may use technical storage to maintain the session or complete a sign-in flow you request.',
      'The payment service may use its own technical storage when you request access to checkout or the billing portal.',
      'You can delete this data in your browser settings. Doing so may sign you out or remove saved preferences.',
    ],
  },
} as const;

const getItems = (topic: LegalTopic, t: (typeof copy)['es'] | (typeof copy)['en']) => {
  switch (topic) {
    case 'privacy':
      return t.privacyItems;
    case 'terms':
      return t.termsItems;
    case 'cookies':
      return t.cookieItems;
    default:
      return t.legalItems;
  }
};

const getTitle = (topic: LegalTopic, t: (typeof copy)['es'] | (typeof copy)['en']) => {
  switch (topic) {
    case 'privacy':
      return t.privacyTitle;
    case 'terms':
      return t.termsTitle;
    case 'cookies':
      return t.cookiesTitle;
    default:
      return t.legalTitle;
  }
};

export default function LegalCompliance({ lang, contactEmail, compact = false }: Props) {
  const t = copy[lang];
  const [activeTopic, setActiveTopic] = useState<LegalTopic | null>(null);
  const [cookieNoticeAccepted, setCookieNoticeAccepted] = useState(() =>
    typeof window === 'undefined' ? true : window.localStorage.getItem(COOKIE_NOTICE_KEY) === 'accepted',
  );

  useEffect(() => {
    if (!activeTopic) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveTopic(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeTopic]);

  const activeItems = useMemo(() => (activeTopic ? getItems(activeTopic, t) : []), [activeTopic, t]);

  const acceptCookieNotice = () => {
    window.localStorage.setItem(COOKIE_NOTICE_KEY, 'accepted');
    setCookieNoticeAccepted(true);
  };

  return (
    <>
      <section className={`legal-footer ${compact ? 'legal-footer-compact' : ''}`} aria-label={lang === 'es' ? 'Información legal' : 'Legal information'}>
        <a href={`mailto:${contactEmail}`}>{t.contact}</a>
        <button type="button" onClick={() => setActiveTopic('legal')}>
          {t.legal}
        </button>
        <button type="button" onClick={() => setActiveTopic('privacy')}>
          {t.privacy}
        </button>
        <button type="button" onClick={() => setActiveTopic('terms')}>
          {t.terms}
        </button>
        <button type="button" onClick={() => setActiveTopic('cookies')}>
          {t.cookies}
        </button>
      </section>

      {!cookieNoticeAccepted ? (
        <aside className="cookie-consent cookie-notice" role="region" aria-label={t.cookieBannerTitle}>
          <div>
            <strong>{t.cookieBannerTitle}</strong>
            <p>{t.cookieBannerText}</p>
          </div>
          <div className="cookie-consent-actions">
            <button type="button" className="theme-button" onClick={acceptCookieNotice}>
              {t.acceptCookies}
            </button>
          </div>
        </aside>
      ) : null}

      {activeTopic ? (
        <div className="legal-modal" role="dialog" aria-modal="true" aria-label={getTitle(activeTopic, t)}>
          <button type="button" className="legal-modal-backdrop" aria-label={t.close} onClick={() => setActiveTopic(null)} />
          <article className="legal-modal-panel">
            <header>
              <span className="section-kicker">WAIRUA VetAI</span>
              <h2>{getTitle(activeTopic, t)}</h2>
              <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
            </header>
            <ul>
              {activeItems.map((item) => (
                <li key={item}>{item.replace('{email}', contactEmail)}</li>
              ))}
            </ul>
            <button type="button" className="secondary-button legal-modal-close" onClick={() => setActiveTopic(null)}>
              {t.close}
            </button>
          </article>
        </div>
      ) : null}
    </>
  );
}
