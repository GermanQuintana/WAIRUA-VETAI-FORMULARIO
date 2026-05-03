import { useEffect, useMemo, useState } from 'react';
import { Language } from '../i18n';
import {
  AccessPreviewMode,
  AdminDirectoryProfile,
  AccountType,
  AuthAccountSnapshot,
  BillingCycle,
  DiscountCodeRecord,
  MembershipSelection,
  MembershipPlanId,
  PartnerCategory,
  ReportVisibilityField,
  SupportIssue,
  UserProfile,
  UserRole,
} from '../types';
import { SupabaseAccessService } from '../services/supabase';
import wairuaLoginArt from '../assets/wairua-vetai-login-art.jpeg';

interface Props {
  lang: Language;
  service: SupabaseAccessService | null;
  account: AuthAccountSnapshot | null;
  onRefreshAccount: () => Promise<void>;
  layout?: 'compact' | 'screen';
  accessPreviewMode?: AccessPreviewMode;
  onChangeAccessPreviewMode?: (mode: AccessPreviewMode) => void;
  onClose?: () => void;
  supportEmail?: string;
}

type AuthMode = 'sign_in' | 'sign_up';
type AccountSection = 'summary' | 'profile' | 'admin';
type AdminTool = 'preview' | 'users' | 'issues';

type PlanDefinition = {
  id: MembershipPlanId;
  accountType: AccountType;
  billingCycle: BillingCycle;
  listPriceCents: number;
  perSeatPriceCents?: number;
  title: { es: string; en: string };
  priceLabel: { es: string; en: string };
  note: { es: string; en: string };
};

const planDefinitions: PlanDefinition[] = [
  {
    id: 'individual_monthly',
    accountType: 'premium',
    billingCycle: 'monthly',
    listPriceCents: 1800,
    title: { es: 'Usuario individual', en: 'Individual user' },
    priceLabel: { es: '18 €/mes', en: 'EUR 18/month' },
    note: { es: 'Acceso premium para un veterinario.', en: 'Premium access for one veterinarian.' },
  },
  {
    id: 'clinic_monthly',
    accountType: 'company',
    billingCycle: 'monthly',
    listPriceCents: 3900,
    perSeatPriceCents: 700,
    title: { es: 'Clínica', en: 'Clinic' },
    priceLabel: { es: '39 €/mes + 7 €/vet/mes', en: 'EUR 39/month + EUR 7/vet/month' },
    note: { es: 'Cuenta de clínica con veterinarios vinculados.', en: 'Clinic account with linked veterinarians.' },
  },
];

const roleLabels = {
  es: {
    viewer: 'Lector',
    contributor: 'Colaborador',
    editor: 'Editor',
    reviewer: 'Revisor',
    admin: 'Administrador',
  },
  en: {
    viewer: 'Viewer',
    contributor: 'Contributor',
    editor: 'Editor',
    reviewer: 'Reviewer',
    admin: 'Admin',
  },
} as const;

const copy = {
  es: {
    open: 'Acceder / registrarse',
    close: 'Cerrar',
    unavailable: 'Modo demo publicado. El login y las membresias se activaran cuando conectemos Supabase en el despliegue.',
    unavailableHint:
      'Si quieres probar el acceso real, configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Vercel y autoriza la URL del despliegue en Supabase Auth.',
    signIn: 'Iniciar sesión',
    signUp: 'Crear cuenta',
    withGoogle: 'Continuar con Google',
    fullName: 'Nombre completo',
    email: 'Email',
    password: 'Contraseña',
    trialBadge: '10 días gratis con acceso completo',
    planTitle: 'Plan tras la prueba',
    individualPlansTitle: 'Plan individual',
    companyPlansTitle: 'Plan clínica',
    companyPlansHint: 'La clínica mantiene una cuota base y añade los veterinarios que necesite vincular.',
    monthly: 'Mensual',
    annual: 'Anual',
    monthlyPrice: '18 €/mes',
    annualPrice: '18 €/mes',
    seatsIncluded: 'Veterinarios',
    clinicVetCount: 'Veterinarios vinculados',
    clinicVetCountHint: 'La cuota se calcula como 39 €/mes de clínica + 7 €/veterinario/mes.',
    planSelected: 'Plan seleccionado',
    partnerCode: 'Código descuento',
    partnerCodePlaceholder: 'Ej: CODIGO-DEMO',
    applyCode: 'Aplicar código',
    partnerCodeHint: 'Los códigos de descuento se aplican al plan seleccionado cuando sean compatibles.',
    activeCode: 'Código activo',
    codeApplied: 'Código aplicado correctamente.',
    codeMissing: 'Ese código no existe o no está activo.',
    codeAlreadyUsed: 'Ya has usado este código anteriormente.',
    codeMonthlyOnly: 'El código existe, pero solo aplica al plan mensual.',
    trialInfo: 'Primero entras a la web app. Durante la prueba tienes acceso completo y después mantienes la parte gratuita si no activas premium.',
    signInHelp: 'Accede con Google o con tu email y contraseña para entrar en la plataforma.',
    signUpHelp: 'Crea tu cuenta, deja guardado tu plan preferido y activa la prueba gratuita completa.',
    signUpGoogle: 'Crear cuenta con Google',
    createAccount: 'Crear cuenta y activar prueba',
    createLinkedAccount: 'Crear cuenta vinculada',
    accessAccount: 'Entrar en la cuenta',
    forgotPassword: 'He olvidado mi contraseña',
    passwordResetSent: 'Te hemos enviado un email para crear una contraseña nueva. Revisa también spam o promociones.',
    passwordResetNeedsEmail: 'Escribe tu email y pulsa de nuevo para enviarte la recuperación.',
    newPassword: 'Nueva contraseña',
    updatePassword: 'Actualizar contraseña',
    passwordUpdated: 'Contraseña actualizada correctamente.',
    passwordMinLength: 'La contraseña debe tener al menos 6 caracteres.',
    accessHelp: '¿No puedes entrar?',
    contactSupport: 'Escríbenos a soporte',
    clinicInviteCode: 'Código de clínica',
    clinicInvitePlaceholder: 'Ej: CLINICA-ABCD12',
    clinicInviteHint: 'Si tu clínica te ha dado un código, úsalo para vincular tu alta a esa cuenta sin contratar un plan individual.',
    clinicLinkedSignup: 'El alta quedará vinculada a la clínica indicada por el código.',
    emailConfirmation:
      'Cuenta creada. Si Supabase exige confirmación de email, revisa tu correo y después inicia sesión.',
    genericError: 'No se pudo completar la operación.',
    clinicCodeNotFound: 'El código de clínica no existe o ya no está activo. Revisa el código o pide a la clínica que autorice tu email.',
    clinicSeatLimitReached: 'La clínica ya no tiene plazas libres. Pide al administrador que amplíe o libere una plaza.',
    account: 'Cuenta',
    selectedPlan: 'Plan elegido',
    accountType: 'Cuenta',
    accessKey: 'Clave WAIRUA',
    accessKeyHint: 'Usa esta clave solo en herramientas WAIRUA compatibles. También podrás entrar con tu misma cuenta de Google o email.',
    rolesLabel: 'Roles',
    accessModelLabel: 'Modelo de acceso',
    partnerCategoryLabel: 'Categoria partner',
    freeAccount: 'Gratuita',
    premiumAccount: 'Premium',
    companyAccount: 'Empresa',
    partnerAccount: 'Partner',
    status: 'Estado',
    trialUntil: 'Prueba hasta',
    updatePlan: 'Guardar plan',
    savedPlan: 'Plan guardado en Supabase.',
    signOut: 'Cerrar sesión',
    signedAs: 'Sesión iniciada como',
    noPlan: 'Todavía no hay plan guardado.',
    trialPending: 'Pendiente de activar',
    trialing: 'Prueba gratuita',
    pending_payment: 'Pendiente de pago',
    active: 'Premium activa',
    expired: 'Prueba expirada',
    cancelled: 'Cancelada',
    thenLabel: 'Después quedará en',
    codeDiscountSummary: 'Descuento aplicado',
    codeDuration: 'durante',
    months: 'meses',
    updateHint: 'Puedes cambiar el plan o aplicar un código partner. La parte premium se ajustará con ese estado.',
    trialStartHint: 'Activa ahora la prueba gratuita. Más tarde podrás cambiar el plan definitivo.',
    activateTrial: 'Activar prueba gratuita',
    savePreference: 'Guardar preferencias',
    stripeCheckout: 'Ir a Stripe Checkout',
    stripePortal: 'Gestionar suscripción y facturas',
    billingTitle: 'Cobro premium',
    stripeHelp: 'Stripe cobrará el plan mensual o anual y generará facturas automáticamente.',
    stripePortalHelp: 'Desde el portal podrás descargar facturas, actualizar la tarjeta y cancelar si lo necesitas.',
    redirectingStripe: 'Redirigiendo a Stripe...',
    stripeStatus: 'Estado de Stripe',
    nextRenewal: 'Próxima renovación',
    customerBilling: 'Facturación del cliente',
    premiumOn: 'Premium activa',
    premiumPending: 'Pendiente de completar el pago',
    premiumEnded: 'Premium cancelada o caducada',
    renewalHelp: 'Si el plan sigue activo, Stripe renovará automáticamente en esa fecha.',
    portalCta: 'Abrir portal de Stripe',
    welcomeBack: 'Bienvenido',
    accessHeading: 'Entra primero y después accede a la web app',
    accessBody: 'Acceso profesional a WAIRUA VetAI.',
    visualNote: 'Toolkit clínico, consulta prescriptiva y conocimiento veterinario colaborativo en un solo entorno.',
    freeZone: 'Zona gratuita',
    premiumZone: 'Zona premium',
    freeFeatureOne: 'Medicaciones veterinarias oficiales',
    freeFeatureTwo: 'Catálogo OTC y consultas básicas',
    premiumFeatureOne: 'Base colaborativa y fichas avanzadas',
    premiumFeatureTwo: 'Toolkit clínico y calculadoras completas',
    noAccountQuestion: '¿Todavía no tienes cuenta?',
    createNow: 'Crear cuenta',
    alreadyHaveAccount: '¿Ya tienes cuenta?',
    signInNow: 'Inicia sesión',
    showPassword: 'Mostrar',
    hidePassword: 'Ocultar',
    compactTitle: 'Mi acceso',
    compactSubtitle: 'Plan, acceso y permisos de edición.',
    trialWarning: 'Tiempo restante de prueba',
    autoRenewOn: 'Renovación automática',
    autoRenewOff: 'No se renovará automáticamente',
    managePlanHint: 'Aquí puedes ampliar, renovar, cambiar de plan o darte de baja.',
    adminTitle: 'Administración de editores',
    adminSubtitle: 'Autoriza quién puede editar la base colaborativa.',
    adminRefresh: 'Recargar usuarios',
    adminRole: 'Roles',
    adminAccountType: 'Tipo de cuenta',
    adminPartnerCategory: 'Categoria partner',
    adminSubscriptionPlan: 'Plan',
    adminSubscriptionEnds: 'Fin / renovacion',
    adminDiscountCodeUsed: 'Codigo usado',
    adminNoDiscountCode: 'Sin codigo',
    adminSaveRole: 'Guardar roles',
    adminLoading: 'Cargando usuarios...',
    adminEmpty: 'No se han encontrado perfiles.',
    adminRoleSaved: 'Roles actualizados correctamente.',
    adminRoleHint: 'Puedes marcar varios roles para el mismo usuario.',
    adminToolsTitle: 'Herramientas de administración',
    adminToolsSubtitle: 'Abre solo el bloque que quieras revisar para mantener el panel limpio.',
    adminToolPreview: 'Vista previa',
    adminToolUsers: 'Usuarios',
    adminToolIssues: 'Incidencias',
    supportIssuesTitle: 'Incidencias recibidas',
    supportIssuesSubtitle: 'Revisa mensajes enviados desde el formulario interno de la app.',
    supportIssuesRefresh: 'Recargar incidencias',
    supportIssuesLoading: 'Cargando incidencias...',
    supportIssuesEmpty: 'No hay incidencias.',
    supportIssuesFilteredEmpty: 'No hay incidencias con estos filtros.',
    supportIssuesFilters: 'Ver estados',
    supportIssuesSetupMissing:
      'La bandeja de incidencias esta preparada, pero falta aplicar la migracion de Supabase para crear la tabla.',
    supportIssueStatusOpen: 'Abierta',
    supportIssueStatusInProgress: 'En curso',
    supportIssueStatusResolved: 'Resuelta',
    supportIssueStatusClosed: 'Cerrada',
    supportIssueType: 'Tipo',
    supportIssueModule: 'Módulo',
    supportIssueSender: 'Remitente',
    supportIssueDate: 'Fecha',
    supportIssueUrl: 'URL',
    supportIssueStatusSaved: 'Estado de incidencia actualizado.',
    previewTitle: 'Vista previa de acceso',
    previewSubtitle: 'Comprueba qué vería cada perfil sin salir de tu cuenta de administrador.',
    previewLabel: 'Perfil simulado',
    previewActual: 'Cuenta real',
    previewFreeViewer: 'Usuario gratuito',
    previewPremiumViewer: 'Lector premium',
    previewContributor: 'Contributor premium',
    previewEditor: 'Editor premium',
    previewReviewer: 'Reviewer premium',
    sectionSummary: 'Resumen',
    sectionProfile: 'Perfil profesional',
    sectionAdmin: 'Administración',
    profileTitle: 'Perfil profesional opcional',
    profileSubtitle:
      'Estos datos no son obligatorios. Sirven para reutilizarlos más adelante en documentos, informes o plantillas profesionales.',
    profileSave: 'Guardar perfil',
    profileSaved: 'Perfil actualizado correctamente.',
    billingManagedByStripe: 'La facturación premium ya se gestiona desde Stripe, así que aquí mantenemos el resumen y los accesos.',
    clinicAccessTitle: 'Acceso de clínica',
    clinicAccessSubtitle: 'Vincula veterinarios a esta cuenta por email autorizado o con un código de inscripción.',
    clinicInviteCodeLabel: 'Código para el equipo',
    clinicAllowedEmails: 'Emails autorizados',
    clinicAllowedEmailsHint: 'Un email por línea. También pueden registrarse con el código de clínica.',
    clinicSeats: 'Plazas vinculadas',
    clinicSave: 'Guardar acceso de clínica',
    clinicSaved: 'Acceso de clínica guardado.',
    clinicMemberTitle: 'Clínica vinculada',
    clinicMemberText: 'Tu acceso premium queda cubierto por esta clínica.',
    professionalIdentity: 'Identidad profesional',
    userData: 'Datos de usuario',
    centerData: 'Datos de centro',
    contactChannels: 'Canales de contacto',
    digitalPresence: 'Presencia digital',
    reportPreferences: 'Qué mostrar en informes',
    fullLegalName: 'Nombre y apellidos',
    nationalId: 'DNI / documento',
    licenseNumber: 'Número de colegiado',
    licenseProvince: 'Provincia del colegio',
    workplaceName: 'Centro de trabajo',
    centerFiscalName: 'Nombre fiscal del centro',
    centerTaxId: 'CIF del centro',
    centerType: 'Tipo de centro',
    centerTypeConsultorio: 'Consultorio',
    centerTypeClinic: 'Clínica',
    centerTypeHospital: 'Hospital',
    centerTypeSpecialty: 'Centro de especialidad',
    centerTypeEmergency: 'Centro de urgencias',
    centerTypeAmbulatory: 'Ambulante',
    centerTypeFreelance: 'Freelance',
    centerTypeOther: 'Otro',
    partnerScientific: 'Partner cientifico',
    partnerTraining: 'Partner formativo',
    partnerStrategic: 'Partner estrategico',
    partnerCommercial: 'Partner comercial',
    professionalEmail: 'Email profesional',
    privateEmail: 'Email privado',
    websites: 'Web o webs',
    websitesHint: 'Una URL por línea',
    instagramUrl: 'Instagram',
    tiktokUrl: 'TikTok',
    youtubeUrl: 'YouTube',
    facebookUrl: 'Facebook',
    linkedinUrl: 'LinkedIn',
    phoneMobile: 'Teléfono móvil',
    reportFullName: 'Nombre y apellidos',
    reportNationalId: 'DNI / documento',
    reportLicense: 'Colegiado y provincia',
    reportWorkplace: 'Centro de trabajo',
    reportCenterFiscalName: 'Nombre fiscal del centro',
    reportCenterTaxId: 'CIF del centro',
    reportCenterType: 'Tipo de centro',
    reportProfessionalEmail: 'Email profesional',
    reportPrivateEmail: 'Email privado',
    reportWebsites: 'Webs',
    reportSocialProfiles: 'Redes sociales',
    reportPhoneMobile: 'Teléfono móvil',
    noReportFields: 'Todavía no has marcado ningún dato para mostrar en informes.',
    adminDirectoryTitle: 'Directorio de usuarios',
    adminDirectorySubtitle: 'Despliega la lista solo cuando la necesites. Puedes buscar por cualquier dato de la ficha.',
    adminDirectoryOpen: 'Mostrar usuarios',
    adminDirectoryClose: 'Ocultar usuarios',
    adminSearchLabel: 'Buscar usuario',
    adminSearchPlaceholder: 'Nombre, email, centro, colegiado, CIF, redes...',
    adminResults: 'Resultados',
  },
  en: {
    open: 'Sign in / sign up',
    close: 'Close',
    unavailable: 'Published demo mode. Login and memberships will become available once Supabase is connected in deployment.',
    unavailableHint:
      'To enable real access here, configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel and allow the deployment URL in Supabase Auth.',
    signIn: 'Sign in',
    signUp: 'Create account',
    withGoogle: 'Continue with Google',
    fullName: 'Full name',
    email: 'Email',
    password: 'Password',
    trialBadge: '10 free days with full access',
    planTitle: 'Plan after trial',
    individualPlansTitle: 'Individual plan',
    companyPlansTitle: 'Clinic plan',
    companyPlansHint: 'The clinic keeps a base fee and adds the veterinarians it needs to link.',
    monthly: 'Monthly',
    annual: 'Annual',
    monthlyPrice: 'EUR 18/month',
    annualPrice: 'EUR 18/month',
    seatsIncluded: 'Veterinarians',
    clinicVetCount: 'Linked veterinarians',
    clinicVetCountHint: 'The fee is calculated as EUR 39/month for the clinic + EUR 7/veterinarian/month.',
    planSelected: 'Selected plan',
    partnerCode: 'Discount code',
    partnerCodePlaceholder: 'Example: DEMO-CODE',
    applyCode: 'Apply code',
    partnerCodeHint: 'Discount codes apply to the selected plan when compatible.',
    activeCode: 'Active code',
    codeApplied: 'Code applied successfully.',
    codeMissing: 'That code does not exist or is inactive.',
    codeAlreadyUsed: 'You have already used this code.',
    codeMonthlyOnly: 'The code exists, but only applies to the monthly plan.',
    trialInfo: 'You first enter the web app. During the trial all premium areas stay open, and after that the free areas remain available unless you activate premium.',
    signInHelp: 'Use Google or your email and password to enter the platform.',
    signUpHelp: 'Create your account, save your preferred plan, and start the full free trial.',
    signUpGoogle: 'Create account with Google',
    createAccount: 'Create account and start trial',
    createLinkedAccount: 'Create linked account',
    accessAccount: 'Access account',
    forgotPassword: 'I forgot my password',
    passwordResetSent: 'We sent you an email to create a new password. Check spam or promotions too.',
    passwordResetNeedsEmail: 'Enter your email and press again to send the recovery email.',
    newPassword: 'New password',
    updatePassword: 'Update password',
    passwordUpdated: 'Password updated successfully.',
    passwordMinLength: 'Password must be at least 6 characters.',
    accessHelp: 'Can’t get in?',
    contactSupport: 'Contact support',
    clinicInviteCode: 'Clinic code',
    clinicInvitePlaceholder: 'Example: CLINIC-ABCD12',
    clinicInviteHint: 'If your clinic gave you a code, use it to link your sign-up to that account without buying an individual plan.',
    clinicLinkedSignup: 'This sign-up will be linked to the clinic from the code.',
    emailConfirmation:
      'Account created. If Supabase requires email confirmation, check your inbox and then sign in.',
    genericError: 'The operation could not be completed.',
    clinicCodeNotFound: 'The clinic code does not exist or is no longer active. Check the code or ask the clinic to authorize your email.',
    clinicSeatLimitReached: 'The clinic has no seats left. Ask the administrator to add or free up a seat.',
    account: 'Account',
    selectedPlan: 'Selected plan',
    accountType: 'Account',
    accessKey: 'WAIRUA key',
    accessKeyHint: 'Use this key only in compatible WAIRUA tools. You can also sign in with the same Google or email account.',
    rolesLabel: 'Roles',
    accessModelLabel: 'Access model',
    partnerCategoryLabel: 'Partner category',
    freeAccount: 'Free',
    premiumAccount: 'Premium',
    companyAccount: 'Company',
    partnerAccount: 'Partner',
    status: 'Status',
    trialUntil: 'Trial until',
    updatePlan: 'Save plan',
    savedPlan: 'Plan saved to Supabase.',
    signOut: 'Sign out',
    signedAs: 'Signed in as',
    noPlan: 'No plan has been saved yet.',
    trialPending: 'Pending activation',
    trialing: 'Free trial',
    pending_payment: 'Pending payment',
    active: 'Premium active',
    expired: 'Expired',
    cancelled: 'Cancelled',
    thenLabel: 'Then it will switch to',
    codeDiscountSummary: 'Applied discount',
    codeDuration: 'for',
    months: 'months',
    updateHint: 'You can change the plan or apply a partner code. Premium access will follow this state.',
    trialStartHint: 'Start the free trial now. You can change the final plan later.',
    activateTrial: 'Start free trial',
    savePreference: 'Save preferences',
    stripeCheckout: 'Go to Stripe Checkout',
    stripePortal: 'Manage subscription and invoices',
    billingTitle: 'Premium billing',
    stripeHelp: 'Stripe will charge the monthly or annual plan and generate invoices automatically.',
    stripePortalHelp: 'From the portal you can download invoices, update the card, and cancel if needed.',
    redirectingStripe: 'Redirecting to Stripe...',
    stripeStatus: 'Stripe status',
    nextRenewal: 'Next renewal',
    customerBilling: 'Customer billing',
    premiumOn: 'Premium active',
    premiumPending: 'Payment pending',
    premiumEnded: 'Premium cancelled or expired',
    renewalHelp: 'If the plan remains active, Stripe will renew automatically on that date.',
    portalCta: 'Open Stripe portal',
    welcomeBack: 'Welcome',
    accessHeading: 'Sign in first, then enter the web app',
    accessBody: 'Professional access to WAIRUA VetAI.',
    visualNote: 'Clinical toolkit, prescribing guidance, and collaborative veterinary knowledge in one place.',
    freeZone: 'Free area',
    premiumZone: 'Premium area',
    freeFeatureOne: 'Official veterinary medication search',
    freeFeatureTwo: 'OTC catalog and essential lookups',
    premiumFeatureOne: 'Collaborative knowledge base and advanced records',
    premiumFeatureTwo: 'Clinical toolkit and full calculators',
    noAccountQuestion: `Don't have an account yet?`,
    createNow: 'Create one',
    alreadyHaveAccount: 'Already have an account?',
    signInNow: 'Sign in',
    showPassword: 'Show',
    hidePassword: 'Hide',
    compactTitle: 'My access',
    compactSubtitle: 'Plan, access, and editing permissions.',
    trialWarning: 'Remaining trial time',
    autoRenewOn: 'Auto-renew is on',
    autoRenewOff: 'Will not auto-renew',
    managePlanHint: 'You can upgrade, renew, change plan, or cancel here.',
    adminTitle: 'Editor administration',
    adminSubtitle: 'Authorize who can edit the collaborative knowledge base.',
    adminRefresh: 'Reload users',
    adminRole: 'Roles',
    adminAccountType: 'Account type',
    adminPartnerCategory: 'Partner category',
    adminSubscriptionPlan: 'Plan',
    adminSubscriptionEnds: 'End / renewal',
    adminDiscountCodeUsed: 'Code used',
    adminNoDiscountCode: 'No code',
    adminSaveRole: 'Save roles',
    adminLoading: 'Loading users...',
    adminEmpty: 'No profiles found.',
    adminRoleSaved: 'Roles updated successfully.',
    adminRoleHint: 'You can assign multiple roles to the same user.',
    adminToolsTitle: 'Administration tools',
    adminToolsSubtitle: 'Open only the block you want to review to keep the panel tidy.',
    adminToolPreview: 'Preview',
    adminToolUsers: 'Users',
    adminToolIssues: 'Issues',
    supportIssuesTitle: 'Received issues',
    supportIssuesSubtitle: 'Review messages sent from the internal app form.',
    supportIssuesRefresh: 'Reload issues',
    supportIssuesLoading: 'Loading issues...',
    supportIssuesEmpty: 'No issues.',
    supportIssuesFilteredEmpty: 'No issues with these filters.',
    supportIssuesFilters: 'Show statuses',
    supportIssuesSetupMissing:
      'The issue inbox is ready, but the Supabase migration still needs to be applied to create the table.',
    supportIssueStatusOpen: 'Open',
    supportIssueStatusInProgress: 'In progress',
    supportIssueStatusResolved: 'Resolved',
    supportIssueStatusClosed: 'Closed',
    supportIssueType: 'Type',
    supportIssueModule: 'Module',
    supportIssueSender: 'Sender',
    supportIssueDate: 'Date',
    supportIssueUrl: 'URL',
    supportIssueStatusSaved: 'Issue status updated.',
    previewTitle: 'Access preview',
    previewSubtitle: 'Check what each profile would see without leaving your administrator account.',
    previewLabel: 'Simulated profile',
    previewActual: 'Actual account',
    previewFreeViewer: 'Free user',
    previewPremiumViewer: 'Premium viewer',
    previewContributor: 'Premium contributor',
    previewEditor: 'Premium editor',
    previewReviewer: 'Premium reviewer',
    sectionSummary: 'Summary',
    sectionProfile: 'Professional profile',
    sectionAdmin: 'Administration',
    profileTitle: 'Optional professional profile',
    profileSubtitle:
      'These details are optional. They are meant to be reused later in documents, reports, or professional templates.',
    profileSave: 'Save profile',
    profileSaved: 'Profile updated successfully.',
    billingManagedByStripe: 'Premium billing is already handled in Stripe, so this area keeps the summary and access controls.',
    clinicAccessTitle: 'Clinic access',
    clinicAccessSubtitle: 'Link veterinarians to this account by authorized email or with a sign-up code.',
    clinicInviteCodeLabel: 'Team code',
    clinicAllowedEmails: 'Authorized emails',
    clinicAllowedEmailsHint: 'One email per line. They can also sign up with the clinic code.',
    clinicSeats: 'Linked seats',
    clinicSave: 'Save clinic access',
    clinicSaved: 'Clinic access saved.',
    clinicMemberTitle: 'Linked clinic',
    clinicMemberText: 'Your premium access is covered by this clinic.',
    professionalIdentity: 'Professional identity',
    userData: 'User data',
    centerData: 'Center data',
    contactChannels: 'Contact channels',
    digitalPresence: 'Digital presence',
    reportPreferences: 'What to show in reports',
    fullLegalName: 'Full name',
    nationalId: 'ID / document',
    licenseNumber: 'License number',
    licenseProvince: 'License province',
    workplaceName: 'Workplace',
    centerFiscalName: 'Center fiscal name',
    centerTaxId: 'Center tax ID',
    centerType: 'Center type',
    centerTypeConsultorio: 'Consulting room',
    centerTypeClinic: 'Clinic',
    centerTypeHospital: 'Hospital',
    centerTypeSpecialty: 'Specialty center',
    centerTypeEmergency: 'Emergency center',
    centerTypeAmbulatory: 'Ambulatory',
    centerTypeFreelance: 'Freelance',
    centerTypeOther: 'Other',
    partnerScientific: 'Scientific partner',
    partnerTraining: 'Training partner',
    partnerStrategic: 'Strategic partner',
    partnerCommercial: 'Commercial partner',
    professionalEmail: 'Professional email',
    privateEmail: 'Private email',
    websites: 'Website(s)',
    websitesHint: 'One URL per line',
    instagramUrl: 'Instagram',
    tiktokUrl: 'TikTok',
    youtubeUrl: 'YouTube',
    facebookUrl: 'Facebook',
    linkedinUrl: 'LinkedIn',
    phoneMobile: 'Mobile phone',
    reportFullName: 'Full name',
    reportNationalId: 'ID / document',
    reportLicense: 'License and province',
    reportWorkplace: 'Workplace',
    reportCenterFiscalName: 'Center fiscal name',
    reportCenterTaxId: 'Center tax ID',
    reportCenterType: 'Center type',
    reportProfessionalEmail: 'Professional email',
    reportPrivateEmail: 'Private email',
    reportWebsites: 'Websites',
    reportSocialProfiles: 'Social profiles',
    reportPhoneMobile: 'Mobile phone',
    noReportFields: 'You have not selected any fields for reports yet.',
    adminDirectoryTitle: 'User directory',
    adminDirectorySubtitle: 'Only expand the list when you need it. You can search by any profile field.',
    adminDirectoryOpen: 'Show users',
    adminDirectoryClose: 'Hide users',
    adminSearchLabel: 'Search user',
    adminSearchPlaceholder: 'Name, email, center, license, tax ID, socials...',
    adminResults: 'Results',
  },
} as const;

const roleOptions: UserRole[] = ['viewer', 'contributor', 'editor', 'reviewer', 'admin'];
const reportFieldOptions: ReportVisibilityField[] = [
  'full_name',
  'national_id',
  'license',
  'workplace',
  'center_fiscal_name',
  'center_tax_id',
  'center_type',
  'professional_email',
  'private_email',
  'websites',
  'social_profiles',
  'phone_mobile',
];

const centerTypeOptions = [
  'consultorio',
  'clinic',
  'hospital',
  'specialty',
  'emergency',
  'ambulatory',
  'freelance',
  'other',
] as const;

const accountTypeOptions: AccountType[] = ['free', 'premium', 'company', 'partner'];
const partnerCategoryOptions: PartnerCategory[] = ['scientific', 'training', 'strategic', 'commercial'];
const supportIssueStatusOptions: SupportIssue['status'][] = ['open', 'in_progress', 'resolved', 'closed'];
const defaultPlanId: MembershipPlanId = 'individual_monthly';
const findPlanDefinition = (planId?: MembershipPlanId | null) => planDefinitions.find((plan) => plan.id === planId) ?? planDefinitions[0];

const formatPrice = (lang: Language, cents: number) =>
  new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-US', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);

const formatDate = (lang: Language, isoDate?: string) =>
  isoDate
    ? new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-US', {
        dateStyle: 'medium',
      }).format(new Date(isoDate))
    : '--';

const formatStripeStatus = (status: string | undefined, t: (typeof copy)['es'] | (typeof copy)['en']) => {
  if (status === 'active' || status === 'trialing') return t.premiumOn;
  if (status === 'pending_payment' || status === 'incomplete' || status === 'past_due') return t.premiumPending;
  if (status === 'cancelled' || status === 'expired' || status === 'canceled') return t.premiumEnded;
  return status ?? '--';
};

const formatUserRole = (lang: Language, role: UserRole) => roleLabels[lang][role];

const getAccountTypeLabel = (accountType: AccountType, t: (typeof copy)['es'] | (typeof copy)['en']) => {
  switch (accountType) {
    case 'premium':
      return t.premiumAccount;
    case 'company':
      return t.companyAccount;
    case 'partner':
      return t.partnerAccount;
    default:
      return t.freeAccount;
  }
};

const getPartnerCategoryLabel = (partnerCategory: PartnerCategory | undefined, t: (typeof copy)['es'] | (typeof copy)['en']) => {
  switch (partnerCategory) {
    case 'scientific':
      return t.partnerScientific;
    case 'training':
      return t.partnerTraining;
    case 'strategic':
      return t.partnerStrategic;
    case 'commercial':
      return t.partnerCommercial;
    default:
      return '--';
  }
};

const getPlanLabel = (planId: MembershipPlanId | undefined, lang: Language) => {
  const plan = findPlanDefinition(planId);
  return plan.title[lang];
};

const getMembershipDisplayPriceCents = (membership: AuthAccountSnapshot['membership'], fallbackPriceCents: number) => {
  if (!membership) return fallbackPriceCents;
  const hasStripeBilling = Boolean(membership.stripeCustomerId || membership.stripeSubscriptionId);

  if (!hasStripeBilling && membership.finalPriceCents === 0 && membership.listPriceCents > 0) {
    return membership.listPriceCents;
  }

  return membership.finalPriceCents ?? fallbackPriceCents;
};

const getAppReturnUrl = () => {
  const path = window.location.pathname || '/';
  return new URL(path, window.location.origin).toString();
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message;
  return fallback;
};

const getDisplayErrorMessage = (error: unknown, t: (typeof copy)['es'] | (typeof copy)['en']) => {
  const message = getErrorMessage(error, t.genericError);
  if (message === 'DISCOUNT_CODE_ALREADY_USED') return t.codeAlreadyUsed;
  if (message.includes('CLINIC_CODE_NOT_FOUND')) return t.clinicCodeNotFound;
  if (message.includes('CLINIC_SEAT_LIMIT_REACHED')) return t.clinicSeatLimitReached;
  return message;
};

const isMissingSupportIssuesTableError = (error: unknown) => {
  const message = getErrorMessage(error, '').toLowerCase();
  return message.includes('support_issues') && (message.includes('schema cache') || message.includes('does not exist'));
};

const getReportFieldLabel = (field: ReportVisibilityField, t: (typeof copy)['es'] | (typeof copy)['en']) => {
  switch (field) {
    case 'full_name':
      return t.reportFullName;
    case 'national_id':
      return t.reportNationalId;
    case 'license':
      return t.reportLicense;
    case 'workplace':
      return t.reportWorkplace;
    case 'center_fiscal_name':
      return t.reportCenterFiscalName;
    case 'center_tax_id':
      return t.reportCenterTaxId;
    case 'center_type':
      return t.reportCenterType;
    case 'professional_email':
      return t.reportProfessionalEmail;
    case 'private_email':
      return t.reportPrivateEmail;
    case 'websites':
      return t.reportWebsites;
    case 'social_profiles':
      return t.reportSocialProfiles;
    case 'phone_mobile':
      return t.reportPhoneMobile;
    default:
      return field;
  }
};

const formatWebsiteLines = (websites: string[]) => websites.join('\n');
const parseWebsiteLines = (value: string) =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

const normalizeSearchText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const getCenterTypeLabel = (value: string | undefined, t: (typeof copy)['es'] | (typeof copy)['en']) => {
  switch (value) {
    case 'consultorio':
      return t.centerTypeConsultorio;
    case 'clinic':
      return t.centerTypeClinic;
    case 'hospital':
      return t.centerTypeHospital;
    case 'specialty':
      return t.centerTypeSpecialty;
    case 'emergency':
      return t.centerTypeEmergency;
    case 'ambulatory':
      return t.centerTypeAmbulatory;
    case 'freelance':
      return t.centerTypeFreelance;
    case 'other':
      return t.centerTypeOther;
    default:
      return value ?? '';
  }
};

const getProfileSearchHaystack = (profile: UserProfile, t: (typeof copy)['es'] | (typeof copy)['en']) =>
  normalizeSearchText(
    [
      profile.fullName,
      profile.email,
      profile.accessKey,
      getAccountTypeLabel(profile.accountType, t),
      getPartnerCategoryLabel(profile.partnerCategory, t),
      profile.nationalId,
      profile.licenseNumber,
      profile.licenseProvince,
      profile.workplaceName,
      profile.centerFiscalName,
      profile.centerTaxId,
      getCenterTypeLabel(profile.centerType, t),
      profile.professionalEmail,
      profile.privateEmail,
      profile.phoneMobile,
      profile.instagramUrl,
      profile.tiktokUrl,
      profile.youtubeUrl,
      profile.facebookUrl,
      profile.linkedinUrl,
      ...profile.websites,
      ...profile.roles,
    ]
      .filter(Boolean)
      .join(' '),
  );

const getProfileDisplayName = (profile: UserProfile) => profile.fullName?.trim() || profile.email?.trim() || profile.id;

const getSupportIssueStatusLabel = (status: SupportIssue['status'], t: (typeof copy)['es'] | (typeof copy)['en']) => {
  switch (status) {
    case 'in_progress':
      return t.supportIssueStatusInProgress;
    case 'resolved':
      return t.supportIssueStatusResolved;
    case 'closed':
      return t.supportIssueStatusClosed;
    default:
      return t.supportIssueStatusOpen;
  }
};

const getMeaningfulSupportIssueUrl = (pageUrl?: string) => {
  if (!pageUrl) return null;

  try {
    const url = new URL(pageUrl);
    const hasPath = url.pathname !== '/';
    const hasSearch = Boolean(url.search);
    const hasHash = Boolean(url.hash && url.hash !== '#');
    return hasPath || hasSearch || hasHash ? url.toString() : null;
  } catch {
    return null;
  }
};

const GoogleMark = () => (
  <svg className="google-mark" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
    <path
      fill="#EA4335"
      d="M17.64 9.2045c0-.6382-.0573-1.2518-.1636-1.8409H9v3.4818h4.8436c-.2087 1.125-.8427 2.0782-1.796 2.7164v2.2582h2.9087c1.7018-1.5668 2.6837-3.8732 2.6837-6.6155Z"
    />
    <path
      fill="#4285F4"
      d="M9 18c2.43 0 4.4673-.8059 5.9564-2.1791l-2.9087-2.2582c-.8059.54-1.8368.8591-3.0477.8591-2.3468 0-4.3323-1.5859-5.0409-3.716L.9527 12.9632C2.4332 15.9032 5.475 18 9 18Z"
    />
    <path
      fill="#FBBC05"
      d="M3.9591 10.705c-.18-.54-.2823-1.1168-.2823-1.705 0-.5882.1023-1.165.2823-1.705V5.0368H.9527C.3418 6.2536 0 7.6255 0 9s.3418 2.7464.9527 3.9632L3.9591 10.705Z"
    />
    <path
      fill="#34A853"
      d="M9 3.5782c1.3214 0 2.5077.4541 3.4418 1.3459l2.5814-2.5814C13.4632.8918 11.4259 0 9 0 5.475 0 2.4332 2.0968.9527 5.0368L3.9591 7.295C4.6677 5.1641 6.6532 3.5782 9 3.5782Z"
    />
  </svg>
);

const isDiscountApplicable = (plan: PlanDefinition, discount: DiscountCodeRecord | null) =>
  Boolean(discount && (discount.appliesTo === plan.billingCycle || discount.appliesTo === 'both'));

const getPlanListPriceCents = (plan: PlanDefinition, seatCount: number) =>
  plan.listPriceCents + (plan.perSeatPriceCents ?? 0) * Math.max(1, seatCount);

const buildMembershipSelection = (planId: MembershipPlanId, discount: DiscountCodeRecord | null, seatCount = 1): MembershipSelection => {
  const plan = findPlanDefinition(planId);
  const normalizedSeatCount = plan.accountType === 'company' ? Math.max(1, Math.round(seatCount)) : 1;
  const listPriceCents = getPlanListPriceCents(plan, normalizedSeatCount);
  const applicableDiscount = isDiscountApplicable(plan, discount) ? discount : null;

  if (!applicableDiscount) {
    return {
      planId: plan.id,
      billingCycle: plan.billingCycle,
      seatCount: normalizedSeatCount,
      listPriceCents,
      finalPriceCents: listPriceCents,
    };
  }

  if (applicableDiscount.discountMode === 'override_price' && applicableDiscount.overridePriceCents !== undefined) {
    return {
      planId: plan.id,
      billingCycle: plan.billingCycle,
      seatCount: normalizedSeatCount,
      listPriceCents,
      finalPriceCents: applicableDiscount.overridePriceCents,
      discountCode: applicableDiscount.code,
      discountCodeId: applicableDiscount.id,
      discountMonths: applicableDiscount.discountMonths,
      grantDays: applicableDiscount.grantDays,
      overridePriceCents: applicableDiscount.overridePriceCents,
    };
  }

  const amount = applicableDiscount.discountAmountCents ?? 0;
  return {
    planId: plan.id,
    billingCycle: plan.billingCycle,
    seatCount: normalizedSeatCount,
    listPriceCents,
    finalPriceCents: Math.max(0, listPriceCents - amount),
    discountCode: applicableDiscount.code,
    discountCodeId: applicableDiscount.id,
    discountMonths: applicableDiscount.discountMonths,
    grantDays: applicableDiscount.grantDays,
    discountAmountCents: amount,
  };
};

export default function AuthAccessPanel({
  lang,
  service,
  account,
  onRefreshAccount,
  layout = 'compact',
  accessPreviewMode = 'actual',
  onChangeAccessPreviewMode,
  onClose,
  supportEmail = 'gerqd79@gmail.com',
}: Props) {
  const t = copy[lang];
  const [isOpen, setIsOpen] = useState(layout === 'screen');
  const [mode, setMode] = useState<AuthMode>('sign_in');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<MembershipPlanId>(defaultPlanId);
  const [selectedSeatCount, setSelectedSeatCount] = useState(1);
  const [discountInput, setDiscountInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCodeRecord | null>(null);
  const [clinicInviteCode, setClinicInviteCode] = useState('');
  const [clinicAllowedEmailLines, setClinicAllowedEmailLines] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [accountSection, setAccountSection] = useState<AccountSection>('summary');
  const [adminProfiles, setAdminProfiles] = useState<AdminDirectoryProfile[]>([]);
  const [adminRolesDraft, setAdminRolesDraft] = useState<Record<string, UserRole[]>>({});
  const [adminAccountTypeDraft, setAdminAccountTypeDraft] = useState<Record<string, AccountType>>({});
  const [adminPartnerCategoryDraft, setAdminPartnerCategoryDraft] = useState<Record<string, PartnerCategory | ''>>({});
  const [adminLoading, setAdminLoading] = useState(false);
  const [isAdminDirectoryOpen, setIsAdminDirectoryOpen] = useState(false);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [activeAdminTool, setActiveAdminTool] = useState<AdminTool>('preview');
  const [supportIssues, setSupportIssues] = useState<SupportIssue[]>([]);
  const [supportIssuesLoading, setSupportIssuesLoading] = useState(false);
  const [supportIssuesSetupMissing, setSupportIssuesSetupMissing] = useState(false);
  const [supportIssueStatusFilters, setSupportIssueStatusFilters] = useState<SupportIssue['status'][]>(['open', 'in_progress']);
  const [profileFullName, setProfileFullName] = useState('');
  const [profileNationalId, setProfileNationalId] = useState('');
  const [profileLicenseNumber, setProfileLicenseNumber] = useState('');
  const [profileLicenseProvince, setProfileLicenseProvince] = useState('');
  const [profileWorkplaceName, setProfileWorkplaceName] = useState('');
  const [profileCenterFiscalName, setProfileCenterFiscalName] = useState('');
  const [profileCenterTaxId, setProfileCenterTaxId] = useState('');
  const [profileCenterType, setProfileCenterType] = useState('');
  const [profileProfessionalEmail, setProfileProfessionalEmail] = useState('');
  const [profilePrivateEmail, setProfilePrivateEmail] = useState('');
  const [profileWebsiteLines, setProfileWebsiteLines] = useState('');
  const [profileInstagramUrl, setProfileInstagramUrl] = useState('');
  const [profileTiktokUrl, setProfileTiktokUrl] = useState('');
  const [profileYoutubeUrl, setProfileYoutubeUrl] = useState('');
  const [profileFacebookUrl, setProfileFacebookUrl] = useState('');
  const [profileLinkedinUrl, setProfileLinkedinUrl] = useState('');
  const [profilePhoneMobile, setProfilePhoneMobile] = useState('');
  const [reportVisibleFieldsDraft, setReportVisibleFieldsDraft] = useState<ReportVisibilityField[]>([]);

  const selectedPlanDefinition = useMemo(() => findPlanDefinition(selectedPlanId), [selectedPlanId]);
  const selection = useMemo(
    () => buildMembershipSelection(selectedPlanId, appliedDiscount, selectedSeatCount),
    [appliedDiscount, selectedPlanId, selectedSeatCount],
  );
  const effectiveDiscount = isDiscountApplicable(selectedPlanDefinition, appliedDiscount) ? appliedDiscount : null;
  const selectedPlanLabel = getPlanLabel(selectedPlanId, lang);
  const hasMembership = Boolean(account?.membership);
  const membership = account?.membership ?? null;
  const isScreenLayout = layout === 'screen';
  const shouldShowForm = isScreenLayout ? !account?.profile : isOpen && !account?.profile;
  const stripeStatusLabel = formatStripeStatus(membership?.stripeStatus ?? membership?.status, t);
  const isAdmin = (account?.profile?.roles ?? [account?.profile?.role ?? 'viewer']).includes('admin');
  const accountRoles = useMemo(() => {
    const rawRoles = account?.profile?.roles?.length ? account.profile.roles : [account?.profile?.role ?? 'viewer'];
    return roleOptions.filter((role) => rawRoles.includes(role));
  }, [account?.profile]);
  const effectiveAccountType = account?.profile?.accountType ?? (!hasMembership ? 'free' : 'premium');
  const clinicAccess = account?.clinicAccess ?? null;
  const accountTypeLabel = getAccountTypeLabel(effectiveAccountType, t);
  const now = Date.now();
  const trialTimeLeftMs = membership?.trialEndsAt ? new Date(membership.trialEndsAt).getTime() - now : null;
  const trialDaysLeft =
    trialTimeLeftMs != null && Number.isFinite(trialTimeLeftMs) ? Math.max(0, Math.ceil(trialTimeLeftMs / (1000 * 60 * 60 * 24))) : null;
  const previewOptions: Array<{ value: AccessPreviewMode; label: string }> = [
    { value: 'actual', label: t.previewActual },
    { value: 'free_viewer', label: t.previewFreeViewer },
    { value: 'premium_viewer', label: t.previewPremiumViewer },
    { value: 'contributor', label: t.previewContributor },
    { value: 'editor', label: t.previewEditor },
    { value: 'reviewer', label: t.previewReviewer },
  ];
  const filteredAdminProfiles = useMemo(() => {
    const locale = lang === 'es' ? 'es-ES' : 'en-US';
    const query = normalizeSearchText(adminSearchQuery.trim());

    return [...adminProfiles]
      .sort((left, right) => getProfileDisplayName(left).localeCompare(getProfileDisplayName(right), locale))
      .filter((profile) => !query || getProfileSearchHaystack(profile, t).includes(query));
  }, [adminProfiles, adminSearchQuery, lang, t]);
  const openSupportIssuesCount = supportIssues.filter((issue) => issue.status !== 'resolved' && issue.status !== 'closed').length;
  const filteredSupportIssues = useMemo(
    () => supportIssues.filter((issue) => supportIssueStatusFilters.includes(issue.status)),
    [supportIssueStatusFilters, supportIssues],
  );

  useEffect(() => {
    const profile = account?.profile;
    if (!profile) return;

    setProfileFullName(profile.fullName ?? '');
    setProfileNationalId(profile.nationalId ?? '');
    setProfileLicenseNumber(profile.licenseNumber ?? '');
    setProfileLicenseProvince(profile.licenseProvince ?? '');
    setProfileWorkplaceName(profile.workplaceName ?? '');
    setProfileCenterFiscalName(profile.centerFiscalName ?? '');
    setProfileCenterTaxId(profile.centerTaxId ?? '');
    setProfileCenterType(profile.centerType ?? '');
    setProfileProfessionalEmail(profile.professionalEmail ?? '');
    setProfilePrivateEmail(profile.privateEmail ?? '');
    setProfileWebsiteLines(formatWebsiteLines(profile.websites ?? []));
    setProfileInstagramUrl(profile.instagramUrl ?? '');
    setProfileTiktokUrl(profile.tiktokUrl ?? '');
    setProfileYoutubeUrl(profile.youtubeUrl ?? '');
    setProfileFacebookUrl(profile.facebookUrl ?? '');
    setProfileLinkedinUrl(profile.linkedinUrl ?? '');
    setProfilePhoneMobile(profile.phoneMobile ?? '');
    setReportVisibleFieldsDraft(profile.reportVisibleFields ?? []);
  }, [account?.profile]);

  useEffect(() => {
    if (!account?.membership?.planId) return;
    setSelectedPlanId(account.membership.planId);
    setSelectedSeatCount(account.membership.seatCount ?? 1);
  }, [account?.membership?.planId, account?.membership?.seatCount]);

  useEffect(() => {
    if (!clinicAccess || clinicAccess.role !== 'owner') return;
    setClinicAllowedEmailLines(clinicAccess.allowedEmails.join('\n'));
    setSelectedSeatCount(clinicAccess.seatLimit || 1);
  }, [clinicAccess?.clinicId, clinicAccess?.role]);

  useEffect(() => {
    if (!isAdmin && accountSection === 'admin') {
      setAccountSection('summary');
    }
  }, [accountSection, isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      setIsAdminDirectoryOpen(false);
      setAdminSearchQuery('');
      setActiveAdminTool('preview');
      setSupportIssues([]);
      setSupportIssuesSetupMissing(false);
    }
  }, [isAdmin]);

  const resetFeedback = () => {
    setMessage('');
    setError('');
  };

  useEffect(() => {
    if (!service || !isAdmin) return;

    let ignore = false;

    const loadProfiles = async () => {
      setAdminLoading(true);

      try {
        const profiles = await service.listProfiles();
        if (ignore) return;
        setAdminProfiles(profiles);
        setAdminRolesDraft(Object.fromEntries(profiles.map((profile) => [profile.id, profile.roles])));
        setAdminAccountTypeDraft(Object.fromEntries(profiles.map((profile) => [profile.id, profile.accountType])));
        setAdminPartnerCategoryDraft(Object.fromEntries(profiles.map((profile) => [profile.id, profile.partnerCategory ?? ''])));
      } catch (error) {
        if (!ignore) setError(getDisplayErrorMessage(error, t));
      } finally {
        if (!ignore) setAdminLoading(false);
      }
    };

    void loadProfiles();

    return () => {
      ignore = true;
    };
  }, [isAdmin, service, t.genericError]);

  useEffect(() => {
    if (!service || !isAdmin) return;

    let ignore = false;

    const loadSupportIssues = async () => {
      setSupportIssuesLoading(true);

      try {
        setSupportIssuesSetupMissing(false);
        const issues = await service.listSupportIssues();
        if (!ignore) setSupportIssues(issues);
      } catch (error) {
        if (ignore) return;
        if (isMissingSupportIssuesTableError(error)) {
          setSupportIssues([]);
          setSupportIssuesSetupMissing(true);
          return;
        }
        setError(getDisplayErrorMessage(error, t));
      } finally {
        if (!ignore) setSupportIssuesLoading(false);
      }
    };

    void loadSupportIssues();

    return () => {
      ignore = true;
    };
  }, [isAdmin, service, t.genericError]);

  const handleApplyDiscount = async () => {
    if (!service) return;
    resetFeedback();
    setIsBusy(true);

    try {
      const discount = await service.getDiscountCode(discountInput);
      if (!discount) {
        setAppliedDiscount(null);
        setError(t.codeMissing);
        return;
      }

      setAppliedDiscount(discount);
      setMessage(isDiscountApplicable(selectedPlanDefinition, discount) ? t.codeApplied : t.codeMonthlyOnly);
    } catch (error) {
      setError(getDisplayErrorMessage(error, t));
    } finally {
      setIsBusy(false);
    }
  };

  const handleGoogle = async () => {
    if (!service) return;
    resetFeedback();
    setIsBusy(true);

    try {
      const redirectTo = getAppReturnUrl();
      const normalizedClinicInvite = clinicInviteCode.trim().toUpperCase();
      await service.signInWithGoogle(
        redirectTo,
        mode === 'sign_up' && !normalizedClinicInvite ? selection : undefined,
        mode === 'sign_up' ? normalizedClinicInvite : undefined,
      );
    } catch (error) {
      setError(getDisplayErrorMessage(error, t));
      setIsBusy(false);
    }
  };

  const handleEmailAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!service) return;
    resetFeedback();
    setIsBusy(true);

    try {
      if (mode === 'sign_up') {
        const normalizedClinicInvite = clinicInviteCode.trim().toUpperCase();
        const result = await service.signUpWithEmail({
          email,
          password,
          fullName,
          selection: normalizedClinicInvite ? undefined : selection,
          clinicInviteCode: normalizedClinicInvite || undefined,
        });

        await onRefreshAccount();
        setMessage(result.requiresEmailConfirmation ? t.emailConfirmation : t.savedPlan);
      } else {
        await service.signInWithEmail({ email, password });
        await onRefreshAccount();
        setMessage('');
      }

      setPassword('');
      setShowPassword(false);
      setClinicInviteCode('');
      setIsOpen(false);
    } catch (error) {
      setError(getDisplayErrorMessage(error, t));
    } finally {
      setIsBusy(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!service) return;
    resetFeedback();
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError(t.passwordResetNeedsEmail);
      return;
    }

    setIsBusy(true);

    try {
      await service.sendPasswordResetEmail(normalizedEmail, getAppReturnUrl());
      setMessage(t.passwordResetSent);
    } catch (error) {
      setError(getDisplayErrorMessage(error, t));
    } finally {
      setIsBusy(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!service) return;
    resetFeedback();
    if (newPassword.length < 6) {
      setError(t.passwordMinLength);
      return;
    }

    setIsBusy(true);

    try {
      await service.updatePassword(newPassword);
      setNewPassword('');
      setMessage(t.passwordUpdated);
    } catch (error) {
      setError(getDisplayErrorMessage(error, t));
    } finally {
      setIsBusy(false);
    }
  };

  const handleSavePlan = async () => {
    if (!service) return;
    resetFeedback();
    setIsBusy(true);

    try {
      await service.saveMembershipSelection(selection);
      await onRefreshAccount();
      setMessage(t.savedPlan);
    } catch (error) {
      setError(getDisplayErrorMessage(error, t));
    } finally {
      setIsBusy(false);
    }
  };

  const handleStripeCheckout = async () => {
    if (!service) return;
    resetFeedback();
    setIsBusy(true);

    try {
      await service.saveMembershipSelection(selection);
      const url = await service.createStripeCheckoutSession(selection, getAppReturnUrl());
      setMessage(t.redirectingStripe);
      window.location.assign(url);
    } catch (error) {
      setError(getDisplayErrorMessage(error, t));
      setIsBusy(false);
    }
  };

  const handleStripePortal = async () => {
    if (!service) return;
    resetFeedback();
    setIsBusy(true);

    try {
      const url = await service.createStripeBillingPortalSession(getAppReturnUrl());
      setMessage(t.redirectingStripe);
      window.location.assign(url);
    } catch (error) {
      setError(getDisplayErrorMessage(error, t));
      setIsBusy(false);
    }
  };

  const handleSignOut = async () => {
    if (!service) return;
    resetFeedback();
    setIsBusy(true);

    try {
      await service.signOut();
      await onRefreshAccount();
      setAppliedDiscount(null);
      setDiscountInput('');
      setIsOpen(false);
    } catch (error) {
      setError(getDisplayErrorMessage(error, t));
    } finally {
      setIsBusy(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!service || !account?.profile) return;
    resetFeedback();
    setIsBusy(true);

    try {
      await service.updateCurrentProfile(account.profile.id, {
        fullName: profileFullName,
        nationalId: profileNationalId,
        licenseNumber: profileLicenseNumber,
        licenseProvince: profileLicenseProvince,
        workplaceName: profileWorkplaceName,
        centerFiscalName: profileCenterFiscalName,
        centerTaxId: profileCenterTaxId,
        centerType: profileCenterType,
        professionalEmail: profileProfessionalEmail,
        privateEmail: profilePrivateEmail,
        websites: parseWebsiteLines(profileWebsiteLines),
        instagramUrl: profileInstagramUrl,
        tiktokUrl: profileTiktokUrl,
        youtubeUrl: profileYoutubeUrl,
        facebookUrl: profileFacebookUrl,
        linkedinUrl: profileLinkedinUrl,
        phoneMobile: profilePhoneMobile,
        reportVisibleFields: reportVisibleFieldsDraft,
      });
      await onRefreshAccount();
      setMessage(t.profileSaved);
      setIsOpen(false);
      onClose?.();
    } catch (error) {
      setError(getDisplayErrorMessage(error, t));
    } finally {
      setIsBusy(false);
    }
  };

  const handleSaveClinicAccess = async () => {
    if (!service || !account?.profile) return;
    resetFeedback();
    setIsBusy(true);

    try {
      await service.saveOwnedClinicAccess({
        name: account.profile.workplaceName || account.profile.centerFiscalName || account.profile.fullName || account.email || 'Clinica',
        seatLimit: selectedSeatCount,
        allowedEmails: parseWebsiteLines(clinicAllowedEmailLines),
      });
      await onRefreshAccount();
      setMessage(t.clinicSaved);
    } catch (error) {
      setError(getDisplayErrorMessage(error, t));
    } finally {
      setIsBusy(false);
    }
  };

  const handleReloadProfiles = async () => {
    if (!service || !isAdmin) return;
    resetFeedback();
    setAdminLoading(true);

    try {
      const profiles = await service.listProfiles();
      setAdminProfiles(profiles);
      setAdminRolesDraft(Object.fromEntries(profiles.map((profile) => [profile.id, profile.roles])));
      setAdminAccountTypeDraft(Object.fromEntries(profiles.map((profile) => [profile.id, profile.accountType])));
      setAdminPartnerCategoryDraft(Object.fromEntries(profiles.map((profile) => [profile.id, profile.partnerCategory ?? ''])));
    } catch (error) {
      setError(getDisplayErrorMessage(error, t));
    } finally {
      setAdminLoading(false);
    }
  };

  const handleReloadSupportIssues = async () => {
    if (!service || !isAdmin) return;
    resetFeedback();
    setSupportIssuesLoading(true);

    try {
      setSupportIssuesSetupMissing(false);
      const issues = await service.listSupportIssues();
      setSupportIssues(issues);
    } catch (error) {
      if (isMissingSupportIssuesTableError(error)) {
        setSupportIssues([]);
        setSupportIssuesSetupMissing(true);
        return;
      }
      setError(getDisplayErrorMessage(error, t));
    } finally {
      setSupportIssuesLoading(false);
    }
  };

  const handleSupportIssueStatusChange = async (issueId: string, status: SupportIssue['status']) => {
    if (!service || !isAdmin) return;
    resetFeedback();
    setIsBusy(true);

    try {
      const updated = await service.updateSupportIssueStatus(issueId, status);
      setSupportIssues((current) => current.map((issue) => (issue.id === updated.id ? updated : issue)));
      setMessage(t.supportIssueStatusSaved);
    } catch (error) {
      setError(getDisplayErrorMessage(error, t));
    } finally {
      setIsBusy(false);
    }
  };

  const handleSaveRole = async (profileId: string) => {
    if (!service || !isAdmin) return;
    resetFeedback();
    setIsBusy(true);

    try {
      const accountType = adminAccountTypeDraft[profileId] ?? 'free';
      const updated = await service.updateUserAccessProfile(profileId, {
        roles: adminRolesDraft[profileId] ?? ['viewer'],
        accountType,
        partnerCategory: accountType === 'partner' ? (adminPartnerCategoryDraft[profileId] || undefined) : undefined,
      });
      setAdminProfiles((current) =>
        current.map((profile) => (profile.id === updated.id ? { ...profile, ...updated, membership: profile.membership ?? null } : profile)),
      );
      setMessage(t.adminRoleSaved);
      await onRefreshAccount();
    } catch (error) {
      setError(getDisplayErrorMessage(error, t));
    } finally {
      setIsBusy(false);
    }
  };

  const renderPlanSelector = () => (
    <>
      <div className="auth-plan-block">
        <span className="auth-label">{t.planTitle}</span>
        <div className="auth-plan-section">
          <span className="auth-label">{t.individualPlansTitle}</span>
          <div className="auth-plan-grid">
            {planDefinitions
              .filter((plan) => plan.accountType === 'premium')
              .map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  className={selectedPlanId === plan.id ? 'active' : ''}
                  onClick={() => setSelectedPlanId(plan.id)}
                >
                  <span>{plan.title[lang]}</span>
                  <strong>{plan.priceLabel[lang]}</strong>
                  <small>{plan.note[lang]}</small>
                </button>
              ))}
          </div>
        </div>

        <div className="auth-plan-section">
          <span className="auth-label">{t.companyPlansTitle}</span>
          <p className="auth-account-hint">{t.companyPlansHint}</p>
          <div className="auth-plan-grid auth-plan-grid-company">
            {planDefinitions
              .filter((plan) => plan.accountType === 'company')
              .map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  className={selectedPlanId === plan.id ? 'active' : ''}
                  onClick={() => setSelectedPlanId(plan.id)}
                >
                  <span>{plan.title[lang]}</span>
                  <strong>{plan.priceLabel[lang]}</strong>
                  <small>{plan.note[lang]}</small>
                </button>
              ))}
          </div>
          {selectedPlanDefinition.accountType === 'company' ? (
            <label className="auth-seat-field">
              {t.clinicVetCount}
              <input
                type="number"
                min="1"
                step="1"
                value={selectedSeatCount}
                onChange={(event) => setSelectedSeatCount(Math.max(1, Number(event.target.value) || 1))}
              />
              <span>{t.clinicVetCountHint}</span>
            </label>
          ) : null}
        </div>
      </div>

      <div className="auth-discount-row">
        <label>
          {t.partnerCode}
          <input
            type="text"
            value={discountInput}
            placeholder={t.partnerCodePlaceholder}
            onChange={(event) => setDiscountInput(event.target.value)}
          />
        </label>
        <button type="button" className="secondary-button" onClick={handleApplyDiscount} disabled={isBusy}>
          {t.applyCode}
        </button>
      </div>
      <p className="auth-account-hint">{t.partnerCodeHint}</p>

      <div className="auth-price-note">
        <span>{t.planSelected}</span>
        <strong>
          {selectedPlanLabel} · {formatPrice(lang, selection.finalPriceCents)}
        </strong>
        {effectiveDiscount ? (
          <p>
            {isScreenLayout ? t.codeDiscountSummary : t.activeCode}: {effectiveDiscount.code} ·{' '}
            {formatPrice(lang, selection.finalPriceCents)} {t.codeDuration} {effectiveDiscount.discountMonths} {t.months}
          </p>
        ) : null}
      </div>
    </>
  );

  const renderAccountSummarySection = () => (
    <>
      {membership?.status === 'trialing' || membership?.cancelAtPeriodEnd ? (
        <div className="auth-account-warning" title={t.managePlanHint}>
          <span>{membership?.status === 'trialing' ? t.trialWarning : t.status}</span>
          <strong>
            {membership?.status === 'trialing'
              ? lang === 'es'
                ? `${trialDaysLeft ?? 0} días restantes`
                : `${trialDaysLeft ?? 0} days left`
              : t.cancelled}
          </strong>
          <p>
            {membership?.status === 'trialing'
              ? `${formatDate(lang, membership?.trialEndsAt)} · ${membership?.cancelAtPeriodEnd ? t.autoRenewOff : t.autoRenewOn}`
              : t.autoRenewOff}
          </p>
        </div>
      ) : null}

      <div className="auth-membership-summary">
        <div>
          <span>{t.accessModelLabel}</span>
          <strong>{accountTypeLabel}</strong>
        </div>
        <div>
          <span>{t.accessKey}</span>
          <strong>{account?.profile?.accessKey ?? '--'}</strong>
        </div>
        <div>
          <span>{t.rolesLabel}</span>
          <strong>{accountRoles.map((role) => formatUserRole(lang, role)).join(' · ')}</strong>
        </div>
        {effectiveAccountType === 'partner' ? (
          <div>
            <span>{t.partnerCategoryLabel}</span>
            <strong>{getPartnerCategoryLabel(account?.profile?.partnerCategory, t)}</strong>
          </div>
        ) : null}
        <div>
          <span>{t.selectedPlan}</span>
          <strong>
            {hasMembership
              ? `${getPlanLabel(membership?.planId, lang)} · ${formatPrice(
                  lang,
                  getMembershipDisplayPriceCents(membership, selection.finalPriceCents),
                )}`
              : t.noPlan}
          </strong>
        </div>
        <div>
          <span>{t.status}</span>
          <strong>{hasMembership ? t[membership?.status ?? 'trialing'] : t.trialPending}</strong>
        </div>
        <div>
          <span>{t.trialUntil}</span>
          <strong>{formatDate(lang, membership?.trialEndsAt)}</strong>
        </div>
        <div>
          <span>{t.stripeStatus}</span>
          <strong>{membership?.stripeCustomerId ? stripeStatusLabel : '--'}</strong>
        </div>
        <div>
          <span>{t.nextRenewal}</span>
          <strong>{formatDate(lang, membership?.currentPeriodEnd)}</strong>
        </div>
      </div>

      <p className="auth-account-hint">{t.managePlanHint}</p>
      <p className="auth-account-hint">{t.accessKeyHint}</p>
      <p className="auth-account-hint">{t.billingManagedByStripe}</p>

      <div className="auth-password-update">
        <label>
          {t.newPassword}
          <input
            type="password"
            value={newPassword}
            minLength={6}
            autoComplete="new-password"
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </label>
        <button type="button" className="secondary-button" onClick={handleUpdatePassword} disabled={isBusy || !newPassword}>
          {t.updatePassword}
        </button>
      </div>

      {membership?.stripeCustomerId ? (
        <div className="auth-price-note">
          <span>{t.customerBilling}</span>
          <strong>{stripeStatusLabel}</strong>
          <p>{t.renewalHelp}</p>
        </div>
      ) : null}

      {renderClinicAccessSection()}

      {renderPlanSelector()}

      <div className="auth-account-actions">
        {membership?.stripeCustomerId ? (
          <button type="button" className="secondary-button" onClick={handleStripePortal} disabled={isBusy}>
            {t.portalCta}
          </button>
        ) : (
          <>
            <button type="button" className="theme-button" onClick={handleSavePlan} disabled={isBusy}>
              {hasMembership ? t.savePreference : t.activateTrial}
            </button>
            <button type="button" className="theme-button" onClick={handleStripeCheckout} disabled={isBusy}>
              {t.stripeCheckout}
            </button>
          </>
        )}
        <button type="button" className="secondary-button" onClick={handleSignOut} disabled={isBusy}>
          {t.signOut}
        </button>
      </div>

      {membership?.stripeCustomerId ? <p className="auth-account-hint">{t.stripePortalHelp}</p> : null}
    </>
  );

  const renderClinicAccessSection = () => {
    if (!clinicAccess && membership?.planId !== 'clinic_monthly' && effectiveAccountType !== 'company') return null;

    if (clinicAccess?.role === 'member') {
      return (
        <section className="account-profile-group">
          <div className="account-profile-heading">
            <strong>{t.clinicMemberTitle}</strong>
            <p>{t.clinicMemberText}</p>
          </div>
          <div className="auth-membership-summary">
            <div>
              <span>{t.companyPlansTitle}</span>
              <strong>{clinicAccess.clinicName}</strong>
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className="account-profile-group">
        <div className="account-profile-heading">
          <strong>{t.clinicAccessTitle}</strong>
          <p>{t.clinicAccessSubtitle}</p>
        </div>
        <div className="auth-membership-summary">
          <div>
            <span>{t.clinicInviteCodeLabel}</span>
            <strong>{clinicAccess?.inviteCode ?? '--'}</strong>
          </div>
          <div>
            <span>{t.clinicSeats}</span>
            <strong>
              {clinicAccess?.linkedSeatCount ?? 0} / {selectedSeatCount}
            </strong>
          </div>
        </div>
        <label className="account-profile-span-full">
          {t.clinicAllowedEmails}
          <textarea
            rows={4}
            value={clinicAllowedEmailLines}
            onChange={(event) => setClinicAllowedEmailLines(event.target.value)}
            placeholder="vet1@clinica.com&#10;vet2@clinica.com"
          />
          <span className="auth-account-hint">{t.clinicAllowedEmailsHint}</span>
        </label>
        <div className="auth-account-actions">
          <button type="button" className="theme-button" onClick={handleSaveClinicAccess} disabled={isBusy}>
            {t.clinicSave}
          </button>
        </div>
      </section>
    );
  };

  const renderProfessionalProfileSection = () => (
    <section className="account-profile-shell">
      <div className="auth-panel-heading">
        <div>
          <span className="section-kicker">{t.profileTitle}</span>
          <strong>{t.profileSubtitle}</strong>
        </div>
      </div>

      <section className="account-profile-group">
        <div className="account-profile-heading">
          <strong>{t.userData}</strong>
        </div>
        <div className="account-profile-grid">
          <label>
            {t.fullLegalName}
            <input type="text" value={profileFullName} onChange={(event) => setProfileFullName(event.target.value)} />
          </label>
          <label>
            {t.nationalId}
            <input type="text" value={profileNationalId} onChange={(event) => setProfileNationalId(event.target.value)} />
          </label>
          <label>
            {t.licenseNumber}
            <input type="text" value={profileLicenseNumber} onChange={(event) => setProfileLicenseNumber(event.target.value)} />
          </label>
          <label>
            {t.licenseProvince}
            <input type="text" value={profileLicenseProvince} onChange={(event) => setProfileLicenseProvince(event.target.value)} />
          </label>
        </div>
      </section>

      <section className="account-profile-group">
        <div className="account-profile-heading">
          <strong>{t.centerData}</strong>
        </div>
        <div className="account-profile-grid">
          <label>
            {t.workplaceName}
            <input type="text" value={profileWorkplaceName} onChange={(event) => setProfileWorkplaceName(event.target.value)} />
          </label>
          <label>
            {t.centerFiscalName}
            <input
              type="text"
              value={profileCenterFiscalName}
              onChange={(event) => setProfileCenterFiscalName(event.target.value)}
            />
          </label>
          <label>
            {t.centerTaxId}
            <input type="text" value={profileCenterTaxId} onChange={(event) => setProfileCenterTaxId(event.target.value)} />
          </label>
          <label>
            {t.centerType}
            <select value={profileCenterType} onChange={(event) => setProfileCenterType(event.target.value)}>
              <option value="">--</option>
              {centerTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {getCenterTypeLabel(option, t)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="account-profile-group">
        <div className="account-profile-heading">
          <strong>{t.contactChannels}</strong>
        </div>
        <div className="account-profile-grid">
          <label>
            {t.professionalEmail}
            <input
              type="email"
              value={profileProfessionalEmail}
              onChange={(event) => setProfileProfessionalEmail(event.target.value)}
            />
          </label>
          <label>
            {t.privateEmail}
            <input type="email" value={profilePrivateEmail} onChange={(event) => setProfilePrivateEmail(event.target.value)} />
          </label>
          <label>
            {t.phoneMobile}
            <input type="tel" value={profilePhoneMobile} onChange={(event) => setProfilePhoneMobile(event.target.value)} />
          </label>
          <label className="account-profile-span-full">
            {t.websites}
            <textarea
              rows={4}
              value={profileWebsiteLines}
              onChange={(event) => setProfileWebsiteLines(event.target.value)}
              placeholder={t.websitesHint}
            />
          </label>
        </div>
      </section>

      <section className="account-profile-group">
        <div className="account-profile-heading">
          <strong>{t.digitalPresence}</strong>
        </div>
        <div className="account-profile-grid">
          <label>
            {t.instagramUrl}
            <input type="url" value={profileInstagramUrl} onChange={(event) => setProfileInstagramUrl(event.target.value)} />
          </label>
          <label>
            {t.tiktokUrl}
            <input type="url" value={profileTiktokUrl} onChange={(event) => setProfileTiktokUrl(event.target.value)} />
          </label>
          <label>
            {t.youtubeUrl}
            <input type="url" value={profileYoutubeUrl} onChange={(event) => setProfileYoutubeUrl(event.target.value)} />
          </label>
          <label>
            {t.facebookUrl}
            <input type="url" value={profileFacebookUrl} onChange={(event) => setProfileFacebookUrl(event.target.value)} />
          </label>
          <label>
            {t.linkedinUrl}
            <input type="url" value={profileLinkedinUrl} onChange={(event) => setProfileLinkedinUrl(event.target.value)} />
          </label>
        </div>
      </section>

      <section className="account-profile-group">
        <div className="account-profile-heading">
          <strong>{t.reportPreferences}</strong>
          <p>{t.profileSubtitle}</p>
        </div>
        <div className="account-checkbox-grid">
          {reportFieldOptions.map((field) => {
            const checked = reportVisibleFieldsDraft.includes(field);
            return (
              <label key={field} className="checkbox-inline account-checkbox-card">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    setReportVisibleFieldsDraft((current) =>
                      checked ? current.filter((item) => item !== field) : [...current, field],
                    )
                  }
                />
                <span>{getReportFieldLabel(field, t)}</span>
              </label>
            );
          })}
        </div>
        {reportVisibleFieldsDraft.length === 0 ? <p className="auth-account-hint">{t.noReportFields}</p> : null}
      </section>

      <div className="auth-account-actions">
        <button type="button" className="theme-button" onClick={handleSaveProfile} disabled={isBusy}>
          {t.profileSave}
        </button>
      </div>
    </section>
  );

  const renderAdminSection = () => (
    <section className="admin-role-panel">
      <div className="auth-panel-heading admin-role-heading">
        <div>
          <span className="section-kicker">{t.adminToolsTitle}</span>
          <strong>{t.adminToolsSubtitle}</strong>
        </div>
      </div>

      <div className="admin-tool-grid" role="tablist" aria-label={t.adminToolsTitle}>
        {[
          { id: 'preview' as const, label: t.adminToolPreview, count: previewOptions.length },
          { id: 'users' as const, label: t.adminToolUsers, count: adminProfiles.length },
          { id: 'issues' as const, label: t.adminToolIssues, count: openSupportIssuesCount },
        ].map((tool) => (
          <button
            key={tool.id}
            type="button"
            className={`admin-tool-button ${activeAdminTool === tool.id ? 'is-active' : ''}`}
            onClick={() => setActiveAdminTool(tool.id)}
          >
            <span>{tool.label}</span>
            <strong>{tool.count}</strong>
          </button>
        ))}
      </div>

      {activeAdminTool === 'preview' ? (
        <>
          <div className="auth-panel-heading admin-role-heading">
            <div>
              <span className="section-kicker">{t.previewTitle}</span>
              <strong>{t.previewSubtitle}</strong>
            </div>
          </div>

          <div className="admin-preview-panel">
            <label>
              {t.previewLabel}
              <select value={accessPreviewMode} onChange={(event) => onChangeAccessPreviewMode?.(event.target.value as AccessPreviewMode)}>
                {previewOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </>
      ) : null}

      {activeAdminTool === 'users' ? (
        <>
          <div className="auth-panel-heading admin-role-heading">
            <div>
              <span className="section-kicker">{t.adminTitle}</span>
              <strong>{t.adminSubtitle}</strong>
              <p>{t.adminRoleHint}</p>
            </div>
            <button type="button" className="secondary-button" onClick={handleReloadProfiles} disabled={adminLoading || isBusy}>
              {t.adminRefresh}
            </button>
          </div>

          {adminLoading ? <p className="auth-account-hint">{t.adminLoading}</p> : null}
          {!adminLoading && adminProfiles.length === 0 ? <p className="auth-account-hint">{t.adminEmpty}</p> : null}

          {!adminLoading && adminProfiles.length > 0 ? (
            <section className="account-profile-group admin-directory-group">
              <div className="account-profile-heading">
                <strong>{t.adminDirectoryTitle}</strong>
                <p>{t.adminDirectorySubtitle}</p>
              </div>

              <div className="admin-directory-toolbar">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsAdminDirectoryOpen((current) => !current)}
                >
                  {isAdminDirectoryOpen ? t.adminDirectoryClose : t.adminDirectoryOpen}
                </button>
                <span className="admin-directory-count">
                  {t.adminResults}: {filteredAdminProfiles.length} / {adminProfiles.length}
                </span>
              </div>

              {isAdminDirectoryOpen ? (
                <>
                  <label className="admin-directory-search">
                    {t.adminSearchLabel}
                    <input
                      type="search"
                      value={adminSearchQuery}
                      placeholder={t.adminSearchPlaceholder}
                      onChange={(event) => setAdminSearchQuery(event.target.value)}
                    />
                  </label>

                  {filteredAdminProfiles.length === 0 ? <p className="auth-account-hint">{t.adminEmpty}</p> : null}

                  {filteredAdminProfiles.length > 0 ? (
                    <div className="admin-role-list">
                      {filteredAdminProfiles.map((profile) => (
                        <article key={profile.id} className="admin-role-item">
                          <div className="admin-role-identity">
                            <strong>{getProfileDisplayName(profile)}</strong>
                            <p>
                              {[
                                profile.email,
                                profile.workplaceName,
                                profile.licenseNumber,
                                profile.centerTaxId,
                                profile.phoneMobile,
                              ]
                                .filter(Boolean)
                                .join(' · ') || profile.id}
                            </p>
                            <div className="admin-role-membership">
                              <span>
                                <strong>{t.adminSubscriptionPlan}:</strong>{' '}
                                {profile.membership ? getPlanLabel(profile.membership.planId, lang) : getAccountTypeLabel(profile.accountType, t)}
                              </span>
                              <span>
                                <strong>{t.adminSubscriptionEnds}:</strong>{' '}
                                {formatDate(lang, profile.membership?.currentPeriodEnd ?? profile.membership?.trialEndsAt)}
                              </span>
                              <span>
                                <strong>{t.adminDiscountCodeUsed}:</strong> {profile.membership?.discountCode ?? t.adminNoDiscountCode}
                              </span>
                            </div>
                          </div>
                          <div className="admin-role-controls">
                            <label>
                              {t.adminAccountType}
                              <select
                                value={adminAccountTypeDraft[profile.id] ?? profile.accountType}
                                onChange={(event) =>
                                  setAdminAccountTypeDraft((current) => ({
                                    ...current,
                                    [profile.id]: event.target.value as AccountType,
                                  }))
                                }
                              >
                                {accountTypeOptions.map((accountType) => (
                                  <option key={`${profile.id}-type-${accountType}`} value={accountType}>
                                    {getAccountTypeLabel(accountType, t)}
                                  </option>
                                ))}
                              </select>
                            </label>
                            {(adminAccountTypeDraft[profile.id] ?? profile.accountType) === 'partner' ? (
                              <label>
                                {t.adminPartnerCategory}
                                <select
                                  value={adminPartnerCategoryDraft[profile.id] ?? profile.partnerCategory ?? ''}
                                  onChange={(event) =>
                                    setAdminPartnerCategoryDraft((current) => ({
                                      ...current,
                                      [profile.id]: event.target.value as PartnerCategory | '',
                                    }))
                                  }
                                >
                                  <option value="">--</option>
                                  {partnerCategoryOptions.map((partnerCategory) => (
                                    <option key={`${profile.id}-partner-${partnerCategory}`} value={partnerCategory}>
                                      {getPartnerCategoryLabel(partnerCategory, t)}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            ) : null}
                            <label>
                              {t.adminRole}
                              <div className="admin-role-checkboxes">
                                {roleOptions.map((role) => {
                                  const checked = (adminRolesDraft[profile.id] ?? profile.roles).includes(role);
                                  return (
                                    <label key={`${profile.id}-${role}`} className="checkbox-inline admin-role-check">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() =>
                                          setAdminRolesDraft((current) => {
                                            const currentRoles = current[profile.id] ?? profile.roles;
                                            const nextRoles = checked
                                              ? currentRoles.filter((item) => item !== role)
                                              : [...currentRoles, role];
                                            return {
                                              ...current,
                                              [profile.id]: nextRoles.length > 0 ? nextRoles : ['viewer'],
                                            };
                                          })
                                        }
                                      />
                                      <span>{formatUserRole(lang, role)}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </label>
                            <button type="button" className="secondary-button" onClick={() => handleSaveRole(profile.id)} disabled={isBusy}>
                              {t.adminSaveRole}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : null}
            </section>
          ) : null}
        </>
      ) : null}

      {activeAdminTool === 'issues' ? (
        <section className="account-profile-group admin-directory-group">
          <div className="auth-panel-heading admin-role-heading">
            <div>
              <span className="section-kicker">{t.supportIssuesTitle}</span>
              <strong>{t.supportIssuesSubtitle}</strong>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={handleReloadSupportIssues}
              disabled={supportIssuesLoading || isBusy}
            >
              {t.supportIssuesRefresh}
            </button>
          </div>

          {supportIssuesLoading ? <p className="auth-account-hint">{t.supportIssuesLoading}</p> : null}
          {!supportIssuesLoading && supportIssuesSetupMissing ? (
            <p className="auth-account-hint support-issue-setup-hint">{t.supportIssuesSetupMissing}</p>
          ) : null}
          {!supportIssuesLoading && supportIssues.length === 0 ? <p className="auth-account-hint">{t.supportIssuesEmpty}</p> : null}

          {!supportIssuesLoading && supportIssues.length > 0 ? (
            <>
              <div className="support-issue-filter-panel">
                <span>{t.supportIssuesFilters}</span>
                <div className="support-issue-filter-options">
                  {supportIssueStatusOptions.map((status) => {
                    const checked = supportIssueStatusFilters.includes(status);
                    return (
                      <label key={`support-filter-${status}`} className="checkbox-inline support-issue-filter-check">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSupportIssueStatusFilters((current) =>
                              checked ? current.filter((item) => item !== status) : [...current, status],
                            )
                          }
                        />
                        <span>{getSupportIssueStatusLabel(status, t)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {filteredSupportIssues.length === 0 ? <p className="auth-account-hint">{t.supportIssuesFilteredEmpty}</p> : null}

              <div className="support-issue-list">
                {filteredSupportIssues.map((issue) => {
                  const displayUrl = getMeaningfulSupportIssueUrl(issue.pageUrl);
                  return (
                <article key={issue.id} className="support-issue-item">
                  <div className="support-issue-head">
                    <div>
                      <span className="section-kicker">{issue.module || t.supportIssueModule}</span>
                      <strong>{issue.type}</strong>
                    </div>
                    <span className={`support-issue-status is-${issue.status}`}>
                      {getSupportIssueStatusLabel(issue.status, t)}
                    </span>
                  </div>
                  <p>{issue.description}</p>
                  <div className="support-issue-meta">
                    <span>
                      <strong>{t.supportIssueSender}:</strong> {issue.email || '--'}
                    </span>
                    <span>
                      <strong>{t.supportIssueDate}:</strong> {formatDate(lang, issue.createdAt)}
                    </span>
                    {displayUrl ? (
                      <a href={displayUrl} target="_blank" rel="noreferrer">
                        {t.supportIssueUrl}
                      </a>
                    ) : null}
                  </div>
                  <label className="support-issue-status-control">
                    {t.status}
                    <select
                      value={issue.status}
                      onChange={(event) => handleSupportIssueStatusChange(issue.id, event.target.value as SupportIssue['status'])}
                      disabled={isBusy}
                    >
                      {supportIssueStatusOptions.map((status) => (
                        <option key={`${issue.id}-${status}`} value={status}>
                          {getSupportIssueStatusLabel(status, t)}
                        </option>
                      ))}
                    </select>
                  </label>
                </article>
                  );
                })}
              </div>
            </>
          ) : null}
        </section>
      ) : null}
    </section>
  );

  const renderCompactAccountCard = () => (
    <div className="auth-account-card auth-account-card-compact account-card-expanded">
      <div className="auth-panel-heading account-card-header">
        <div>
          <span className="section-kicker">{t.compactTitle}</span>
          <strong>{account?.profile?.fullName || account?.email || 'WAIRUA VetAI'}</strong>
          <p>{t.compactSubtitle}</p>
        </div>
        {onClose ? (
          <button type="button" className="secondary-button account-close-button" onClick={onClose}>
            {t.close}
          </button>
        ) : null}
      </div>

      <div className="account-section-tabs" role="tablist" aria-label={t.account}>
        <button type="button" className={accountSection === 'summary' ? 'active' : ''} onClick={() => setAccountSection('summary')}>
          {t.sectionSummary}
        </button>
        <button type="button" className={accountSection === 'profile' ? 'active' : ''} onClick={() => setAccountSection('profile')}>
          {t.sectionProfile}
        </button>
        {isAdmin ? (
          <button type="button" className={accountSection === 'admin' ? 'active' : ''} onClick={() => setAccountSection('admin')}>
            {t.sectionAdmin}
          </button>
        ) : null}
      </div>

      {message ? <p className="auth-feedback auth-feedback-success">{message}</p> : null}
      {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}

      {accountSection === 'summary' ? renderAccountSummarySection() : null}
      {accountSection === 'profile' ? renderProfessionalProfileSection() : null}
      {isAdmin && accountSection === 'admin' ? renderAdminSection() : null}
    </div>
  );

  const renderAuthForm = () => (
    <section className={`auth-card ${isScreenLayout ? 'auth-card-screen' : ''}`}>
      {isScreenLayout ? (
        <div className="auth-card-brand">
          <p className="badge">WAIRUA VetAI</p>
          <h2>{t.welcomeBack}</h2>
          <p>{mode === 'sign_up' ? t.signUpHelp : t.signInHelp}</p>
        </div>
      ) : null}

      <div className="auth-mode-switch" role="tablist" aria-label="Authentication mode">
        <button type="button" className={mode === 'sign_in' ? 'active' : ''} onClick={() => setMode('sign_in')}>
          {t.signIn}
        </button>
        <button type="button" className={mode === 'sign_up' ? 'active' : ''} onClick={() => setMode('sign_up')}>
          {t.signUp}
        </button>
      </div>

      {mode === 'sign_up' ? (
        <div className="auth-trial-callout">
          <strong>{t.trialBadge}</strong>
          <p>{t.trialInfo}</p>
        </div>
      ) : null}

      {mode === 'sign_up' ? (
        <label>
          {t.clinicInviteCode}
          <input
            type="text"
            value={clinicInviteCode}
            placeholder={t.clinicInvitePlaceholder}
            onChange={(event) => setClinicInviteCode(event.target.value.toUpperCase())}
          />
          <span className="auth-account-hint">{clinicInviteCode.trim() ? t.clinicLinkedSignup : t.clinicInviteHint}</span>
        </label>
      ) : null}

      {mode === 'sign_up' && !clinicInviteCode.trim() ? renderPlanSelector() : null}

      <button type="button" className="secondary-button auth-google-button" onClick={handleGoogle} disabled={isBusy}>
        <GoogleMark />
        <span>{mode === 'sign_up' ? t.signUpGoogle : t.withGoogle}</span>
      </button>

      <form className="auth-form" onSubmit={handleEmailAuth}>
        {mode === 'sign_up' ? (
          <label>
            {t.fullName}
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required={mode === 'sign_up'}
              autoComplete="name"
            />
          </label>
        ) : null}

        <label>
          {t.email}
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
        </label>

        <label>
          {t.password}
          <div className="auth-password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete={mode === 'sign_up' ? 'new-password' : 'current-password'}
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? t.hidePassword : t.showPassword}
            >
              {showPassword ? t.hidePassword : t.showPassword}
            </button>
          </div>
        </label>

        <button type="submit" className="theme-button" disabled={isBusy}>
          {mode === 'sign_up' ? (clinicInviteCode.trim() ? t.createLinkedAccount : t.createAccount) : t.accessAccount}
        </button>
      </form>

      {mode === 'sign_in' ? (
        <button type="button" className="auth-inline-button auth-password-reset-button" onClick={handlePasswordReset} disabled={isBusy}>
          {t.forgotPassword}
        </button>
      ) : null}

      {message ? <p className="auth-feedback auth-feedback-success">{message}</p> : null}
      {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}

      <p className="auth-switch-copy">
        {mode === 'sign_up' ? t.alreadyHaveAccount : t.noAccountQuestion}{' '}
        <button type="button" className="auth-inline-button" onClick={() => setMode(mode === 'sign_up' ? 'sign_in' : 'sign_up')}>
          {mode === 'sign_up' ? t.signInNow : t.createNow}
        </button>
      </p>
      <p className="auth-support-copy">
        {t.accessHelp}{' '}
        <a href={`mailto:${supportEmail}`} className="auth-inline-button">
          {t.contactSupport}
        </a>
      </p>
    </section>
  );

  if (!service) {
    if (isScreenLayout) {
      return (
        <section className="auth-screen">
          <div className="auth-screen-visual">
            <div className="auth-visual-inner">
              <div className="auth-visual-art-wrap">
                <img src={wairuaLoginArt} alt="WAIRUA VetAI" className="auth-visual-art" />
              </div>
            </div>
          </div>
          <div className="auth-screen-panel">
            <div className="auth-card auth-card-screen">
              <div className="auth-card-brand">
                <p className="badge">Demo</p>
                <h2>{lang === 'es' ? 'Acceso temporalmente en modo demostracion' : 'Access currently running in demo mode'}</h2>
                <p>{t.unavailable}</p>
              </div>
              <p className="auth-unavailable">{t.unavailableHint}</p>
            </div>
          </div>
        </section>
      );
    }

    return <p className="auth-unavailable">{t.unavailable}</p>;
  }

  if (isScreenLayout) {
    return (
      <section className="auth-screen">
        <div className="auth-screen-visual">
          <div className="auth-visual-inner">
            <div className="auth-visual-art-wrap">
              <img src={wairuaLoginArt} alt="WAIRUA VetAI" className="auth-visual-art" />
            </div>
          </div>
        </div>

        <div className="auth-screen-panel">{shouldShowForm ? renderAuthForm() : null}</div>
      </section>
    );
  }

  return (
    <div className="auth-panel">
      {account?.profile ? (
        renderCompactAccountCard()
      ) : (
        <>
          <button type="button" className="secondary-button auth-trigger" onClick={() => setIsOpen((current) => !current)}>
            {isOpen ? t.close : t.open}
          </button>
          {shouldShowForm ? renderAuthForm() : null}
        </>
      )}
    </div>
  );
}
