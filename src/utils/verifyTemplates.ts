/**
 * Ready-made checks for a step's verify script.
 *
 * ocf-core runs a verify script as root inside the learner's container, with
 * `sh -c` unless it starts with a shebang, no environment and a 10 s timeout
 * (VerificationService.VerifyStep). Exit 0 passes the step; whatever the
 * script prints is shown to the learner. So every snippet here is POSIX sh,
 * only reads (running it twice changes nothing), stays silent on success and
 * prints one learner-facing sentence before `exit 1` on failure. Snippets
 * never `exit 0`: several can follow one another in the same script, and the
 * script passes when none of them failed.
 *
 * Values the author must fill in are `__PLACEHOLDER__` words, assigned once
 * at the top of each snippet; the editor selects the first one on insertion.
 */

export type VerifyTemplateLocale = 'en' | 'fr'

export interface VerifyTemplate {
  key: string
  label: Record<VerifyTemplateLocale, string>
  /** The snippet, its failure message written in `locale`. */
  script: (locale: VerifyTemplateLocale) => string
}

/** `{ echo "<message>"; exit 1; }` in the requested language. */
function fail(locale: VerifyTemplateLocale, messages: Record<VerifyTemplateLocale, string>): string {
  return `{ echo "${messages[locale]}"; exit 1; }`
}

export const VERIFY_TEMPLATES: VerifyTemplate[] = [
  {
    key: 'file-exists',
    label: { en: 'File exists', fr: 'Le fichier existe' },
    script: l => `file='__FILE__'
[ -f "$file" ] || ${fail(l, {
      en: 'The file $file does not exist yet.',
      fr: "Le fichier $file n'existe pas encore."
    })}`
  },
  {
    key: 'file-contains',
    label: { en: 'File contains a text', fr: 'Le fichier contient un texte' },
    script: l => `file='__FILE__'
text='__TEXT__'
grep -qF -- "$text" "$file" 2>/dev/null || ${fail(l, {
      en: 'The file $file does not contain \\"$text\\" yet.',
      fr: 'Le fichier $file ne contient pas encore \\"$text\\".'
    })}`
  },
  {
    key: 'dir-exists',
    label: { en: 'Directory exists', fr: 'Le répertoire existe' },
    script: l => `dir='__DIRECTORY__'
[ -d "$dir" ] || ${fail(l, {
      en: 'The directory $dir does not exist yet.',
      fr: "Le répertoire $dir n'existe pas encore."
    })}`
  },
  {
    key: 'file-mode-owner',
    label: { en: 'File permissions and owner', fr: 'Droits et propriétaire du fichier' },
    script: l => `file='__FILE__'
mode='__MODE__'   # octal, e.g. 640
owner='__OWNER__' # user:group, e.g. alice:staff
[ "$(stat -c %a "$file" 2>/dev/null)" = "$mode" ] || ${fail(l, {
      en: 'The permissions of $file should be $mode.',
      fr: 'Les droits de $file devraient être $mode.'
    })}
[ "$(stat -c %U:%G "$file" 2>/dev/null)" = "$owner" ] || ${fail(l, {
      en: '$file should belong to $owner.',
      fr: '$file devrait appartenir à $owner.'
    })}`
  },
  {
    key: 'user-exists',
    label: { en: 'User exists', fr: "L'utilisateur existe" },
    script: l => `user='__USER__'
id "$user" >/dev/null 2>&1 || ${fail(l, {
      en: 'The user $user does not exist yet.',
      fr: "L'utilisateur $user n'existe pas encore."
    })}`
  },
  {
    key: 'package-installed',
    label: { en: 'Package installed', fr: 'Paquet installé' },
    // One check for every image: Debian/Ubuntu (dpkg), Alpine (apk), RHEL family (rpm).
    script: l => `pkg='__PACKAGE__'
if command -v dpkg-query >/dev/null 2>&1; then
  dpkg-query -W -f='\${Status}' "$pkg" 2>/dev/null | grep -q 'install ok installed'
elif command -v apk >/dev/null 2>&1; then
  apk info -e "$pkg" >/dev/null 2>&1
elif command -v rpm >/dev/null 2>&1; then
  rpm -q "$pkg" >/dev/null 2>&1
else
  false
fi || ${fail(l, {
      en: 'The package $pkg is not installed yet.',
      fr: "Le paquet $pkg n'est pas encore installé."
    })}`
  },
  {
    key: 'service-running',
    label: { en: 'Service running', fr: 'Service démarré' },
    script: l => `# systemd images. Without systemd (Alpine/OpenRC), use instead:
#   rc-service "$service" status >/dev/null 2>&1
service='__SERVICE__'
systemctl is-active --quiet "$service" || ${fail(l, {
      en: 'The service $service is not running.',
      fr: "Le service $service n'est pas démarré."
    })}`
  },
  {
    key: 'service-enabled',
    label: { en: 'Service enabled at boot', fr: 'Service activé au démarrage' },
    script: l => `# systemd images. Without systemd (Alpine/OpenRC), use instead:
#   rc-update show default | grep -qw "$service"
service='__SERVICE__'
systemctl is-enabled --quiet "$service" || ${fail(l, {
      en: 'The service $service is not enabled at boot.',
      fr: "Le service $service n'est pas activé au démarrage."
    })}`
  },
  {
    key: 'process-running',
    label: { en: 'Process running', fr: 'Processus en cours' },
    script: l => `process='__PROCESS__'
pgrep -x "$process" >/dev/null 2>&1 || ${fail(l, {
      en: 'No $process process is running.',
      fr: "Aucun processus $process n'est en cours d'exécution."
    })}`
  },
  {
    key: 'port-listening',
    label: { en: 'Port listening', fr: 'Port en écoute' },
    // ss on current images, netstat (net-tools or busybox) on older ones.
    script: l => `port='__PORT__'
{ ss -ltn 2>/dev/null || netstat -ltn 2>/dev/null; } | grep -q ":$port[[:space:]]" || ${fail(l, {
      en: 'Nothing is listening on port $port.',
      fr: "Rien n'écoute sur le port $port."
    })}`
  },
  {
    key: 'command-run',
    label: { en: 'Command was run', fr: 'La commande a été lancée' },
    // The verify script runs in its own process, not in the learner's shell,
    // and bash writes its history file only when the shell exits. GameShell
    // solves this with a PROMPT_COMMAND that records each line (gameshell-basics
    // step0); `history -a` is the same mechanism with bash's own file.
    script: l => `# Needs bash to write each command as it runs: add this line to the
# scenario's setup script (it must run before the terminal opens):
#   echo "PROMPT_COMMAND='history -a'" >> /etc/bash.bashrc
cmd='__COMMAND__'
cat /root/.bash_history /home/*/.bash_history 2>/dev/null | grep -qF -- "$cmd" || ${fail(l, {
      en: 'You have not run $cmd yet.',
      fr: "Vous n'avez pas encore lancé $cmd."
    })}`
  },
  {
    key: 'output-matches',
    label: { en: "A command's output matches", fr: "La sortie d'une commande correspond" },
    script: l => `# Exact match. For "contains", use: printf '%s' "$actual" | grep -qF -- "$expected"
expected='__EXPECTED_OUTPUT__'
actual=$(__COMMAND__ 2>&1)
[ "$actual" = "$expected" ] || ${fail(l, {
      en: 'The result is not the expected one yet.',
      fr: "Le résultat n'est pas encore celui attendu."
    })}`
  }
]

/** Snippets are written in French for a French scenario, in English otherwise. */
export function templateLocale(scenarioLocale: string | undefined): VerifyTemplateLocale {
  return scenarioLocale?.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

const PLACEHOLDER = /__[A-Z_]+__/

/**
 * `snippet` inserted into `script` as a paragraph of its own, after the
 * paragraph holding `cursor`, and the range of its first placeholder for the
 * editor to select.
 *
 * After the paragraph, not at the caret: the caret usually sits inside the
 * check the author just filled in, and splitting it would break both. A
 * cursor at 0 appends: that is where an unfocused textarea reports its caret,
 * and a check placed above a shebang would break the script.
 */
export function insertSnippet(script: string, cursor: number, snippet: string) {
  const paragraphEnd = script.indexOf('\n\n', cursor)
  const at = cursor <= 0 || paragraphEnd === -1 ? script.length : paragraphEnd
  const before = script.slice(0, at).replace(/\n+$/, '')
  const after = script.slice(at).replace(/^\n+/, '')
  const start = before ? before.length + 2 : 0
  const text = [before, snippet, after].filter(Boolean).join('\n\n') + (after ? '' : '\n')
  const match = PLACEHOLDER.exec(snippet)
  const selection = match
    ? { start: start + match.index, end: start + match.index + match[0].length }
    : { start: start + snippet.length, end: start + snippet.length }
  return { text, selection }
}
