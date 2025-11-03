# Streavmin V4

Plateforme de streaming type Netflix reposant entièrement sur un stockage fichier (catalogue, utilisateurs, assets). Le projet se compose d'une API Express et d'un front-end Next.js offrant un parcours utilisateur complet (login, accueil Netflix-like, lecteur vidéo, administration sécurisée).

## Fonctionnalités principales

- **Authentification fichier** (bcrypt + sessions Express) avec écran de connexion `/login`, redirection automatique vers `/app` après authentification.
- **Gestion des rôles** : utilisateurs finaux et administrateurs. Les routes `/api/admin/*` sont protégées par session + contrôle de rôle.
- **Catalogue 100% fichiers JSON** : films, catégories, séries (fusion automatique des épisodes par saison et idempotence). Publication/dépublication, mise en avant du héro, tri des saisons/épisodes.
- **Interface utilisateur** : page d'accueil style Netflix avec hero, carrousels, recherche locale (« continuer la lecture » via LocalStorage), lecteur vidéo HTML5 gérant HLS/mp4 et sous-titres.
- **Administration** : création/édition/suppression de catégories, films, épisodes, gestion des comptes utilisateurs (création, désactivation, reset via mise à jour du mot de passe), tableau de bord consolidé.
- **Sécurité** : CSRF tokens, rate limiting sur le login, validation Joi, contrôle des URLs, CORS configuré.
- **Journal d'audit** : fichier `data/audit.log` alimenté à chaque action sensible.
- **Scripts utilitaires** : seed de données de démonstration, backup `zip` de `data/`, lint du catalogue.
- **Docker & Compose** : services séparés API (port 4000) et front Next.js (port 3000) partageant le volume `./data`.

## Structure des données

```
data/
  catalog/
    categories.json
    movies.json
    series/<slug>.json
  users/
    users.json
  images/
frontend/
  (Application Next.js)
server.js
scripts/
```

Les vidéos sont référencées par URL (HLS/DASH/mp4) et ne transitent pas par le serveur.

## Prise en main

### Prérequis
- Node.js >= 18
- npm >= 9

### Installation & développement local

```bash
# Dépendances backend
npm install
# Dépendances frontend
(cd frontend && npm install)

# Remplir les données de démonstration (optionnel)
npm run seed

# Lancer l'API (port 4000)
npm run dev
# Dans un autre terminal, lancer le front Next.js (port 3000)
cd frontend && npm run dev
```

Par défaut un compte administrateur est créé : `admin` / `admin123`.

Le front consomme l'API via `NEXT_PUBLIC_API_BASE` (défaut : `http://localhost:4000`). Assurez-vous que la variable est définie lorsque vous lancez le front :

```bash
NEXT_PUBLIC_API_BASE=http://localhost:4000 npm run dev
```

### Scripts

- `npm run seed` : copie les données de démonstration dans `data/`.
- `npm run backup` : archive gzip `data/` vers `backups/`.
- `npm run lint:catalog` : vérifie la validité du catalogue.

### Docker

```bash
docker compose build
docker compose up
```

- Front-end : http://localhost:3000
- API : http://localhost:4000

Les données sont persistées via le volume `./data:/app/data`.
L'API accepte par défaut `http://localhost:3000` via la variable `FRONTEND_ORIGIN` (séparer plusieurs domaines par des virgules).

## Sécurité & bonnes pratiques

- Sessions HTTPOnly avec expiration, CSRF token pour toutes les requêtes POST/PUT/DELETE sensibles.
- Validation serveur via Joi, journalisation des actions dans `data/audit.log`.
- Les utilisateurs ne peuvent être créés que par un administrateur via le panneau d'administration.

## TODO possibles

- Intégration d'un player HLS avancé (Shaka/Video.js).
- Mise en place de tests automatisés.
- Internationalisation du front.
