# Exposition publique d'un port de session terminal (Traefik)

Guide de configuration de la fonctionnalité opt-in permettant à un
utilisateur de publier un port de sa session terminal vers une URL
publique, servie par une instance Traefik dédiée.

Code : `ocf-core/src/terminalTrainer/services/exposedPortService.go`,
`ocf-core/src/terminalTrainer/routes/traefikConfigController.go`.
Infra de référence : `traefik/` (dépôt git séparé).

**Statut actuel : mode dev, HTTP en clair, pas de TLS.** Voir la section
"Adding TLS later" du README du dépôt `traefik/` pour l'activer plus tard —
aucun changement de code n'est nécessaire des deux côtés, uniquement de la
config.

## 1. Configurer `ocf-core`

Dans `ocf-core/.env` :

```
EXPOSE_DOMAIN=expose.local          # domaine que tu utiliseras (voir étape 2)
TRAEFIK_PROVIDER_SECRET=un-secret-long-et-aleatoire
EXPOSE_SCHEME=http                  # ou laisse vide, "http" est le défaut
TRAEFIK_CERT_RESOLVER=              # laisse vide en dev
```

Génère le secret par exemple avec `openssl rand -hex 32`. Redémarre
`ocf-core` — sans `EXPOSE_DOMAIN` **et** `TRAEFIK_PROVIDER_SECRET`, les
routes ne sont même pas montées (404), donc c'est la première chose à
vérifier si rien ne répond.

## 2. Résoudre le domaine vers la machine Traefik

En dev, pas besoin d'un vrai DNS wildcard public : ajoute dans `/etc/hosts`
(sur la machine qui va tester dans un navigateur) :

```
<IP_de_la_machine_Traefik>  test.expose.local
```

Un par exposition que tu veux tester (le slug est aléatoire, généré à
chaque `POST`), ou plus simple : configure un vrai wildcard DNS pointant
vers cette IP si tu as un domaine de test disponible — ça évite de retoucher
`/etc/hosts` à chaque essai.

## 3. Lancer Traefik

```
cd traefik/
cp .env.example .env
```

Édite `.env` :
- `DEDICATED_IP` — l'IP sur laquelle Traefik doit écouter (`127.0.0.1` pour
  un test purement local).
- `TRAEFIK_PROVIDER_SECRET` — **exactement** la même valeur que
  `TRAEFIK_PROVIDER_SECRET` dans l'`.env` d'`ocf-core`.

Toute la config Traefik (endpoint du provider, header `X-Provider-Secret`,
entrypoint) est déjà dans `docker-compose.yml` sous forme d'arguments CLI —
rien d'autre à éditer pour un test en local sur la même machine (Traefik
rejoint le réseau Docker `ocf-shared` d'`ocf-core` et le résout par son nom
`ocf-core`). Pour une vraie machine séparée, voir le README du dépôt
`traefik/` (section réseau).

Puis :

```
docker compose up -d
```

## 4. Activer la fonctionnalité sur un plan

Le flag `port_exposure_enabled` est à `false` par défaut sur tous les
plans. Il faut le passer à `true` sur le plan que ton utilisateur de test
utilise :

```
PATCH /api/v1/subscription-plans/:id
{"port_exposure_enabled": true}
```

(en admin), ou directement en base si tu préfères aller vite en dev :

```sql
UPDATE subscription_plans SET port_exposure_enabled = true WHERE id = '<id-du-plan-de-test>';
```

## 5. Vérifier que le endpoint interne répond

```
curl -H "X-Provider-Secret: <ton-secret>" http://<host-ocf-core>:8080/internal/traefik/dynamic-config
```

→ doit renvoyer `{"http":{"routers":{},"services":{}}}` tant qu'aucune
session n'expose de port.

## 6. Test bout en bout

1. Lance une session terminal avec ce plan.
2. Dedans : `python3 -m http.server 8000 --bind 0.0.0.0`.
3. Depuis l'extérieur :
   ```
   curl -X POST https://<ocf-front-ou-api>/api/v1/terminals/<session_id>/exposed-ports \
     -H "Authorization: Bearer <ton-token>" -H "Content-Type: application/json" \
     -d '{"port": 8000}'
   ```
4. Récupère l'`url` dans la réponse, ouvre-la dans le navigateur (ou `curl` dessus).
5. Arrête la session → l'URL doit cesser de répondre dans les ~5s (intervalle de polling Traefik).

## Variables d'environnement — résumé

| Variable | Défaut | Rôle |
|---|---|---|
| `EXPOSE_DOMAIN` | vide (désactive la feature) | Domaine sous lequel les URLs publiques sont générées |
| `TRAEFIK_PROVIDER_SECRET` | vide (désactive la feature) | Secret attendu sur le header `X-Provider-Secret` du endpoint interne |
| `EXPOSE_SCHEME` | `http` | Schéma des URLs générées (`http` en dev, `https` une fois le TLS configuré) |
| `TRAEFIK_CERT_RESOLVER` | vide | Nom du resolver ACME Traefik ; tant que vide, aucun bloc `tls` n'est généré |
