/** Mirrors ocf-core's minAdminSetPasswordLength — the server refuses anything shorter. */
export const MIN_ADMIN_PASSWORD_LENGTH = 8

/** True once both fields hold something and differ — an untouched form shows no error. */
export function passwordsMismatch(password: string, confirm: string): boolean {
  return password.length > 0 && confirm.length > 0 && password !== confirm
}

/** True when the password is long enough and its confirmation matches it. */
export function passwordConfirmed(password: string, confirm: string): boolean {
  return password.length >= MIN_ADMIN_PASSWORD_LENGTH && password === confirm
}
