DIAGRAMME DE CAS D'UTILISATION UML

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

DIAGRAMME D'ACTIVITE - NOTER UN FILM

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

DIAGRAMME DE CLASSES

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
