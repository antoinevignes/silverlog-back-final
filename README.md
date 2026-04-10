# Silverlog - Backend

API backend de Silverlog, un réseau social dédié au cinéma. Cette API REST gère l'authentification, les données utilisateurs, les films, les critiques et les notifications en temps réel.

## Prérequis

- Node.js 22.x
- npm
- PostgreSQL

## Installation

```bash
# Cloner le repository (si ce n'est pas déjà fait)
git clone <repo-url>

# Se déplacer dans le dossier backend
cd silverlog-back-final

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer le fichier .env avec vos configurations (DB, JWT, Cloudinary, Resend...)
```

## Scripts Disponibles

```bash
# Démarrer le serveur de développement (watch mode)
npm run dev

# Compiler TypeScript vers dist/
npm run build

# Démarrer le serveur en production (nécessite un build préalable)
npm start
```

## Architecture du Projet

```
src/
├── controllers/         # Gestionnaires de routes (logique métier)
│   ├── auth.controller.ts
│   ├── user.controller.ts
│   ├── movie.controller.ts
│   ├── review.controller.ts
│   ├── list.controller.ts
│   └── admin.controller.ts
├── models/              # Requêtes base de données
│   ├── user.model.ts
│   ├── movie.model.ts
│   ├── review.model.ts
│   └── ...
├── routes/              # Définition des routes Express
│   ├── auth.routes.ts
│   ├── user.routes.ts
│   └── ...
├── middlewares/         # Middlewares Express
│   ├── auth.middleware.ts
│   └── errorHandler.ts
├── schemas/             # Schémas de validation Zod
│   ├── auth.schema.ts
│   ├── user.schema.ts
│   └── ...
├── types/               # Types TypeScript
│   └── index.ts
├── utils/               # Utilitaires
│   └── handle-errors.ts
├── db.ts                # Configuration connexion PostgreSQL
├── socket.ts            # Configuration Socket.io
└── index.ts             # Point d'entrée de l'application
```

## Fonctionnalités Principales

- **Authentification** : Inscription, connexion, JWT, vérification email, gestion des sessions
- **Utilisateurs** : Profils, modification, suppression, follow/unfollow
- **Films** : Intégration TMDB, détails, notations, watchlist
- **Critiques** : CRUD, likes, réponses, modération
- **Listes** : Création, modification, suppression, films favoris
- **Notifications** : Temps réel via Socket.io
- **Uploads** : Images de profil via Cloudinary
- **Emails** : Vérification, notifications via Resend

## Conventions de Code

- **TypeScript** : Mode strict activé (`strict: true`)
- **Naming** :
  - Fichiers : kebab-case.ts (ex: `user.controller.ts`, `handle-errors.ts`)
  - Fonctions : camelCase
  - Types : PascalCase
- **Error Handling** : Utilisation du middleware `errorHandler`, throw dans les controllers
- **Validation** : Zod pour valider les requêtes entrantes
- **Base de données** : Template literals `postgres` pour les requêtes SQL

## Ressources

- [Documentation Express.js](https://expressjs.com/)
- [Documentation PostgreSQL](https://www.postgresql.org/docs/)
- [Documentation Zod](https://zod.dev/)
- [Documentation Socket.io](https://socket.io/docs/)
- [Documentation JWT](https://jwt.io/introduction/)

## Diagrammes UML

### Diagramme de Cas d'Utilisation

@startuml
left to right direction

actor "Visiteur" as Guest
actor "Utilisateur Authentifié" as User
actor "Administrateur" as Admin

rectangle Silverlog {
usecase "Se connecter" as LOGIN
usecase "S'inscrire" as REGISTER
usecase "Consulter les films" as VIEW_FILMS
usecase "Chercher un film" as SEARCH
usecase "Consulter les critiques" as VIEW_REVIEWS

usecase "Écrire une critique" as WRITE_REVIEW
usecase "Noter un film" as RATE
usecase "Modifier son profil" as EDIT_PROFILE
usecase "Supprimer son compte" as DELETE_OWN_ACCOUNT

usecase "Gérer ses listes" as HANDLE_LISTS
usecase "Créer une liste" as CREATE_LIST
usecase "Supprimer une liste" AS DELETE_LIST
usecase "Ajouter un film à une liste" AS ADD_TO_LIST

usecase "Gérer les critiques" as HANDLE_REVIEWS
usecase "Aimer une critique" as LIKE_REVIEW
usecase "Répondre aux critiques" as REPLY
usecase "Supprimer SA critique" as DELETE_OWN_REVIEW

usecase "Supprimer TOUTE critique" as DELETE_ANY_REVIEW
usecase "Bloquer un utilisateur" as BLOCK_USER
usecase "Supprimer un compte utilisateur" as DELETE_USER_ACCOUNT
usecase "Modifier les suggestions de films" as EDIT_SUGGESTIONS

Guest -- LOGIN
Guest -- REGISTER
Guest -- VIEW_FILMS
Guest -- SEARCH
Guest -- VIEW_REVIEWS

User -- WRITE_REVIEW
User -- EDIT_PROFILE
User -- DELETE_OWN_ACCOUNT
User -- HANDLE_LISTS
User -- HANDLE_REVIEWS

Admin -- DELETE_ANY_REVIEW
Admin -- BLOCK_USER
Admin -- DELETE_USER_ACCOUNT
Admin -- EDIT_SUGGESTIONS

User --|> Guest
Admin --|> User

WRITE_REVIEW ..> RATE : <<include>>

HANDLE_LISTS <.. CREATE_LIST : <<extend>>
HANDLE_LISTS <.. DELETE_LIST : <<extend>>
HANDLE_LISTS <.. ADD_TO_LIST : <<extend>>

HANDLE_REVIEWS <.. DELETE_OWN_REVIEW : <<extend>>
HANDLE_REVIEWS <.. REPLY : <<extend>>
HANDLE_REVIEWS <.. LIKE_REVIEW : <<extend>>
}
@enduml

### Diagramme d'Activité - Noter un film

@startuml
title Processus de Notation d'un Film sur Silverlog

start
:Utilisateur arrive sur la fiche du film;
:Utilisateur clique sur bouton de notation;
if (Utilisateur connecté ?) then (oui)
:Afficher modale de notation;
else (non)
:Redirection vers page de connexion;
stop
endif

:Choisir la note (étoiles);
fork
:Enregistrer la note;
fork again
:Mettre à jour la moyenne du film;
end fork

:Mettre à jour l'affichage;
:Afficher confirmation "Note enregistrée";
stop
@enduml

### Diagramme de Classes

@startuml
title Diagramme de Classes - Silverlog

class Utilisateur {
-id: Integer
-username: String
-email: String
-password: String
-role: UserRole
-description: String
-location: String
-created_at: Date
+signUp()
+signIn()
+editProfile()
+deleteAccount()
}

class Admin {
+deleteReview()
+blockAccount()
+deleteUserAccount()
+editMovieSuggestions()
}

class Film {
-id: Integer
-title: String
-year: Integer
-avgRating: Float
+getDetails()
}

class Note {
-movieId: Integer
-userId: Integer
-rating: Integer
-ratedAt: Date
+rateMovie()
}

class Avis {
-id: Integer
-userId: Integer
-movieId: Integer
-content: Text
-created_at: Date
+createReview()
+deleteReview()
+likeReview()
+answerReview()
}

class Liste {
-id: Integer
-userId: Integer
-isPublic: Boolean
-title: String
-description: String
-type: ListType
-created_at: Date
+addToList()
+deleteFromList()
+addMovie()
+deleteMovie()
}

Utilisateur "0" -- "_" Avis : gère >
Utilisateur "1" -- "_" Liste : possède >
Film "0" -- "_" Avis : reçoit >
Film "0" -- "_" Liste : appartient à >
Utilisateur "0" -- "_" Note : donne >
Film "0" -- "_" Note : possède >

Admin --|> Utilisateur

enum UserRole {
USER
MODERATOR
ADMIN
}

enum ListType {
WATCHLIST
TOP
CUSTOM
}
@enduml
