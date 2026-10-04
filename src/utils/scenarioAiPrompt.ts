/**
 * Prompts for authoring a scenario with the teacher's own AI assistant.
 *
 * No model runs on our side: the teacher copies a prompt into whatever chat
 * assistant they use, and pastes its answer back. The answer is imported as is
 * through import-json, so everything the assistant needs to produce a file the
 * importer accepts first time has to be in the prompt — the shape, the
 * encodings the validator insists on, and how the platform runs each script.
 *
 * The contract below mirrors ocf-core's SeedScenarioInput
 * (src/scenarios/dto/scenarioCustomDto.go) and the import validator
 * (src/scenarios/services/scenarioContentValidation.go). A change to either
 * must be made here too, or assistants will keep writing files the server
 * refuses. The validator's refusals are pasted back to the assistant verbatim
 * (buildFixPrompt), so a drift costs a round trip rather than a broken
 * scenario.
 *
 * The instructions exist in French and in English (PROMPT_TEXT), chosen
 * separately from the language of the scenario's content.
 */

export type ScenarioAiStepType = 'terminal' | 'flag' | 'quiz' | 'info'
export type ScenarioAiLevel = 'beginner' | 'intermediate' | 'advanced'
export type ScenarioAiLanguage = 'fr' | 'en'

export const SCENARIO_AI_STEP_TYPES: ScenarioAiStepType[] = ['terminal', 'flag', 'quiz', 'info']

// Effect names accepted by ocf-banner in the container, for the step editor
// and the prompt alike. Kept in step with the tool rather than invented here:
// an unknown name draws nothing, and the failure is silent from the trainer's
// side.
export const BANNER_EFFECTS = ['decrypt', 'slide', 'unstable', 'fireworks', 'burn', 'rings', 'beams', 'matrix', 'rain'] as const

/**
 * What the platform can run, as GET /terminals/distributions, /terminals/sizes
 * and /terminals/catalog-features report it. An empty list means it could not
 * be read, and the prompt falls back to safe defaults for that part.
 */
export interface ScenarioAiCatalog {
  distributions: Array<{ name: string; description?: string; os_type?: string; min_size_key?: string; supported_features?: string[] }>
  sizes: Array<{ key: string; name?: string; memory?: string; disk?: string }>
  features?: Array<{ key: string; name?: string; description?: string; min_size_key?: string; always_available?: boolean }>
}

/** What the platform offers that the prompt should advertise. */
export interface PromptOptions {
  // Step banners (intro/outro effects), behind the scenario_step_effects flag.
  effects?: boolean
}

export interface ScenarioAiBrief {
  description: string
  language: ScenarioAiLanguage
  level: ScenarioAiLevel
  stepCount: number
  stepTypes: ScenarioAiStepType[]
}

/**
 * The words of every prompt, in each language the instructions can be given
 * in. The two tables say the same things in the same order: only the prose is
 * translated. Field names, enum values, variable names and code stay
 * identical, because they are what the importer reads — the unit tests compare
 * the two tables on exactly those tokens.
 */
interface PromptText {
  languageNames: Record<ScenarioAiLanguage, string>
  // `effects`: whether step banners are offered (the scenario_step_effects
  // flag). Off, the fields are not advertised; the importer still accepts them.
  contract: (effects: boolean) => string
  rules: string
  createRole: string
  improveRole: string
  labHeading: string
  labLines: (language: string, code: ScenarioAiLanguage, level: ScenarioAiLevel, stepCount: number, types: string) => string
  changeHeading: string
  changeRules: string
  catalogHeading: string
  distributions: string
  noDistributions: string
  sizes: string
  noSizes: string
  features: string
  noFeatures: string
  minimumSize: (key: string) => string
  featuresWord: string
  worksEverywhere: string
  ram: string
  disk: string
  exampleHeading: string
  currentHeading: string
  answerHeading: string
  createAnswer: string
  improveAnswer: string
  answerFormat: string
  fixIntro: string
  fixOutro: string
}

const EN: PromptText = {
  languageNames: { fr: 'French', en: 'English' },
  contract: effects => `## The JSON format

Answer with ONE JSON object. Every field not marked required may be left out.

Scenario fields:
- "title" (required, string): the scenario's name. It also identifies the scenario: importing a file with the same title again updates that scenario instead of creating a new one.
- "description" (string): one or two sentences for the catalogue card.
- "difficulty": "beginner", "intermediate" or "advanced".
- "estimated_time_minutes" (integer).
- "instance_type" (string): the machine SIZE key, e.g. "S" or "M" — not an operating system.
- "compatible_instance_types" (array of strings): the distribution names this scenario is written for, most preferred first.
- "os_type" (string): "deb" for Debian/Ubuntu, "alpine" for Alpine. Must match the distribution.
- "hostname" (string): the terminal's host name, lowercase letters, digits and hyphens only.
- "required_features" (array of strings): session features the scenario cannot run without, e.g. ["network"] when a script installs packages or downloads anything. Without "network" the container has NO network at all.
- "build_features" (array of strings): features held only while the container is being prepared, then removed — e.g. ["network"] to install packages in setup_script while the learner works offline.
- "flags_enabled" (boolean): true when the scenario has flag steps.
- "crash_traps" (boolean): leave false.
- "port_exposure_allowed" (boolean): true only if the learner must publish a web port.
- "session_user" (integer uid): leave out — the learner is then root. Set it (e.g. 1000) only when the lesson is about permissions, and create that user in setup_script.
- "intro_text" (markdown): shown before step 1.
- "finish_text" (markdown): shown after the last step.
- "setup_script" (bash): runs once as root when the container is created, before step 1.
- "objectives" (markdown list), "prerequisites" (markdown list): shown on the catalogue card.
- "default_locale" (string): the language every text field above is written in, e.g. "fr" or "en".
- "locales" (array of strings): every language the scenario is offered in, default_locale included.
- "translations" (array): the scenario's own text in other languages: [{"locale", "title", "description", "objectives", "prerequisites", "intro_text", "finish_text"}]. At most one entry per locale.
- "lexicon": an advanced vocabulary table. Never add one; keep it unchanged when the scenario already has it.
- "steps" (required, array, at least one): the steps, in the order the learner plays them. Do not number them.

Step fields:
- "title" (required, string).
- "step_type" (required): "terminal", "flag", "quiz" or "info".
- "text_content" (markdown): the instructions. A fenced code block whose closing fence is written \`\`\`{{exec}} becomes a block the learner clicks to run it in the terminal; \`\`\`{{copy}} makes it click-to-copy. Inline \`command\`{{exec}} works too.
- "hint_content" (markdown): progressive hints, revealed one by one. Write two or more, each under its own heading "### Hint 1", "### Hint 2", … (in French, "### Indice 1", …). The first nudges, the last nearly gives the answer.
- "verify_script" (bash): terminal steps only. See the rules below.
- "background_script" (bash): runs as root when the learner reaches the step, before they see it. Prepares that step's situation.
- "background_timeout_seconds" (integer): leave out unless a background script needs more than a minute.
- "foreground_script": leave out. It is typed into the learner's live shell.
${effects ? `- "intro_effect", "outro_effect": leave out unless asked; otherwise one of ${BANNER_EFFECTS.join(', ')}. "intro_text", "outro_text": the banner's words (max 500 characters).
` : ''}- "show_immediate_feedback" (boolean): quiz steps — true shows right/wrong after each answer.
- "flag_path" (string): flag steps only. See the flag rules below.
- "questions" (array): quiz steps only, at least one. See the quiz rules below.
- "translations" (array): this step's text in other languages: [{"locale", "title", "text_content", "hint_content"${effects ? ', "intro_text", "outro_text"' : ''}}]. At most one entry per locale. Scripts are never translated.

Never include ids, "order" on steps, an organization, "is_public" or any flag value.`,
  rules: `## How the platform runs a scenario

The learner gets ONE Linux container (an LXC system container) and a root shell in it. There is no second machine: to teach something with several machines, run Docker inside the container (size "M" or larger, network required, and the setup script installs Docker).

### Terminal steps
- The learner clicks Verify. The verify_script then runs as root in the container, with a 10-second limit. Exit code 0 means the step is passed; anything else means "not yet".
- Check the RESULT, never the command typed: test that the file exists with the right content, the service is active, the user exists, the port answers. Never read shell history.
- Make it idempotent and read-only: running it ten times must change nothing in the container.
- On failure, print ONE short line to stderr telling the learner what is still missing (it is shown to them), in the content language. Example: \`[ -d /srv/app ] || { echo "The directory /srv/app does not exist yet." >&2; exit 1; }\`
- Start each script with #!/bin/bash and use \`set -u\`, not \`set -e\`, in verify scripts.
- A terminal step with no verify_script is passed by clicking Verify: use that only for "try this" steps.

### Flag steps (step_type "flag")
- The platform generates a secret flag per learner and per step. The learner must find it in the container and paste it.
- Either set "flag_path" to an absolute path under /tmp/, /home/, /var/ or /opt/: the platform writes the flag there (one line) when the step starts — the step's text then explains how to find or read it (e.g. it is in a file only a certain user can read).
- Or leave flag_path out and place it yourself in the step's background_script, which receives the flag in the environment variable OCF_FLAG_CURRENT. Read it, unset it immediately, then hide it: \`FLAG="$OCF_FLAG_CURRENT"; unset OCF_FLAG_CURRENT; echo "$FLAG" > /var/lib/app/secret.txt\`. Never leave it in a running process's environment.
- A background script may instead decide the answer itself by printing a line "OCF_ANSWER: <answer>" — use that when the answer is something the learner must compute (e.g. "how many lines contain ERROR?" after generating a random log).
- Flag steps have no verify_script. Set "flags_enabled": true on the scenario.

### Quiz steps (step_type "quiz")
- Each question: {"order": 1, "question_text": "...", "question_type": "...", "options": "...", "correct_answer": "...", "explanation": "...", "points": 1}.
- "options" is a JSON array of strings ENCODED AS A STRING: "options": "[\\"ls\\", \\"cd\\", \\"pwd\\"]". At least 2 options.
- "multiple_choice": one right option; correct_answer is its 0-based index as a string: "0", "1", …
- "multi_answer": several right options; correct_answer is the sorted index array without spaces, as a string: "[0,2]".
- "true_false": no options; correct_answer is "true" or "false".
- "free_text": no options; correct_answer is the exact expected text, kept short (one word or one command).
- "explanation" says why the answer is right; it is shown after answering.

### Info steps (step_type "info")
- Text only, nothing to verify. Use them sparingly, for context between practical steps.

### General
- Keep the learner's container usable: never break the shell, sudo, networking or the package manager unless that IS the exercise, and never reboot or kill PID 1.
- The distribution images are minimal: do not assume python3, curl, nginx or any other tool is installed. Install what the lab needs in setup_script, with "network" in build_features (or in required_features if the learner needs the network too).
- Scripts run non-interactively: use apt-get -y, no prompts, no editors.
- Each step's background_script must work on its own: it may run on a fresh container where earlier steps were skipped, so create whatever it needs rather than assuming the learner did it.
- Write every text field (titles, text_content, hints, explanations, verify messages, intro and finish) in the content language. JSON keys and code stay in English.`,
  createRole: 'You are an expert Linux trainer writing a hands-on lab for the Open Course Factory platform. The lab is imported as a JSON file, which the platform checks strictly: follow the format and rules below exactly.',
  improveRole: 'You are an expert Linux trainer improving a hands-on lab for the Open Course Factory platform. The lab is a JSON file, which the platform checks strictly when it is imported back: follow the format and rules below exactly.',
  labHeading: '## The lab to write',
  labLines: (language, code, level, stepCount, types) => `- Content language: ${language}. Write every title, text, hint, question, explanation and verify message in ${language}; set "default_locale": "${code}" and "locales": ["${code}"].
- Level: ${level} (set "difficulty": "${level}").
- About ${stepCount} steps, using these step types: ${types}.`,
  changeHeading: '## What to change',
  changeRules: 'Keep everything the request does not ask you to change exactly as it is, including scripts and fields you do not understand. Do NOT change "title": it identifies the scenario, and a new title would create a separate copy. To translate, add a "translations" entry (and the locale to "locales") instead of rewriting the original text.',
  catalogHeading: '## What this platform can run',
  distributions: 'Distributions (use these exact names in compatible_instance_types):',
  noDistributions: 'The distribution list is not available: leave compatible_instance_types out and use os_type "deb" (Debian).',
  sizes: 'Sizes (use the key in instance_type; pick the smallest that fits):',
  noSizes: 'The size list is not available: use instance_type "S", or "M" for anything that runs Docker.',
  features: 'Features (use these exact keys in required_features and build_features; a feature with a minimum size needs instance_type at least that size, and a distribution offers only the features listed for it unless the feature works everywhere):',
  noFeatures: 'The feature list is not available: the only feature to rely on is "network".',
  minimumSize: key => `minimum size "${key}"`,
  featuresWord: 'features',
  worksEverywhere: 'works on every distribution',
  ram: 'RAM',
  disk: 'disk',
  exampleHeading: '## A complete example of a valid answer',
  currentHeading: '## The current scenario',
  answerHeading: '## Your answer',
  createAnswer: 'Before answering, check every verify script against the rules (exit 0 on success, checks results, idempotent) and every quiz answer against its options.',
  improveAnswer: 'Return the FULL updated scenario — every step, not only the changed ones.',
  answerFormat: 'Answer with the JSON object only, in a single ```json code block, with no text before or after it.',
  fixIntro: 'The platform refused your JSON with these problems:',
  fixOutro: 'Fix every one of them and change nothing else. Answer with the full corrected JSON.'
}

const FR: PromptText = {
  languageNames: { fr: 'français', en: 'anglais' },
  contract: effects => `## Le format JSON

Répondez avec UN SEUL objet JSON. Tout champ qui n'est pas marqué obligatoire peut être omis.

Champs du scénario :
- "title" (obligatoire, chaîne) : le nom du scénario. Il sert aussi à l'identifier : importer à nouveau un fichier portant le même titre met ce scénario à jour au lieu d'en créer un nouveau.
- "description" (chaîne) : une ou deux phrases pour la fiche du catalogue.
- "difficulty" : "beginner", "intermediate" ou "advanced".
- "estimated_time_minutes" (entier).
- "instance_type" (chaîne) : la clé de TAILLE de la machine, par exemple "S" ou "M" — pas un système d'exploitation.
- "compatible_instance_types" (tableau de chaînes) : les noms des distributions pour lesquelles le scénario est écrit, de la préférée à la moins préférée.
- "os_type" (chaîne) : "deb" pour Debian/Ubuntu, "alpine" pour Alpine. Doit correspondre à la distribution.
- "hostname" (chaîne) : le nom d'hôte du terminal, en minuscules, chiffres et tirets uniquement.
- "required_features" (tableau de chaînes) : les fonctionnalités de session sans lesquelles le scénario ne peut pas fonctionner, par exemple ["network"] dès qu'un script installe des paquets ou télécharge quoi que ce soit. Sans "network", le conteneur n'a AUCUN accès réseau.
- "build_features" (tableau de chaînes) : des fonctionnalités accordées uniquement pendant la préparation du conteneur, puis retirées — par exemple ["network"] pour installer des paquets dans setup_script alors que l'apprenant travaille hors ligne.
- "flags_enabled" (booléen) : true si le scénario comporte des étapes à drapeau.
- "crash_traps" (booléen) : laissez false.
- "port_exposure_allowed" (booléen) : true uniquement si l'apprenant doit publier un port web.
- "session_user" (uid entier) : à omettre — l'apprenant est alors root. Ne le renseignez (par exemple 1000) que si la leçon porte sur les permissions, et créez cet utilisateur dans setup_script.
- "intro_text" (markdown) : affiché avant l'étape 1.
- "finish_text" (markdown) : affiché après la dernière étape.
- "setup_script" (bash) : s'exécute une seule fois en root à la création du conteneur, avant l'étape 1.
- "objectives" (liste markdown), "prerequisites" (liste markdown) : affichés sur la fiche du catalogue.
- "default_locale" (chaîne) : la langue dans laquelle sont rédigés tous les champs texte ci-dessus, par exemple "fr" ou "en".
- "locales" (tableau de chaînes) : toutes les langues dans lesquelles le scénario est proposé, default_locale comprise.
- "translations" (tableau) : les textes du scénario dans d'autres langues : [{"locale", "title", "description", "objectives", "prerequisites", "intro_text", "finish_text"}]. Une entrée au plus par langue.
- "lexicon" : une table de vocabulaire avancée. N'en ajoutez jamais ; laissez-la telle quelle si le scénario en a déjà une.
- "steps" (obligatoire, tableau, au moins une) : les étapes, dans l'ordre où l'apprenant les joue. Ne les numérotez pas.

Champs d'une étape :
- "title" (obligatoire, chaîne).
- "step_type" (obligatoire) : "terminal", "flag", "quiz" ou "info".
- "text_content" (markdown) : la consigne. Un bloc de code dont la clôture s'écrit \`\`\`{{exec}} devient un bloc que l'apprenant clique pour l'exécuter dans le terminal ; \`\`\`{{copy}} le rend copiable d'un clic. \`commande\`{{exec}} fonctionne aussi en ligne.
- "hint_content" (markdown) : des indices progressifs, révélés un par un. Écrivez-en au moins deux, chacun sous son propre titre "### Indice 1", "### Indice 2", … (en anglais, "### Hint 1", …). Le premier met sur la voie, le dernier donne presque la réponse.
- "verify_script" (bash) : étapes terminal uniquement. Voir les règles ci-dessous.
- "background_script" (bash) : s'exécute en root quand l'apprenant arrive à l'étape, avant qu'il ne la voie. Prépare la situation de l'étape.
- "background_timeout_seconds" (entier) : à omettre, sauf si un script d'arrière-plan a besoin de plus d'une minute.
- "foreground_script" : à omettre. Il est tapé dans le shell de l'apprenant.
${effects ? `- "intro_effect", "outro_effect" : à omettre sauf demande ; sinon l'une des valeurs ${BANNER_EFFECTS.join(', ')}. "intro_text", "outro_text" : le texte de la bannière (500 caractères au plus).
` : ''}- "show_immediate_feedback" (booléen) : étapes quiz — true indique juste/faux après chaque réponse.
- "flag_path" (chaîne) : étapes à drapeau uniquement. Voir les règles des drapeaux ci-dessous.
- "questions" (tableau) : étapes quiz uniquement, au moins une. Voir les règles des quiz ci-dessous.
- "translations" (tableau) : les textes de l'étape dans d'autres langues : [{"locale", "title", "text_content", "hint_content"${effects ? ', "intro_text", "outro_text"' : ''}}]. Une entrée au plus par langue. Les scripts ne se traduisent jamais.

N'incluez jamais d'identifiants, d'"order" sur les étapes, d'organisation, d'"is_public" ni aucune valeur de drapeau.`,
  rules: `## Comment la plateforme exécute un scénario

L'apprenant dispose d'UN SEUL conteneur Linux (un conteneur système LXC) et d'un shell root dans celui-ci. Il n'y a pas de deuxième machine : pour enseigner quelque chose qui demande plusieurs machines, faites tourner Docker dans le conteneur (taille "M" ou plus, réseau requis, et Docker installé par le script de préparation).

### Étapes terminal
- L'apprenant clique sur Vérifier. Le verify_script s'exécute alors en root dans le conteneur, avec une limite de 10 secondes. Le code de sortie 0 signifie que l'étape est réussie ; tout autre code signifie « pas encore ».
- Vérifiez le RÉSULTAT, jamais la commande tapée : testez que le fichier existe avec le bon contenu, que le service est actif, que l'utilisateur existe, que le port répond. Ne lisez jamais l'historique du shell.
- Rendez-le idempotent et en lecture seule : l'exécuter dix fois ne doit rien changer dans le conteneur.
- En cas d'échec, affichez sur stderr UNE ligne courte qui dit à l'apprenant ce qui manque encore (elle lui est montrée), dans la langue du contenu. Exemple : \`[ -d /srv/app ] || { echo "Le répertoire /srv/app n'existe pas encore." >&2; exit 1; }\`
- Commencez chaque script par #!/bin/bash et utilisez \`set -u\`, pas \`set -e\`, dans les scripts de vérification.
- Une étape terminal sans verify_script est validée d'un simple clic sur Vérifier : réservez cela aux étapes « essayez ceci ».

### Étapes à drapeau (step_type "flag")
- La plateforme génère un drapeau secret par apprenant et par étape. L'apprenant doit le trouver dans le conteneur et le coller.
- Soit vous renseignez "flag_path" avec un chemin absolu sous /tmp/, /home/, /var/ ou /opt/ : la plateforme y écrit le drapeau (une ligne) au début de l'étape — le texte de l'étape explique alors comment le trouver ou le lire (par exemple, il se trouve dans un fichier que seul un certain utilisateur peut lire).
- Soit vous omettez flag_path et le placez vous-même dans le background_script de l'étape, qui reçoit le drapeau dans la variable d'environnement OCF_FLAG_CURRENT. Lisez-la, supprimez-la aussitôt, puis cachez le drapeau : \`FLAG="$OCF_FLAG_CURRENT"; unset OCF_FLAG_CURRENT; echo "$FLAG" > /var/lib/app/secret.txt\`. Ne le laissez jamais dans l'environnement d'un processus en cours d'exécution.
- Un script d'arrière-plan peut aussi fixer lui-même la réponse en affichant une ligne "OCF_ANSWER: <réponse>" — à utiliser quand la réponse est quelque chose que l'apprenant doit calculer (par exemple « combien de lignes contiennent ERROR ? » après avoir généré un journal aléatoire).
- Les étapes à drapeau n'ont pas de verify_script. Mettez "flags_enabled": true sur le scénario.

### Étapes quiz (step_type "quiz")
- Chaque question : {"order": 1, "question_text": "...", "question_type": "...", "options": "...", "correct_answer": "...", "explanation": "...", "points": 1}.
- "options" est un tableau JSON de chaînes ENCODÉ DANS UNE CHAÎNE : "options": "[\\"ls\\", \\"cd\\", \\"pwd\\"]". Au moins 2 options.
- "multiple_choice" : une seule bonne option ; correct_answer est son index à partir de 0, sous forme de chaîne : "0", "1", …
- "multi_answer" : plusieurs bonnes options ; correct_answer est le tableau des index triés, sans espaces, sous forme de chaîne : "[0,2]".
- "true_false" : pas d'options ; correct_answer vaut "true" ou "false".
- "free_text" : pas d'options ; correct_answer est le texte exact attendu, court (un mot ou une commande).
- "explanation" explique pourquoi la réponse est juste ; elle s'affiche après la réponse.

### Étapes d'information (step_type "info")
- Du texte seul, rien à vérifier. À utiliser avec parcimonie, pour donner du contexte entre deux étapes pratiques.

### Règles générales
- Le conteneur de l'apprenant doit rester utilisable : ne cassez jamais le shell, sudo, le réseau ou le gestionnaire de paquets, sauf si c'est précisément l'exercice, et ne redémarrez jamais la machine ni ne tuez le PID 1.
- Les images des distributions sont minimales : ne supposez pas que python3, curl, nginx ou tout autre outil est installé. Installez ce dont le TP a besoin dans setup_script, avec "network" dans build_features (ou dans required_features si l'apprenant a aussi besoin du réseau).
- Les scripts s'exécutent sans interaction : utilisez apt-get -y, aucune question, aucun éditeur.
- Le background_script de chaque étape doit fonctionner seul : il peut s'exécuter sur un conteneur neuf où les étapes précédentes ont été sautées, donc créez tout ce dont il a besoin au lieu de supposer que l'apprenant l'a fait.
- Rédigez chaque champ texte (titres, text_content, indices, explications, messages de vérification, introduction et conclusion) dans la langue du contenu. Les clés JSON et le code restent en anglais.`,
  createRole: "Vous êtes un formateur Linux expert et vous rédigez un TP pratique pour la plateforme Open Course Factory. Le TP est importé sous forme de fichier JSON, que la plateforme contrôle strictement : suivez exactement le format et les règles ci-dessous.",
  improveRole: "Vous êtes un formateur Linux expert et vous améliorez un TP pratique pour la plateforme Open Course Factory. Le TP est un fichier JSON, que la plateforme contrôle strictement lorsqu'il est réimporté : suivez exactement le format et les règles ci-dessous.",
  labHeading: '## Le TP à rédiger',
  labLines: (language, code, level, stepCount, types) => `- Langue du contenu : ${language}. Rédigez chaque titre, texte, indice, question, explication et message de vérification en ${language} ; mettez "default_locale": "${code}" et "locales": ["${code}"].
- Niveau : ${level} (mettez "difficulty": "${level}").
- Environ ${stepCount} étapes, avec ces types d'étapes : ${types}.`,
  changeHeading: '## Ce qu\'il faut modifier',
  changeRules: 'Conservez à l\'identique tout ce que la demande ne vous demande pas de modifier, y compris les scripts et les champs que vous ne comprenez pas. Ne modifiez PAS "title" : il identifie le scénario, et un nouveau titre créerait une copie séparée. Pour traduire, ajoutez une entrée dans "translations" (et la langue dans "locales") au lieu de réécrire le texte d\'origine.',
  catalogHeading: '## Ce que cette plateforme peut exécuter',
  distributions: 'Distributions (utilisez exactement ces noms dans compatible_instance_types) :',
  noDistributions: 'La liste des distributions n\'est pas disponible : omettez compatible_instance_types et utilisez os_type "deb" (Debian).',
  sizes: 'Tailles (mettez la clé dans instance_type ; choisissez la plus petite qui suffit) :',
  noSizes: 'La liste des tailles n\'est pas disponible : utilisez instance_type "S", ou "M" pour tout ce qui fait tourner Docker.',
  features: 'Fonctionnalités (utilisez exactement ces clés dans required_features et build_features ; une fonctionnalité qui a une taille minimale exige un instance_type au moins de cette taille, et une distribution ne propose que les fonctionnalités indiquées pour elle, sauf celles qui fonctionnent partout) :',
  noFeatures: 'La liste des fonctionnalités n\'est pas disponible : la seule sur laquelle compter est "network".',
  minimumSize: key => `taille minimale "${key}"`,
  featuresWord: 'fonctionnalités',
  worksEverywhere: 'fonctionne sur toutes les distributions',
  ram: 'de RAM',
  disk: 'de disque',
  exampleHeading: '## Un exemple complet de réponse valide',
  currentHeading: '## Le scénario actuel',
  answerHeading: '## Votre réponse',
  createAnswer: 'Avant de répondre, vérifiez chaque script de vérification au regard des règles (exit 0 en cas de réussite, contrôle des résultats, idempotence) et chaque réponse de quiz au regard de ses options.',
  improveAnswer: 'Renvoyez le scénario COMPLET mis à jour — toutes les étapes, pas seulement celles qui ont changé.',
  answerFormat: 'Répondez uniquement avec l\'objet JSON, dans un seul bloc de code ```json, sans aucun texte avant ni après.',
  fixIntro: 'La plateforme a refusé votre JSON pour les raisons suivantes :',
  fixOutro: 'Corrigez chacun de ces problèmes sans rien modifier d\'autre. Répondez avec le JSON complet corrigé.'
}

const PROMPT_TEXT: Record<ScenarioAiLanguage, PromptText> = { en: EN, fr: FR }

/**
 * A complete small scenario the importer accepts, shown to the assistant as
 * the model answer, in each content language. One step of each kind that
 * needs encoding care: a terminal step with a verify script, a quiz with both
 * answer encodings, and a flag step that places its own flag. Both have the
 * same shape and the same encodings; only the learner-facing text differs.
 */
export const EXAMPLE_SCENARIOS = {
  en: {
    title: 'Files and permissions: first steps',
    description: 'Create a directory, read a protected file and check what you learned.',
    difficulty: 'beginner',
    estimated_time_minutes: 15,
    instance_type: 'S',
    os_type: 'deb',
    hostname: 'lab',
    flags_enabled: true,
    crash_traps: false,
    default_locale: 'en',
    locales: ['en'],
    objectives: '- Create directories and files\n- Read file permissions',
    prerequisites: '- Open a terminal',
    intro_text: 'You are root on a fresh Debian machine called **lab**.',
    finish_text: 'Well done: you can now create files and read permissions.',
    steps: [
      {
        title: 'Create a project directory',
        step_type: 'terminal',
        text_content: 'Create the directory `/srv/project` and, inside it, a file `README` containing the word `hello`.\n\n```\nmkdir -p /srv/project\necho hello > /srv/project/README\n```{{exec}}',
        hint_content: '### Hint 1\nThe `mkdir` command creates directories; `-p` creates the parents too.\n\n### Hint 2\n`echo hello > /srv/project/README` writes the file.',
        verify_script: '#!/bin/bash\nset -u\n[ -d /srv/project ] || { echo "The directory /srv/project does not exist yet." >&2; exit 1; }\ngrep -qx hello /srv/project/README 2>/dev/null || { echo "/srv/project/README must contain the word hello." >&2; exit 1; }\nexit 0'
      },
      {
        title: 'Permissions quiz',
        step_type: 'quiz',
        show_immediate_feedback: true,
        text_content: 'Answer these questions about `ls -l` output.',
        questions: [
          {
            order: 1,
            question_text: 'In `-rw-r----- 1 root adm`, who may read the file?',
            question_type: 'multi_answer',
            options: '["root", "members of adm", "everyone"]',
            correct_answer: '[0,1]',
            explanation: 'The owner (root) has rw-, the group (adm) has r--, others have ---.',
            points: 1
          },
          {
            order: 2,
            question_text: 'Which command changes a file\'s permissions?',
            question_type: 'multiple_choice',
            options: '["chown", "chmod", "umask"]',
            correct_answer: '1',
            explanation: 'chmod changes the mode; chown changes the owner.',
            points: 1
          }
        ]
      },
      {
        title: 'Find the hidden flag',
        step_type: 'flag',
        text_content: 'A flag is hidden in a dot-file somewhere under `/opt/vault`. Find it, read it, and paste it below.',
        hint_content: '### Hint 1\n`ls` hides files whose name starts with a dot.\n\n### Hint 2\n`ls -la /opt/vault` shows them; then `cat` the file.',
        background_script: '#!/bin/bash\nFLAG="$OCF_FLAG_CURRENT"\nunset OCF_FLAG_CURRENT\nmkdir -p /opt/vault\necho "$FLAG" > /opt/vault/.secret\nchmod 600 /opt/vault/.secret'
      }
    ]
  },
  fr: {
    title: 'Fichiers et permissions : premiers pas',
    description: 'Créez un répertoire, lisez un fichier protégé et vérifiez ce que vous avez appris.',
    difficulty: 'beginner',
    estimated_time_minutes: 15,
    instance_type: 'S',
    os_type: 'deb',
    hostname: 'lab',
    flags_enabled: true,
    crash_traps: false,
    default_locale: 'fr',
    locales: ['fr'],
    objectives: '- Créer des répertoires et des fichiers\n- Lire les permissions d\'un fichier',
    prerequisites: '- Savoir ouvrir un terminal',
    intro_text: 'Vous êtes root sur une machine Debian toute neuve nommée **lab**.',
    finish_text: 'Bravo : vous savez maintenant créer des fichiers et lire des permissions.',
    steps: [
      {
        title: 'Créer un répertoire de projet',
        step_type: 'terminal',
        text_content: 'Créez le répertoire `/srv/project` et, à l\'intérieur, un fichier `README` contenant le mot `hello`.\n\n```\nmkdir -p /srv/project\necho hello > /srv/project/README\n```{{exec}}',
        hint_content: '### Indice 1\nLa commande `mkdir` crée des répertoires ; `-p` crée aussi les répertoires parents.\n\n### Indice 2\n`echo hello > /srv/project/README` écrit le fichier.',
        verify_script: '#!/bin/bash\nset -u\n[ -d /srv/project ] || { echo "Le répertoire /srv/project n\'existe pas encore." >&2; exit 1; }\ngrep -qx hello /srv/project/README 2>/dev/null || { echo "/srv/project/README doit contenir le mot hello." >&2; exit 1; }\nexit 0'
      },
      {
        title: 'Quiz sur les permissions',
        step_type: 'quiz',
        show_immediate_feedback: true,
        text_content: 'Répondez à ces questions sur la sortie de `ls -l`.',
        questions: [
          {
            order: 1,
            question_text: 'Avec `-rw-r----- 1 root adm`, qui peut lire le fichier ?',
            question_type: 'multi_answer',
            options: '["root", "les membres de adm", "tout le monde"]',
            correct_answer: '[0,1]',
            explanation: 'Le propriétaire (root) a rw-, le groupe (adm) a r--, les autres ont ---.',
            points: 1
          },
          {
            order: 2,
            question_text: 'Quelle commande modifie les permissions d\'un fichier ?',
            question_type: 'multiple_choice',
            options: '["chown", "chmod", "umask"]',
            correct_answer: '1',
            explanation: 'chmod modifie les droits ; chown modifie le propriétaire.',
            points: 1
          }
        ]
      },
      {
        title: 'Trouver le drapeau caché',
        step_type: 'flag',
        text_content: 'Un drapeau est caché dans un fichier dont le nom commence par un point, quelque part sous `/opt/vault`. Trouvez-le, lisez-le et collez-le ci-dessous.',
        hint_content: '### Indice 1\n`ls` masque les fichiers dont le nom commence par un point.\n\n### Indice 2\n`ls -la /opt/vault` les affiche ; il ne reste qu\'à faire `cat` sur le fichier.',
        background_script: '#!/bin/bash\nFLAG="$OCF_FLAG_CURRENT"\nunset OCF_FLAG_CURRENT\nmkdir -p /opt/vault\necho "$FLAG" > /opt/vault/.secret\nchmod 600 /opt/vault/.secret'
      }
    ]
  }
}

/** The English example, as the end-to-end spec imports it. */
export const EXAMPLE_SCENARIO = EXAMPLE_SCENARIOS.en

function catalogSection(text: PromptText, catalog?: ScenarioAiCatalog | null): string {
  const lines = [text.catalogHeading]
  if (catalog?.distributions.length) {
    lines.push(text.distributions)
    for (const d of catalog.distributions) {
      const extras = [
        d.os_type && `os_type "${d.os_type}"`,
        d.min_size_key && text.minimumSize(d.min_size_key),
        d.supported_features?.length && `${text.featuresWord}: ${d.supported_features.join(', ')}`
      ].filter(Boolean).join('; ')
      lines.push(`- "${d.name}"${d.description ? ` — ${d.description}` : ''}${extras ? ` (${extras})` : ''}`)
    }
  } else {
    lines.push(text.noDistributions)
  }
  if (catalog?.sizes.length) {
    lines.push(text.sizes)
    for (const s of catalog.sizes) {
      const specs = [s.memory && `${s.memory} ${text.ram}`, s.disk && `${s.disk} ${text.disk}`].filter(Boolean).join(', ')
      lines.push(`- "${s.key}"${s.name ? ` ${s.name}` : ''}${specs ? ` (${specs})` : ''}`)
    }
  } else {
    lines.push(text.noSizes)
  }
  if (catalog?.features?.length) {
    lines.push(text.features)
    for (const f of catalog.features) {
      const extras = [
        f.min_size_key && text.minimumSize(f.min_size_key),
        f.always_available && text.worksEverywhere
      ].filter(Boolean).join('; ')
      const about = [f.name, f.description].filter(Boolean).join(' — ')
      lines.push(`- "${f.key}"${about ? ` ${about}` : ''}${extras ? ` (${extras})` : ''}`)
    }
  } else {
    lines.push(text.noFeatures)
  }
  return lines.join('\n')
}

/**
 * The prompt that asks an assistant to write a new scenario from the teacher's
 * description. `promptLanguage` is the language of the instructions; the
 * brief's own `language` is the language of the scenario's content.
 */
export function buildCreatePrompt(brief: ScenarioAiBrief, catalog: ScenarioAiCatalog | null | undefined, promptLanguage: ScenarioAiLanguage, options: PromptOptions = {}): string {
  const text = PROMPT_TEXT[promptLanguage]
  const types = brief.stepTypes.length ? brief.stepTypes : SCENARIO_AI_STEP_TYPES
  return [
    text.createRole,
    `${text.labHeading}

${brief.description.trim()}

${text.labLines(text.languageNames[brief.language], brief.language, brief.level, brief.stepCount, types.join(', '))}`,
    text.contract(options.effects ?? false),
    text.rules,
    catalogSection(text, catalog),
    `${text.exampleHeading}

\`\`\`json
${JSON.stringify(EXAMPLE_SCENARIOS[brief.language], null, 2)}
\`\`\``,
    `${text.answerHeading}

${text.createAnswer} ${text.answerFormat}`
  ].join('\n\n')
}

/** The prompt that asks an assistant to change an existing scenario, given as its JSON export. */
export function buildImprovePrompt(instruction: string, scenario: unknown, catalog: ScenarioAiCatalog | null | undefined, promptLanguage: ScenarioAiLanguage, options: PromptOptions = {}): string {
  const text = PROMPT_TEXT[promptLanguage]
  return [
    text.improveRole,
    `${text.changeHeading}

${instruction.trim()}

${text.changeRules}`,
    text.contract(options.effects ?? false),
    text.rules,
    catalogSection(text, catalog),
    `${text.currentHeading}

\`\`\`json
${JSON.stringify(scenario, null, 2)}
\`\`\``,
    `${text.answerHeading}

${text.improveAnswer} ${text.answerFormat}`
  ].join('\n\n')
}

/**
 * The follow-up that hands the importer's refusals back to the assistant.
 * The problems themselves stay as the server wrote them: they name fields.
 */
export function buildFixPrompt(problems: string[], promptLanguage: ScenarioAiLanguage): string {
  const text = PROMPT_TEXT[promptLanguage]
  return [
    text.fixIntro,
    problems.map(p => `- ${p}`).join('\n'),
    `${text.fixOutro} ${text.answerFormat}`
  ].join('\n\n')
}

export type JsonExtraction =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; reason: 'empty' | 'no_object' | 'invalid'; detail?: string }

/**
 * Finds the scenario in an assistant's answer. Assistants wrap JSON in prose
 * and code fences however they are asked, so this takes the first balanced
 * {...} — after a ```json fence when there is one, since the prose or a bash
 * block before it may hold braces of its own.
 *
 * The fence's closing ``` is never searched for: the scenario's own markdown
 * holds ``` inside its strings (```{{exec}} blocks), and the brace scanner
 * already knows where the object ends.
 */
export function extractJsonObject(text: string): JsonExtraction {
  if (!text.trim()) return { ok: false, reason: 'empty' }
  const fence = /```json[^\n]*\n/i.exec(text)
  const candidate = firstBalancedObject(fence ? text.slice(fence.index + fence[0].length) : text)
  if (candidate === null) return { ok: false, reason: 'no_object' }
  try {
    const value = JSON.parse(candidate)
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { ok: false, reason: 'no_object' }
    return { ok: true, value }
  } catch (err) {
    return { ok: false, reason: 'invalid', detail: err instanceof Error ? err.message : String(err) }
  }
}

// The text from the first "{" to the brace that closes it, skipping braces
// inside strings. An unclosed object returns the rest of the text so that
// JSON.parse reports where it is cut, rather than "no JSON found".
function firstBalancedObject(text: string): string | null {
  const start = text.indexOf('{')
  if (start === -1) return null
  let depth = 0
  let inString = false
  for (let i = start; i < text.length; i++) {
    const c = text[i]
    if (inString) {
      if (c === '\\') i++
      else if (c === '"') inString = false
    } else if (c === '"') inString = true
    else if (c === '{') depth++
    else if (c === '}' && --depth === 0) return text.slice(start, i + 1)
  }
  return text.slice(start)
}

export interface ScenarioChangeSummary {
  stepsBefore: number
  stepsAfter: number
  addedSteps: string[]
  removedSteps: string[]
  titleChanged: boolean
}

type StepsCarrier = { title?: unknown; steps?: Array<{ title?: unknown }> }

/** What an improved scenario changes at a glance: the step count, steps added and removed by title, and whether the title moved. */
export function summarizeScenarioChanges(before: StepsCarrier, after: StepsCarrier): ScenarioChangeSummary {
  const titles = (s: StepsCarrier) => (Array.isArray(s.steps) ? s.steps : []).map(step => String(step?.title ?? ''))
  const was = titles(before)
  const now = titles(after)
  return {
    stepsBefore: was.length,
    stepsAfter: now.length,
    addedSteps: now.filter(t => !was.includes(t)),
    removedSteps: was.filter(t => !now.includes(t)),
    titleChanged: String(before.title ?? '').trim() !== String(after.title ?? '').trim()
  }
}
