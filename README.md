# TheRecruit

**TheRecruit** est une plateforme complète de gestion de recrutement, combinant un frontend moderne React/TypeScript et un backend Python/Flask robuste.

## Fonctionnalités principales

- Authentification sécurisée (JWT)
- Gestion des briefs de poste et contextes d’entreprise
- Analyse automatisée de CV et scoring prédictif
- Génération de questions d’entretien personnalisées
- Visualisation des candidats (tableaux, graphiques radar)
- Génération de rapports PDF
- Interface utilisateur responsive et moderne (Tailwind CSS)
- API RESTful documentée

## Stack technique

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Context API, hooks personnalisés
- Appels API centralisés
- Tests, linting et build automatisés

### Backend
- Python 3, Flask, SQLAlchemy
- JWT pour la sécurité
- Alembic pour les migrations
- ReportLab pour la génération de PDF
- Logging avancé
- Architecture modulaire

## Lancer le projet

### Prérequis
- Node.js (>= 16)
- Python (>= 3.9)
- PostgreSQL

### Installation

#### Frontend
```sh
cd TechNova_FT
npm install
npm run dev
```

#### Backend
```sh
cd TechNovaBackend
pip install -r requirements.txt
flask run
```

## Structure des dossiers

- `TechNova_FT/` : Frontend React
- `TechNovaBackend/` : Backend Flask
