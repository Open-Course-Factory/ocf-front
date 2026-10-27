import { useApiErrorCode } from './useApiErrorCode'

/**
 * Reads an admin user-management failure in the reader's language. ocf-core's
 * /admin/users actions answer with a stable code in error_message; known codes
 * are translated, anything else (e.g. DELETE /users/:id's own sentence) is
 * shown as the backend wrote it. Call it in setup; the returned function reads
 * the error.
 */
export function useAdminUserError() {
  const translateCode = useApiErrorCode('adminUserError', {
    en: {
      user_not_found: 'This user no longer exists.',
      invalid_input: 'Some fields are missing or invalid.',
      invalid_email: 'The email address is not valid.',
      password_too_short: 'The password must be at least 8 characters long.',
      create_failed: 'The account could not be created. The username or email may already be in use.',
      lookup_after_create_failed: 'The account was created but could not be loaded back. Refresh the page.',
      admin_role_required: 'Only platform administrators can do this.',
      cannot_revoke_own_admin_role: 'You cannot revoke your own administrator role.',
      cannot_block_own_account: 'You cannot block your own account.',
      send_failed: 'The email could not be sent.',
      grant_failed: 'The administrator role could not be granted.',
      revoke_failed: 'The administrator role could not be revoked.',
      update_failed: 'The account could not be updated.',
      verify_failed: 'The email could not be marked as verified.'
    },
    fr: {
      user_not_found: 'Cet utilisateur n’existe plus.',
      invalid_input: 'Des champs sont manquants ou invalides.',
      invalid_email: 'L’adresse email n’est pas valide.',
      password_too_short: 'Le mot de passe doit contenir au moins 8 caractères.',
      create_failed: 'Le compte n’a pas pu être créé. Le nom d’utilisateur ou l’email est peut-être déjà utilisé.',
      lookup_after_create_failed: 'Le compte a été créé mais n’a pas pu être rechargé. Actualisez la page.',
      admin_role_required: 'Seuls les administrateurs de la plateforme peuvent faire cela.',
      cannot_revoke_own_admin_role: 'Vous ne pouvez pas révoquer votre propre rôle administrateur.',
      cannot_block_own_account: 'Vous ne pouvez pas bloquer votre propre compte.',
      send_failed: 'L’email n’a pas pu être envoyé.',
      grant_failed: 'Le rôle administrateur n’a pas pu être accordé.',
      revoke_failed: 'Le rôle administrateur n’a pas pu être révoqué.',
      update_failed: 'Le compte n’a pas pu être mis à jour.',
      verify_failed: 'L’email n’a pas pu être marqué comme validé.'
    }
  })

  return (err: any, fallback: string): string => {
    const data = err?.response?.data
    return translateCode(err) || data?.error_message || data?.message || fallback
  }
}
