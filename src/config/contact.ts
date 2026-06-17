/**
 * Single source of truth for the public support/contact email address.
 *
 * Env-backed (like VITE_API_URL) so deployments can override it without a
 * rebuild of the literal; the fallback keeps prod behavior unchanged when
 * VITE_SUPPORT_EMAIL is unset.
 */
export const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || 'contact@labinux.com'
