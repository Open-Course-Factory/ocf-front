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

/**
 * The version of the terms a signup is agreeing to.
 *
 * Lives here rather than beside the checkbox because two places need it to
 * agree: the acceptance record stored on the user, and the date the document
 * itself displays. They did not — registrations were being stamped
 * `2025-10-11` while the text had been edited since, so every stored
 * acceptance pointed at a version that no longer described what was agreed.
 *
 * Bump this WHENEVER the terms change in substance. It is an ISO date, so it
 * sorts, and a stored acceptance can be compared against it to find users who
 * agreed to an older text.
 */
export const TOS_VERSION = '2026-08-18'

/**
 * The consumer mediator, mandatory for B2C sales in France (art. L612-1
 * code de la consommation): every professional must let a consumer refer a
 * dispute to one, free of charge, and must publish its identity.
 *
 * Empty until we subscribe to one — the mediation paragraph then renders
 * itself. Deliberately not a placeholder string: a contract that names
 * "[mediator name]" is worse than one that stays silent while the arrangement
 * is being set up, because it reads as an obligation already met.
 */
export const CONSUMER_MEDIATOR = {
  name: '',
  website: '',
  address: '',
} as const
