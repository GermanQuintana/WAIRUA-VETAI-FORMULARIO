import { useEffect, useMemo, useState } from 'react';
import { Language } from '../i18n';
import { AuthAccountSnapshot, BillingCycle, DiscountCodeRecord, MembershipSelection, UserProfile, UserRole } from '../types';
import { SupabaseAccessService } from '../services/supabase';
import wairuaLoginArt from '../assets/wairua-vetai-login-art.jpeg';

interface Props {
  lang: Language;
  service: SupabaseAccessService | null;
  account: AuthAccountSnapshot | null;
  onRefreshAccount: () => Promise<void>;
  layout?: 'compact' | 'screen';
}

type AuthMode = 'sign_in' | 'sign_up';

const PLAN_PRICES: Record<BillingCycle, number> = {
  monthly: 500,
  annual: 3600,
};

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
    monthly: 'Mensual',
    annual: 'Anual',
    monthlyPrice: '5 €/mes',
    annualPrice: '36 €/año',
    partnerCode: 'Código descuento',
    partnerCodePlaceholder: 'Ej: PARTNER1EURO3M',
    applyCode: 'Aplicar código',
    activeCode: 'Código activo',
    codeApplied: 'Código aplicado correctamente.',
    codeMissing: 'Ese código no existe o no está activo.',
    codeMonthlyOnly: 'El código existe, pero solo aplica al plan mensual.',
    trialInfo: 'Primero entras a la web app. Durante la prueba tienes acceso completo y después mantienes la parte gratuita si no activas premium.',
    signInHelp: 'Accede con Google o con tu email y contraseña para entrar en la plataforma.',
    signUpHelp: 'Crea tu cuenta, deja guardado tu plan preferido y activa la prueba gratuita completa.',
    signUpGoogle: 'Crear cuenta con Google',
    createAccount: 'Crear cuenta y activar prueba',
    accessAccount: 'Entrar en la cuenta',
    emailConfirmation:
      'Cuenta creada. Si Supabase exige confirmación de email, revisa tu correo y después inicia sesión.',
    genericError: 'No se pudo completar la operación.',
    account: 'Cuenta',
    selectedPlan: 'Plan elegido',
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
    savePreference: 'Guardar preferencia en Supabase',
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
    compactSubtitle: 'Controla prueba, plan y estado premium desde aquí.',
    trialWarning: 'Tiempo restante de prueba',
    autoRenewOn: 'Renovación automática',
    autoRenewOff: 'No se renovará automáticamente',
    managePlanHint: 'Aquí puedes ampliar, renovar, cambiar de plan o darte de baja.',
    adminTitle: 'Administración de editores',
    adminSubtitle: 'Autoriza quién puede editar la base colaborativa.',
    adminRefresh: 'Recargar usuarios',
    adminRole: 'Roles',
    adminSaveRole: 'Guardar roles',
    adminLoading: 'Cargando usuarios...',
    adminEmpty: 'No se han encontrado perfiles.',
    adminRoleSaved: 'Roles actualizados correctamente.',
    adminRoleHint: 'Puedes marcar varios roles para el mismo usuario.',
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
    monthly: 'Monthly',
    annual: 'Annual',
    monthlyPrice: 'EUR 5/month',
    annualPrice: 'EUR 36/year',
    partnerCode: 'Discount code',
    partnerCodePlaceholder: 'Example: PARTNER1EURO3M',
    applyCode: 'Apply code',
    activeCode: 'Active code',
    codeApplied: 'Code applied successfully.',
    codeMissing: 'That code does not exist or is inactive.',
    codeMonthlyOnly: 'The code exists, but only applies to the monthly plan.',
    trialInfo: 'You first enter the web app. During the trial all premium areas stay open, and after that the free areas remain available unless you activate premium.',
    signInHelp: 'Use Google or your email and password to enter the platform.',
    signUpHelp: 'Create your account, save your preferred plan, and start the full free trial.',
    signUpGoogle: 'Create account with Google',
    createAccount: 'Create account and start trial',
    accessAccount: 'Access account',
    emailConfirmation:
      'Account created. If Supabase requires email confirmation, check your inbox and then sign in.',
    genericError: 'The operation could not be completed.',
    account: 'Account',
    selectedPlan: 'Selected plan',
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
    savePreference: 'Save preference in Supabase',
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
    compactSubtitle: 'Manage your trial, plan, and premium status here.',
    trialWarning: 'Remaining trial time',
    autoRenewOn: 'Auto-renew is on',
    autoRenewOff: 'Will not auto-renew',
    managePlanHint: 'You can upgrade, renew, change plan, or cancel here.',
    adminTitle: 'Editor administration',
    adminSubtitle: 'Authorize who can edit the collaborative knowledge base.',
    adminRefresh: 'Reload users',
    adminRole: 'Roles',
    adminSaveRole: 'Save roles',
    adminLoading: 'Loading users...',
    adminEmpty: 'No profiles found.',
    adminRoleSaved: 'Roles updated successfully.',
    adminRoleHint: 'You can assign multiple roles to the same user.',
  },
} as const;

const roleOptions: UserRole[] = ['viewer', 'contributor', 'editor', 'reviewer', 'admin'];

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

const getAppReturnUrl = () => {
  const path = window.location.pathname || '/';
  return new URL(path, window.location.origin).toString();
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message;
  return fallback;
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

const isDiscountApplicable = (cycle: BillingCycle, discount: DiscountCodeRecord | null) =>
  Boolean(discount && (discount.appliesTo === cycle || discount.appliesTo === 'both'));

const buildMembershipSelection = (cycle: BillingCycle, discount: DiscountCodeRecord | null): MembershipSelection => {
  const listPriceCents = PLAN_PRICES[cycle];
  const applicableDiscount = isDiscountApplicable(cycle, discount) ? discount : null;

  if (!applicableDiscount) {
    return {
      billingCycle: cycle,
      listPriceCents,
      finalPriceCents: listPriceCents,
    };
  }

  if (applicableDiscount.discountMode === 'override_price' && applicableDiscount.overridePriceCents !== undefined) {
    return {
      billingCycle: cycle,
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
    billingCycle: cycle,
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
}: Props) {
  const t = copy[lang];
  const [isOpen, setIsOpen] = useState(layout === 'screen');
  const [mode, setMode] = useState<AuthMode>('sign_in');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<BillingCycle>('monthly');
  const [discountInput, setDiscountInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCodeRecord | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [adminProfiles, setAdminProfiles] = useState<UserProfile[]>([]);
  const [adminRolesDraft, setAdminRolesDraft] = useState<Record<string, UserRole[]>>({});
  const [adminLoading, setAdminLoading] = useState(false);

  const selection = useMemo(() => buildMembershipSelection(selectedPlan, appliedDiscount), [appliedDiscount, selectedPlan]);
  const effectiveDiscount = isDiscountApplicable(selectedPlan, appliedDiscount) ? appliedDiscount : null;
  const selectedPlanLabel = selectedPlan === 'monthly' ? t.monthly : t.annual;
  const hasMembership = Boolean(account?.membership);
  const membership = account?.membership ?? null;
  const isScreenLayout = layout === 'screen';
  const shouldShowForm = isScreenLayout ? !account?.profile : isOpen && !account?.profile;
  const stripeStatusLabel = formatStripeStatus(membership?.stripeStatus ?? membership?.status, t);
  const isAdmin = (account?.profile?.roles ?? [account?.profile?.role ?? 'viewer']).includes('admin');
  const now = Date.now();
  const trialTimeLeftMs = membership?.trialEndsAt ? new Date(membership.trialEndsAt).getTime() - now : null;
  const trialDaysLeft =
    trialTimeLeftMs != null && Number.isFinite(trialTimeLeftMs) ? Math.max(0, Math.ceil(trialTimeLeftMs / (1000 * 60 * 60 * 24))) : null;

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
        setAdminRolesDraft(
          Object.fromEntries(profiles.map((profile) => [profile.id, profile.roles])),
        );
      } catch (error) {
        if (!ignore) setError(getErrorMessage(error, t.genericError));
      } finally {
        if (!ignore) setAdminLoading(false);
      }
    };

    void loadProfiles();

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
      setMessage(isDiscountApplicable(selectedPlan, discount) ? t.codeApplied : t.codeMonthlyOnly);
    } catch (error) {
      setError(getErrorMessage(error, t.genericError));
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
      await service.signInWithGoogle(redirectTo, mode === 'sign_up' ? selection : undefined);
    } catch (error) {
      setError(getErrorMessage(error, t.genericError));
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
        const result = await service.signUpWithEmail({
          email,
          password,
          fullName,
          selection,
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
      setIsOpen(false);
    } catch (error) {
      setError(getErrorMessage(error, t.genericError));
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
      setMessage(t.adminRoleSaved);
    } catch {
      setError(t.genericError);
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
      setError(getErrorMessage(error, t.genericError));
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
      setError(getErrorMessage(error, t.genericError));
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
      setError(getErrorMessage(error, t.genericError));
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
    } catch (error) {
      setError(getErrorMessage(error, t.genericError));
    } finally {
      setAdminLoading(false);
    }
  };

  const handleSaveRole = async (profileId: string) => {
    if (!service || !isAdmin) return;
    resetFeedback();
    setIsBusy(true);

    try {
      const updated = await service.updateUserRoles(profileId, adminRolesDraft[profileId] ?? ['viewer']);
      setAdminProfiles((current) => current.map((profile) => (profile.id === updated.id ? updated : profile)));
      setMessage(t.savedPlan);
      await onRefreshAccount();
    } catch (error) {
      setError(getErrorMessage(error, t.genericError));
    } finally {
      setIsBusy(false);
    }
  };

  const renderPlanSelector = () => (
    <>
      <div className="auth-plan-block">
        <span className="auth-label">{t.planTitle}</span>
        <div className="auth-plan-grid">
          <button
            type="button"
            className={selectedPlan === 'monthly' ? 'active' : ''}
            onClick={() => setSelectedPlan('monthly')}
          >
            <span>{t.monthly}</span>
            <strong>{t.monthlyPrice}</strong>
          </button>
          <button
            type="button"
            className={selectedPlan === 'annual' ? 'active' : ''}
            onClick={() => setSelectedPlan('annual')}
          >
            <span>{t.annual}</span>
            <strong>{t.annualPrice}</strong>
          </button>
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

      <div className="auth-price-note">
        <span>{t.thenLabel}</span>
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

  const renderCompactAccountCard = () => (
    <div className="auth-account-card auth-account-card-compact">
      <div className="auth-panel-heading">
        <div>
          <span className="section-kicker">{t.compactTitle}</span>
          <strong>{account?.profile?.fullName || account?.email || 'WAIRUA VetAI'}</strong>
          <p>{t.compactSubtitle}</p>
        </div>
      </div>

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
          <span>{t.selectedPlan}</span>
          <strong>
            {hasMembership
              ? `${membership?.billingCycle === 'monthly' ? t.monthly : t.annual} · ${formatPrice(lang, membership?.finalPriceCents ?? selection.finalPriceCents)}`
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

      <p className="auth-account-hint">{hasMembership ? t.updateHint : t.trialStartHint}</p>
      <p className="auth-account-hint">{t.managePlanHint}</p>

      {membership?.stripeCustomerId ? (
        <div className="auth-price-note">
          <span>{t.customerBilling}</span>
          <strong>{stripeStatusLabel}</strong>
          <p>{t.renewalHelp}</p>
        </div>
      ) : null}

      {renderPlanSelector()}

      {message ? <p className="auth-feedback auth-feedback-success">{message}</p> : null}
      {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}

      <div className="auth-price-note">
        <span>{t.billingTitle}</span>
        <strong>{t.stripeCheckout}</strong>
        <p>{t.stripeHelp}</p>
      </div>

      <div className="auth-account-actions">
        <button type="button" className="theme-button" onClick={handleSavePlan} disabled={isBusy}>
          {hasMembership ? t.savePreference : t.activateTrial}
        </button>
        <button type="button" className="theme-button" onClick={handleStripeCheckout} disabled={isBusy}>
          {t.stripeCheckout}
        </button>
        {membership?.stripeCustomerId ? (
          <button type="button" className="secondary-button" onClick={handleStripePortal} disabled={isBusy}>
            {t.portalCta}
          </button>
        ) : null}
        <button type="button" className="secondary-button" onClick={handleSignOut} disabled={isBusy}>
          {t.signOut}
        </button>
      </div>

      {membership?.stripeCustomerId ? <p className="auth-account-hint">{t.stripePortalHelp}</p> : null}

      {isAdmin ? (
        <section className="admin-role-panel">
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
            <div className="admin-role-list">
              {adminProfiles.map((profile) => (
                <article key={profile.id} className="admin-role-item">
                  <div>
                    <strong>{profile.fullName || profile.email || profile.id}</strong>
                    <p>{profile.email ?? profile.id}</p>
                  </div>
                  <div className="admin-role-controls">
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
                              <span>{role}</span>
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
        </section>
      ) : null}
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

      {mode === 'sign_up' ? renderPlanSelector() : null}

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
          {mode === 'sign_up' ? t.createAccount : t.accessAccount}
        </button>
      </form>

      {message ? <p className="auth-feedback auth-feedback-success">{message}</p> : null}
      {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}

      <p className="auth-switch-copy">
        {mode === 'sign_up' ? t.alreadyHaveAccount : t.noAccountQuestion}{' '}
        <button type="button" className="auth-inline-button" onClick={() => setMode(mode === 'sign_up' ? 'sign_in' : 'sign_up')}>
          {mode === 'sign_up' ? t.signInNow : t.createNow}
        </button>
      </p>
    </section>
  );

  if (!service) {
    if (isScreenLayout) {
      return (
        <section className="auth-screen">
          <div className="auth-screen-visual">
            <div className="auth-visual-inner">
              <p className="badge">WAIRUA VetAI</p>
              <div className="auth-visual-art-wrap">
                <img src={wairuaLoginArt} alt="WAIRUA VetAI" className="auth-visual-art" />
              </div>
              <p className="auth-visual-note">{t.visualNote}</p>
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
            <p className="badge">WAIRUA VetAI</p>
            <div className="auth-visual-art-wrap">
              <img src={wairuaLoginArt} alt="WAIRUA VetAI" className="auth-visual-art" />
            </div>
            <p className="auth-visual-note">{t.visualNote}</p>
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
