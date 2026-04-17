export type Species =
  | 'Dog'
  | 'Cat'
  | 'Rabbit'
  | 'Ferret'
  | 'Guinea Pig'
  | 'Chinchilla'
  | 'Other Rodents'
  | 'Reptiles'
  | 'Psittacines'
  | 'Raptors'
  | 'Passerines'
  | 'Poultry'
  | 'Equine';

export type OtcSpecies = Species | 'Bovine' | 'Ovine' | 'Caprine' | 'Porcine' | 'Fish' | 'Bee';

export type EvidenceLevel = 'High' | 'Moderate' | 'Low' | 'Expert Consensus';
export type EditorialStatus = 'draft' | 'under_review' | 'approved';
export type PublicationStatus = 'pending_activation' | 'active' | 'rejected';
export type BillingCycle = 'monthly' | 'annual';
export type MembershipStatus = 'trialing' | 'pending_payment' | 'active' | 'expired' | 'cancelled';
export type AuthProvider = 'google' | 'email' | 'unknown';
export type DiscountMode = 'fixed_amount' | 'override_price';
export type UserRole = 'viewer' | 'contributor' | 'editor' | 'reviewer' | 'admin';
export type AccessPreviewMode = 'actual' | 'free_viewer' | 'premium_viewer' | 'contributor' | 'editor' | 'reviewer';

export interface LocalizedText {
  es: string;
  en: string;
}

export interface ScientificReference {
  id: string;
  title: string;
  authors: string;
  year: number;
  source: string;
  url?: string;
}

export interface EntryReviewSummary {
  approvalCount: number;
  approvalScore: number;
  currentUserApproved?: boolean;
  currentUserApprovalLevel?: number;
  currentUserNote?: string;
}

export interface TherapeuticEntry {
  id: string;
  activeIngredient: string;
  tradeNames: string[];
  species: Species[];
  tags: string[];
  systems: string[];
  pathologies: string[];
  concentrations: string[];
  indications: LocalizedText;
  dosage: LocalizedText;
  administrationConditions: LocalizedText;
  adverseEffects: LocalizedText;
  contraindications: LocalizedText;
  interactions: LocalizedText;
  notes?: LocalizedText;
  evidenceLevel: EvidenceLevel;
  editorialStatus: EditorialStatus;
  publicationStatus?: PublicationStatus;
  reviewSummary?: EntryReviewSummary;
  calculatorPresets?: DoseCalculatorPreset[];
  references: ScientificReference[];
  cimavet?: {
    nregistro?: string;
    url?: string;
    nameQuery?: string;
  };
  lastUpdated: string;
}

export interface DoseCalculatorPreset {
  id: string;
  category: LocalizedText;
  species: Species[];
  route: string;
  indication: LocalizedText;
  doseRangeMgKg: {
    min: number;
    max: number;
  };
  defaultDoseMgKg: number;
  concentration: {
    es: string;
    en: string;
    mgPerMl?: number;
    mgPerTablet?: number;
  };
  references?: ScientificReference[];
}

export interface DoseCalculatorEntry {
  id: string;
  activeIngredient: string;
  category: LocalizedText;
  subcategory?: LocalizedText;
  antibioticCategory?: string;
  species: Species[];
  speciesLabel?: string;
  route: string;
  indication: LocalizedText;
  doseRangeMgKg: {
    min: number;
    max: number;
  };
  defaultDoseMgKg: number;
  doseText?: string;
  doseUnit?: string;
  frequency?: string;
  duration?: string;
  observations?: string;
  bibliography?: string;
  concentration: {
    es: string;
    en: string;
    mgPerMl?: number;
    mgPerTablet?: number;
  };
  linkedEntryId?: string;
  publicationStatus?: PublicationStatus;
  reviewSummary?: EntryReviewSummary;
}

export type ClinicalDietFormat = 'dry' | 'wet' | 'mixed';

export interface ClinicalDietPresentation {
  id: string;
  label: string;
  format: ClinicalDietFormat;
  packageSizeG: number;
  target: 'general' | 'small_breed' | 'wet';
}

export interface ClinicalDietFeedingGuideRow {
  id: string;
  species: Species;
  bodyWeightKg: number;
  dailyAmountG: number;
  dailyAmountLabel?: string;
  notes?: string;
}

export interface ClinicalDietRecord {
  id: string;
  brandName: string;
  dietName: string;
  sourceUrl?: string;
  species: Species[];
  healthConditions: string[];
  format: ClinicalDietFormat;
  shortDescription: LocalizedText;
  composition: LocalizedText;
  indications: LocalizedText;
  contraindications?: LocalizedText;
  technicalSheet: LocalizedText;
  nutrientProfile: {
    energyKcalPer100g?: number;
    proteinPercentDm?: number;
    fatPercentDm?: number;
    fiberPercentDm?: number;
    carbohydratePercentDm?: number;
    phosphorusPercentDm?: number;
    sodiumPercentDm?: number;
    omega3PercentDm?: number;
  };
  presentations: ClinicalDietPresentation[];
  feedingGuide: ClinicalDietFeedingGuideRow[];
}

export interface FoodIngredientRecord {
  id: string;
  foodName: string;
  category: string;
  preparation: string;
  species: Species[];
  notes?: LocalizedText;
  nutrientsPer100g: {
    energyKcal: number;
    proteinG: number;
    fatG: number;
    carbohydrateG: number;
    fiberG: number;
    calciumMg: number;
    phosphorusMg: number;
    sodiumMg: number;
    potassiumMg: number;
    magnesiumMg: number;
    zincMg: number;
    taurineMg: number;
  };
}

export interface OtcFacet {
  key: string;
  label: LocalizedText;
}

export interface OtcProductRecord {
  id: string;
  manufacturer: string;
  portfolio?: string;
  productName: string;
  productType: OtcFacet;
  category: OtcFacet;
  species: OtcSpecies[];
  format: string;
  presentations: string[];
  activeCompounds: string;
  summary: LocalizedText;
  sourceUrl: string;
  sourceRegion: 'es' | 'global';
  searchTerms?: string[];
}

export interface DiscountCodeRecord {
  id: string;
  code: string;
  label: string;
  description?: string;
  partnerName?: string;
  appliesTo: BillingCycle | 'both';
  discountMode: DiscountMode;
  discountAmountCents?: number;
  overridePriceCents?: number;
  discountMonths: number;
  grantDays?: number;
  grantedRoles?: UserRole[];
  stripeCouponId?: string;
  stripePromotionCodeId?: string;
  active: boolean;
}

export interface MembershipSelection {
  billingCycle: BillingCycle;
  discountCode?: string;
  discountCodeId?: string;
  discountMonths?: number;
  finalPriceCents: number;
  listPriceCents: number;
  discountAmountCents?: number;
  overridePriceCents?: number;
  grantDays?: number;
}

export interface UserMembership {
  id: string;
  userId: string;
  signupMethod: AuthProvider;
  billingCycle: BillingCycle;
  status: MembershipStatus;
  listPriceCents: number;
  finalPriceCents: number;
  currency: string;
  trialDays: number;
  trialStartedAt?: string;
  trialEndsAt?: string;
  discountCode?: string;
  discountCodeId?: string;
  discountMonths?: number;
  discountAmountCents?: number;
  overridePriceCents?: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  stripeCheckoutSessionId?: string;
  stripeStatus?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email?: string;
  role: UserRole;
  roles: UserRole[];
  authProvider: AuthProvider;
  createdAt: string;
  updatedAt: string;
}

export interface AuthAccountSnapshot {
  profile: UserProfile | null;
  membership: UserMembership | null;
  email: string | null;
}
