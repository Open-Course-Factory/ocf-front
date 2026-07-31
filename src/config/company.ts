/**
 * Single source of truth for the legal entity operating OCF.
 *
 * Same rationale as SUPPORT_EMAIL in ./contact: these values appear on the
 * mentions légales, the privacy policy and (via Stripe) on every invoice, and
 * a company identity that disagrees with itself across pages is a compliance
 * problem, not a cosmetic one. The previous state is the cautionary tale — the
 * legal pages named Solution Libre as éditeur while the contact address was
 * already contact@labinux.com.
 *
 * Registry data (SIREN 102 993 524), not free text: changing any of it means
 * the registry changed.
 */
export const COMPANY = {
  name: 'Labinux',
  legalForm: 'SAS',
  capital: '2 000 €',
  siret: '102 993 524 00010',
  rcs: 'Toulouse 102 993 524',
  vatNumber: 'FR82102993524',
  address: 'Bureau 3, 5 impasse de la Colombette, 31000 Toulouse',
  publicationDirector: 'Thomas Saquet',
  /** Env-backed like SUPPORT_EMAIL so a deployment can point elsewhere without a rebuild. */
  website: import.meta.env.VITE_COMPANY_WEBSITE || 'https://labinux.com',
} as const

/** Hosting provider, named separately because LCEN requires the host's own identity. */
export const HOSTING_PROVIDER = {
  name: 'SCALEWAY SAS',
  address: 'BP 438, 75366 Paris CEDEX 08, France',
  phone: '+33 1 84 13 00 00',
} as const
