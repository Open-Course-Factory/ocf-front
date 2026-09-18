/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

export const helpFr = {
  help: {
    title: "Aide & Documentation",
    subtitle: "Tout ce dont vous avez besoin pour commencer et tirer le meilleur parti de la plateforme",
    backToHome: "Retour à l'accueil",
    backToApp: "Retour à l'application",

    contact: {
      title: "Besoin d'aide ?",
      text: "Si vous ne trouvez pas ce que vous cherchez, n'hésitez pas à nous contacter à"
    },

    sections: {
      terminals: {
        title: "🖥️ Terminaux",
        description: "Apprenez à créer et gérer vos sessions de terminaux",
        gettingStarted: "Premiers Pas",
        managingSessions: "Gestion des Sessions",
        troubleshooting: "Dépannage",
        sshKeys: "Gestion des clés SSH"
      },
      courses: {
        title: "📚 Cours",
        description: "Maîtrisez le système de création et gestion de cours",
        structure: "Structure des Cours",
        content: "Création de Contenu"
      },
      account: {
        title: "👤 Gestion du Compte",
        description: "Gérez votre abonnement, facturation et paramètres de compte",
        subscription: "Abonnement et Plans",
        billing: "Facturation et Paiements",
        rolesAndPermissions: "Rôles et Permissions",
        permissionsReference: "Référence des permissions API",
        settings: "Paramètres & Préférences",
        themes: "Mode sombre & Thèmes"
      },
      scenarios: {
        title: "🎯 Scénarios interactifs",
        description: "Apprenez à utiliser et créer des exercices pratiques interactifs étape par étape",
        gettingStarted: "Premiers pas avec les scénarios",
        creation: "Création de scénarios"
      },
      organizations: {
        title: "🏢 Organisations & Groupes",
        description: "Gérez les organisations, les groupes, les importations en masse et les licences",
        overview: "Vue d'ensemble des Organisations",
        groups: "Gestion des Groupes",
        bulkImport: "Import en Masse",
        bulkLicenses: "Licences en Volume"
      }
    },

    navigation: {
      backToHelp: "← Retour au Centre d'Aide",
      nextSteps: "Prochaines Étapes"
    },

    terminals: {
      gettingStarted: {
        title: "Premiers pas avec les terminaux",
        intro: "Une session terminal est une vraie machine Linux qui tourne dans votre navigateur. Rien à installer : choisissez un environnement, une taille, cliquez sur Créer, et vous êtes devant un prompt une trentaine de secondes plus tard.",
        what: {
          title: "Ce que vous obtenez",
          description: "Chaque session est un conteneur isolé, avec son propre disque, son propre compte root et, si votre offre le permet, son propre accès internet. Elle vit pendant une durée fixe, affichée en compte à rebours dans l'en-tête, puis elle est arrêtée et ses ressources libérées."
        },
        open: {
          title: "Ouvrir le composeur de session",
          description: "Dans le menu de gauche, ouvrez Terminaux puis cliquez sur Créer une session. Tout se passe sur cette seule page : l'environnement, la taille, les options et le bouton Créer.",
          button: "Créer une session",
          shot: "Le composeur de session : les cartes d'environnement, les ressources restantes, les pastilles de taille, puis Options avancées, Mon utilisation et le bouton Créer."
        },
        environment: {
          title: "1. Choisir un environnement",
          description: "Les cartes en haut sont les distributions disponibles pour vous : Alpine, Debian, Ubuntu, GameShell, et les images fournies par votre organisation. Cliquez sur l'une d'elles pour la sélectionner. La description sous le nom dit ce qu'elle contient.",
          dedicated: "Un petit badge serveur dans le coin d'une carte signale un environnement qui n'existe que sur un serveur ; il se comporte exactement comme les autres."
        },
        size: {
          title: "2. Choisir une taille",
          description: "La ligne Ressources liste les tailles, de XS à XL. Survolez une pastille pour voir ses vCPU et sa RAM. Une étoile marque la taille recommandée pour l'environnement choisi ; elle est sélectionnée pour vous si vous pouvez la lancer, sinon c'est la plus grande taille que vous pouvez lancer.",
          budget: "Au-dessus des pastilles, deux lignes disent ce que vous pouvez encore lancer : vos vCPU et votre RAM restants, puis la même chose exprimée en sessions, par exemple « 1 XL ou 1 L ou 2 M ». Le badge ×n de chaque pastille est le nombre de sessions de cette taille que vous pouvez démarrer maintenant. Votre offre vous donne un budget de CPU et de RAM partagé, pas un nombre fixe de sessions : une grosse session consomme le budget de plusieurs petites.",
          locked: "Un cadenas sur une pastille signifie que la taille n'est pas incluse dans votre offre ; survolez-la pour connaître la raison. Sur une offre personnelle vous pouvez tout de même la cliquer pour lire ses caractéristiques, et le lien Débloquer plus de puissance mène à la page des offres.",
          seat: "Si vous utilisez un siège attribué par votre organisation ou votre classe, les tailles que votre offre ne couvre pas ne sont tout simplement pas affichées.",
          useCases: {
            title: "À quoi sert chaque taille",
            xs: "XS — entraînement léger, ligne de commande de base",
            s: "S — exercices standard",
            m: "M — un environnement de développement",
            l: "L — plusieurs services, Docker",
            xl: "XL — charges lourdes, clusters"
          }
        },
        features: {
          title: "3. Options additionnelles",
          description: "Certains environnements proposent des fonctionnalités supplémentaires une fois la taille choisie, sous forme de puces sous les tailles (par exemple Docker). Cochez celles dont vous avez besoin. Une puce cadenassée n'est pas disponible dans votre offre ou demande une taille plus grande ; survolez-la pour savoir lequel des deux."
        },
        advanced: {
          title: "4. Options avancées (facultatif)",
          description: "Le bloc Options avancées est replié par défaut. Vous pouvez créer une session sans jamais l'ouvrir. À l'intérieur :",
          name: "Nom du terminal — le nom de la session dans votre liste. Laissé vide, il devient environnement-taille-date, par exemple debian-m-260918.",
          hostname: "Nom d'hôte — le nom affiché dans le prompt (root{'@'}nomdhote). Minuscules, chiffres et tirets.",
          exerciseRef: "Référence d'exercice — une étiquette libre comme « TP 3 - Bases Docker », conservée avec la session et visible dans vos exports d'historique.",
          packages: "Paquets de démarrage — une liste séparée par des virgules, installée au démarrage du terminal en plus de ce que l'image contient déjà. Elle demande que l'accès internet soit activé.",
          network: "Accès internet — Autoriser ou Sans internet. Activé par défaut quand votre offre l'inclut ; sans lui, le terminal ne peut ni installer de paquets ni cloner de dépôts. Quand votre offre ne l'inclut pas, le choix est verrouillé sur Sans internet.",
          persistence: "Conserver mon travail entre les sessions — affiché seulement si votre offre autorise les sessions persistantes. Tout effacer à la fin : le conteneur est supprimé peu après l'arrêt. Conserver mon travail : le disque est gardé pour reprendre la session plus tard."
        },
        create: {
          title: "5. Créer la session",
          description: "Le badge en haut à droite du panneau indique Prêt à lancer dès qu'un environnement et une taille sont choisis. Cliquez sur Créer une session. Une barre de progression suit la demande, puis la vue de session s'ouvre.",
          recording: "La toute première fois que vous créez une session, une fenêtre Enregistrement des commandes vous explique que les commandes tapées sont enregistrées, que les formateurs et administrateurs peuvent les consulter, et que vous pouvez exporter ou supprimer cet historique à tout moment. Ne tapez pas de mots de passe ni de jetons dans un terminal. Cliquez sur J'ai compris : la fenêtre ne revient plus."
        },
        session: {
          title: "La vue de session",
          description: "C'est ici que vous travaillez. Le terminal occupe toute la largeur ; cliquez dedans et tapez.",
          shot: "Une session en cours : le bandeau d'enregistrement, l'en-tête avec l'état de connexion, l'indicateur internet, le temps restant et le bouton Détruire, puis le panneau Historique des commandes.",
          header: "L'en-tête affiche le nom de la session, l'état de connexion (Connecté, Connexion…, Déconnecté), un globe quand l'accès internet est activé, une puce Ports sur les sessions avec accès internet (voir la page URL publique pour un port), et le temps restant.",
          banner: "Le bandeau bleu rappelle que les commandes sont enregistrées ; En savoir plus ouvre la politique de confidentialité. Compris le masque définitivement.",
          stop: "Arrêter — seulement sur les sessions créées avec Conserver mon travail. Le conteneur s'arrête et son disque est gardé ; vous reprenez plus tard depuis Mes sessions.",
          destroy: "Détruire — termine la session pour de bon. Le conteneur, son disque et son historique de commandes sont supprimés après confirmation.",
          history: "Historique des commandes — le panneau sous le terminal liste ce que vous avez tapé, tel qu'enregistré. Il reste consultable après la fin de la session."
        },
        expiry: {
          title: "Quand le temps est écoulé",
          description: "Le compte à rebours de l'en-tête passe du bleu à l'orange puis au rouge, et une notification vous prévient trois fois :",
          tenMin: "10 minutes restantes — pour information.",
          fiveMin: "5 minutes restantes — sauvegardez votre travail.",
          oneMin: "Moins d'une minute.",
          ended: "Une fois la session expirée, le terminal est remplacé par un message et l'historique des commandes reste disponible en dessous. Démarrez une nouvelle session depuis Terminaux › Créer une session."
        },
        nextSteps: {
          managing: "Voir vos sessions, les reprendre, les arrêter, les détruire, et lire votre utilisation.",
          troubleshooting: "Que faire quand une session ne démarre pas ou que le terminal reste noir.",
          scenarios: "Des exercices guidés, étape par étape, au-dessus d'un terminal."
        }
      },

      managingSessions: {
        title: "Gérer vos sessions",
        intro: "La page Mes sessions liste tous les terminaux qui vous appartiennent, en cours ou non, et c'est là que vous en reprenez, arrêtez, détruisez ou partagez un. Le panneau Mon utilisation vous dit quelle part de votre offre est consommée.",
        list: {
          title: "La page Mes sessions",
          description: "Ouvrez Terminaux › Mes sessions. Les sessions en cours viennent d'abord, sous Sessions actives ; les sessions arrêtées ou expirées sont repliées sous Sessions inactives.",
          shot: "Mes sessions : une session active avec son nom, son environnement, sa taille, l'indicateur internet, sa date de création et ses boutons d'action ; les sessions inactives sont repliées dessous.",
          sync: "Tout synchroniser demande au serveur de terminaux l'état réel de chaque session et met la liste à jour. Utilisez-le quand une carte semble fausse.",
          newSession: "Nouvelle session ouvre le composeur de session.",
          hide: "Masquer toutes les inactives retire de la page les sessions terminées ; Afficher les masquées les ramène. Masquer est purement visuel : rien n'est supprimé.",
          classView: "Si vous gérez une classe, le sélecteur Mes sessions vous permet de voir les sessions de vos apprenants. Cette vue est en lecture seule ; la supervision se fait depuis la page de la classe."
        },
        card: {
          title: "Ce que montre une carte de session",
          description: "Chaque carte est une session. De gauche à droite :",
          name: "Le nom, avec un crayon pour le renommer sur place.",
          meta: "L'environnement, la taille (XS…XL), un globe ou un cercle barré pour l'accès internet activé ou non, et la date d'expiration pour une session en cours.",
          state: "Un badge d'état : En cours, Arrêté ou Supprimé. Une session persistante arrêtée affiche aussi Suppression automatique dans … : le temps pendant lequel son disque est conservé avant d'être supprimé définitivement.",
          actions: {
            title: "Les boutons d'action",
            open: "Icône écran — ouvrir la session dans la page, avec l'historique des commandes. Disponible pour les sessions en cours et arrêtées.",
            popup: "Icône lien externe — ouvrir le terminal seul dans un nouvel onglet. Sessions en cours uniquement.",
            resume: "Lecture — reprendre une session arrêtée, disque et historique intacts.",
            stop: "Stop — arrêter une session en cours en gardant son disque. Le bouton est grisé sur une session éphémère, avec une infobulle qui explique pourquoi : il n'y a pas de disque à garder, utilisez Détruire.",
            destroy: "Corbeille — détruire la session après confirmation. Le disque et l'historique des commandes sont perdus.",
            more: "Le menu ⋮ d'une session en cours propose Copier le lien, Copier le code iframe (pour intégrer le terminal dans une page à vous) et Sync."
          }
        },
        lifecycle: {
          title: "Éphémère ou persistante",
          description: "Le choix se fait à la création de la session, dans Options avancées › Conserver mon travail entre les sessions, et il décide de ce que veut dire Arrêter.",
          ephemeral: "Éphémère (Tout effacer à la fin) — le mode par défaut. Le conteneur est supprimé peu après la fin de la session, que vous l'ayez détruite ou qu'elle ait expiré. Rien n'est conservé, sauf l'historique des commandes.",
          persistent: "Persistante (Conserver mon travail) — demande une offre qui l'autorise. Arrêter garde le disque ; la carte affiche Arrêté avec un compte à rebours, et Reprendre ramène la même machine avec vos fichiers. Quand le compte à rebours atteint zéro, la session est supprimée comme les autres.",
          expired: "Les deux modes ont une durée limite, avec des avertissements à 10, 5 et 1 minutes. Quand elle est atteinte, une session éphémère expire et seul son historique de commandes subsiste ; une session persistante est arrêtée automatiquement, disque conservé, et la date de sa carte se lit Arrêt automatique le plutôt qu'Expire le."
        },
        usage: {
          title: "Le panneau Mon utilisation",
          description: "Sur la page Créer une session, le bloc Mon utilisation (replié, avec un badge qui compte vos sessions en cours) montre ce que votre offre vous donne et ce qu'il en reste. L'icône de rafraîchissement le recharge.",
          plan: "Offre — le nom de l'offre en vigueur et sa provenance : personnelle, ou fournie par votre organisation.",
          capacity: "Capacité — le total de CPU et de RAM de l'offre, et la durée maximale d'une session.",
          remaining: "Capacité restante — le même budget exprimé en sessions, par exemple « ≈ 1 XL ou 2 L ou 4 M ». Chaque session en cours, quelle que soit sa taille, est prise sur ce budget unique. S'il affiche Plus de capacité, arrêtez ou détruisez une session pour en libérer.",
          bars: "Barres CPU et RAM — utilisé sur total, et la liste des sessions qui comptent, avec leur taille et leur état (en cours ou en pause).",
          composer: "La même information apparaît en raccourci dans le composeur lui-même : la ligne des vCPU et RAM restants, la ligne « Vous pouvez lancer … » et les badges ×n des pastilles de taille. Si la capacité ne peut pas être calculée à cet instant, le panneau le dit au lieu d'afficher un chiffre faux ; vous pouvez tout de même démarrer une session."
        },
        history: {
          title: "Historique des commandes",
          description: "Tout ce que vous tapez dans un terminal est enregistré : pour la sécurité, et pour qu'un formateur puisse suivre votre travail. Le panneau Historique des commandes, sous le terminal dans la vue de session, en est votre copie.",
          filter: "Filtrez la liste, triez du plus récent ou du plus ancien, cliquez sur une commande pour la recoller dans un terminal en cours, ou copiez-la dans le presse-papiers.",
          export: "Exporter en CSV ou Exporter en JSON télécharge l'historique de la session ; la référence d'exercice donnée dans Options avancées y figure.",
          delete: "Supprimer tout l'historique efface les commandes enregistrées de la session après confirmation. C'est irréversible."
        },
        nextSteps: {
          gettingStarted: "Créer une session : environnement, taille, options.",
          troubleshooting: "Une session qui ne démarre pas, un terminal noir, un bouton grisé.",
          scenarios: "Lancer un exercice guidé au-dessus d'un terminal."
        }
      },

      troubleshooting: {
        title: "Dépannage des terminaux",
        intro: "Les problèmes les plus fréquents, ce qu'ils signifient, et quoi faire. Chaque point cite le message ou l'état exact que vous voyez à l'écran.",
        cannotCreate: {
          title: "La session ne démarre pas",
          budget: {
            title: "« Vous avez atteint la limite de sessions de votre forfait »",
            description: "Vos sessions en cours consomment déjà tout le budget CPU et RAM de votre offre. Le message vous dit ce que vous pouvez encore lancer, s'il reste quelque chose. Arrêtez ou détruisez une session depuis Mes sessions, ou choisissez une taille plus petite. Une session persistante à l'état Arrêté ne compte pas."
          },
          locked: {
            title: "Une taille ou une option affiche un cadenas",
            description: "Elle n'est pas incluse dans votre offre, ou l'environnement demande une taille plus grande. Survolez la pastille ou la puce pour la raison. Sur une offre personnelle, Débloquer plus de puissance mène à la page des offres ; sur un siège fourni par une organisation, adressez-vous à la personne qui gère votre classe ou votre organisation."
          },
          capacity: {
            title: "« Serveur à capacité maximale » ou « Capacité limitée — lancement non garanti »",
            description: "C'est le serveur de terminaux lui-même qui manque de ressources ; ce n'est pas votre offre. Le badge de capacité en haut à droite du composeur passe à l'orange ou au rouge. Réessayez dans quelques minutes ou choisissez une taille plus petite."
          },
          offline: {
            title: "« Le serveur … est hors ligne » ou « Aucun environnement disponible »",
            description: "Le serveur qui héberge les environnements ne répond pas. Cliquez sur Réessayer dans le composeur ; si la liste reste vide, contactez votre administrateur."
          },
          persistence: {
            title: "« Les sessions persistantes ne sont pas disponibles sur votre offre actuelle »",
            description: "Choisissez Tout effacer à la fin dans Options avancées, ou passez à une offre qui autorise les sessions persistantes."
          }
        },
        blackScreen: {
          title: "Le terminal reste noir ou indique Déconnecté",
          description: "La session existe mais le navigateur n'arrive pas à garder sa connexion avec elle.",
          steps: {
            reconnect: "Cliquez sur Reconnecter dans l'en-tête du terminal ; si l'état repasse à Connecté, c'est réglé.",
            blockers: "Désactivez les bloqueurs de publicité ou extensions de confidentialité pour ce site : ils peuvent couper le WebSocket dont dépend le terminal.",
            reload: "Rechargez la page. Votre session n'a pas bougé : elle vit sur le serveur, pas dans l'onglet.",
            expired: "Regardez le compte à rebours. Une session dont le temps est écoulé affiche « Cette session a expiré » à la place du prompt ; démarrez-en une nouvelle."
          }
        },
        keyboard: {
          title: "Taper ne fait rien",
          description: "Cliquez d'abord dans la zone noire : le terminal ne reçoit les touches que lorsqu'il a le focus. S'il vous ignore encore, vérifiez que l'en-tête indique Connecté, et rechargez la page si ce n'est pas le cas."
        },
        shell: {
          title: "« Le shell du terminal n'a pas pu démarrer »",
          description: "L'image du conteneur n'a pas le shell attendu par la plateforme, ou il n'est pas exécutable. C'est un problème d'image, pas le vôtre : signalez-le à votre administrateur avec le nom de l'environnement."
        },
        stopGreyed: {
          title: "Le bouton Stop est grisé",
          description: "La session est éphémère : il n'y a pas de disque à garder, Arrêter n'a donc pas de sens. Utilisez Détruire (l'icône corbeille) pour la terminer. Pour pouvoir arrêter et reprendre, créez votre prochaine session avec Conserver mon travail dans Options avancées."
        },
        packages: {
          title: "Les paquets de démarrage sont ignorés ou le champ est verrouillé",
          description: "Installer des paquets demande l'accès internet. Mettez Accès internet sur Autoriser internet dans Options avancées ; si ce choix est verrouillé, votre offre ne l'inclut pas."
        },
        wrongState: {
          title: "Une carte affiche un état faux",
          description: "La liste est une vue en cache. Cliquez sur Tout synchroniser dans Mes sessions, ou sur Sync dans le menu ⋮ de la carte, pour récupérer l'état réel auprès du serveur de terminaux."
        },
        support: {
          title: "Demander de l'aide",
          description: "Si rien de tout cela ne fonctionne, utilisez le bouton Feedback en bas à droite de chaque page, ou contactez votre formateur ou votre administrateur. Donnez-leur :",
          items: {
            session: "l'identifiant de session affiché sous le terminal (Session : …),",
            when: "ce que vous faisiez et le message exact à l'écran,",
            browser: "votre navigateur et votre système d'exploitation."
          }
        },
        nextSteps: {
          gettingStarted: "Comment une session se crée, étape par étape.",
          managing: "La page Mes sessions et le panneau Mon utilisation."
        }
      },

      sshKeys: {
        title: "Clés SSH et clé d'accès terminal",
        intro: "Les sessions terminal ne vous demandent aucune clé : elles s'ouvrent dans le navigateur et votre clé d'accès est créée avec votre compte. Cette page explique les deux réglages liés aux clés que vous pouvez tout de même rencontrer.",
        terminalKey: {
          title: "Votre clé d'accès terminal",
          description: "La plateforme vous identifie auprès du serveur de terminaux avec une clé d'accès. Elle est générée automatiquement à la création de votre compte (et de nouveau, si elle manque, quand un formateur lance un scénario pour votre classe). Vous n'avez jamais à la saisir.",
          page: "Paramètres › Clés d'accès Terminal affiche le nom de la clé, son état et sa date de création. Régénérer la clé la remplace après confirmation ; ne le faites que si un administrateur vous le demande, ou si la page indique Aucune clé terminal trouvée."
        },
        sshKeys: {
          title: "Les clés SSH",
          description: "Paramètres › Clés SSH stocke des clés SSH privées sous un nom. Elles ne servent pas à ouvrir des sessions terminal sur la plateforme. La page n'existe que si votre administrateur a activé la fonctionnalité.",
          shot: "La page Clés SSH des paramètres, vide, avec le bouton Ajouter une clé SSH.",
          add: "Ajouter une clé SSH — donnez-lui un nom et collez la clé privée (le texte qui commence par -----BEGIN OPENSSH PRIVATE KEY-----). Elle est chiffrée avant d'être stockée ; la plateforme ne la réaffiche jamais.",
          edit: "Le crayon renomme une clé ; on ne peut pas modifier son contenu, ajoutez-en une nouvelle à la place.",
          delete: "La corbeille supprime une clé après confirmation."
        },
        nextSteps: {
          gettingStarted: "Créer votre première session, sans aucune clé.",
          settings: "Les autres pages de paramètres : navigation, langue, interface, notifications, sécurité."
        }
      }
    },

    courses: {
      structure: {
        title: "Structure des Cours",
        intro: "Comprendre l'organisation hiérarchique des contenus pédagogiques dans OCF",

        hierarchy: {
          title: "Hiérarchie des contenus",
          description: "OCF utilise une structure hiérarchique à quatre niveaux pour organiser les contenus pédagogiques. Cette organisation permet une navigation intuitive et une gestion flexible des cours.",
          levels: {
            course: {
              title: "Cours",
              description: "Niveau principal - Un domaine d'apprentissage complet",
              example1: "Programmation Python",
              example2: "Linux Administration",
              example3: "Bases de données"
            },
            chapter: {
              title: "Chapitres",
              description: "Grandes thématiques du cours",
              example1: "Variables et Types",
              example2: "Fonctions",
              example3: "Programmation Orientée Objet"
            },
            section: {
              title: "Sections",
              description: "Sous-thèmes spécifiques",
              example1: "Déclaration de variables",
              example2: "Types primitifs",
              example3: "Conversion de types"
            },
            page: {
              title: "Pages",
              description: "Contenu pédagogique détaillé",
              example1: "Leçon théorique",
              example2: "Exercice pratique",
              example3: "Évaluation"
            }
          }
        },

        creation: {
          title: "Création et organisation",
          description: "Chaque niveau peut être créé et géré indépendamment, permettant une flexibilité maximale dans l'organisation de vos contenus pédagogiques.",
          step1: {
            title: "Créer un cours",
            description: "Définissez le cadre général de votre enseignement. Choisissez un titre explicite et une description claire des objectifs.",
            button: "Gérer les cours"
          },
          step2: {
            title: "Structurer en chapitres",
            description: "Organisez votre cours en grandes thématiques logiques. Chaque chapitre représente un module d'apprentissage cohérent.",
            button: "Gérer les chapitres"
          },
          step3: {
            title: "Détailler en sections",
            description: "Découpez chaque chapitre en sections spécifiques. Facilitez la navigation et l'assimilation progressive.",
            button: "Gérer les sections"
          },
          step4: {
            title: "Rédiger les pages",
            description: "Créez le contenu pédagogique final : leçons, exercices, évaluations et ressources complémentaires.",
            button: "Gérer les pages"
          }
        },

        organization: {
          title: "Bonnes pratiques d'organisation",
          description: "Suivez ces recommandations pour créer des cours bien structurés et faciles à naviguer :",
          tips: {
            tip1: {
              title: "Objectifs clairs",
              description: "Définissez des objectifs pédagogiques précis pour chaque niveau. Chaque élément doit contribuer à un apprentissage spécifique."
            },
            tip2: {
              title: "Progression logique",
              description: "Organisez le contenu selon une progression pédagogique cohérente. Les prérequis doivent être acquis avant les notions avancées."
            },
            tip3: {
              title: "Équilibre des contenus",
              description: "Maintenez un équilibre entre théorie et pratique. Alternez leçons, exercices et évaluations."
            },
            tip4: {
              title: "Nomenclature cohérente",
              description: "Utilisez une nomenclature claire et cohérente. Facilitez la compréhension et la navigation."
            }
          },
          structuring: {
            title: "Conseils de structuration :",
            tip1: {
              title: "Granularité appropriée",
              description: "Évitez les chapitres trop longs ou trop courts. Visez 3-7 sections par chapitre, 3-5 pages par section."
            },
            tip2: {
              title: "Modularité",
              description: "Créez des modules autonomes qui peuvent être réutilisés ou réorganisés selon les besoins pédagogiques."
            },
            tip3: {
              title: "Parcours multiples",
              description: "Prévoyez différents parcours selon le niveau des apprenants : débutant, intermédiaire, avancé."
            }
          }
        },

        relationships: {
          title: "Relations et dépendances",
          description: "Comprenez comment les différents éléments interagissent entre eux :",
          strict: {
            title: "Hiérarchie stricte",
            description: "Chaque élément appartient obligatoirement à son niveau parent. Une page ne peut exister sans section, une section sans chapitre, etc."
          },
          reuse: {
            title: "Réutilisation possible",
            description: "Les contenus peuvent être référencés dans plusieurs contextes. Une même page peut apparaître dans différentes sections si pertinent."
          },
          sharing: {
            title: "Partage entre cours",
            description: "Certains éléments peuvent être partagés entre différents cours pour éviter la duplication de contenu."
          }
        },

        evolution: {
          title: "Évolution de la structure",
          notice: "<strong>Note importante :</strong> La structure et les fonctionnalités de gestion des cours sont en constante évolution. De nouvelles options d'organisation, des outils de création avancés et des fonctionnalités collaboratives seront régulièrement ajoutés.",
          documentation: "Cette documentation sera mise à jour en conséquence pour refléter les dernières améliorations et bonnes pratiques."
        },

        nextSteps: {
          content: {
            title: "Création de Contenu",
            description: "Apprenez à rédiger et structurer le contenu pédagogique"
          },
          collaboration: {
            title: "Collaboration (Bientôt)",
            description: "Fonctionnalités de travail en équipe sur les cours"
          }
        }
      },

      content: {
        title: "Création de Contenu",
        intro: "Guide pour rédiger et structurer efficacement le contenu pédagogique",

        types: {
          title: "Types de contenu",
          description: "OCF prend en charge différents types de contenus pédagogiques pour s'adapter à vos méthodes d'enseignement et aux besoins d'apprentissage.",
          theoretical: {
            title: "Leçons théoriques",
            description: "Contenu explicatif avec texte, images et diagrammes. Idéal pour présenter les concepts et notions fondamentales.",
            tag1: "📝 Texte enrichi",
            tag2: "🖼️ Images",
            tag3: "📊 Diagrammes"
          },
          practical: {
            title: "Exercices pratiques",
            description: "Activités hands-on avec instructions et ressources. Permet aux apprenants de mettre en pratique les connaissances.",
            tag1: "⚡ Interactif",
            tag2: "🎯 Guidé",
            tag3: "💻 Terminal"
          },
          assessments: {
            title: "Évaluations",
            description: "Tests de connaissances et évaluations de compétences. Mesure la progression et valide les acquis.",
            tag1: "✅ QCM",
            tag2: "📝 Questions ouvertes",
            tag3: "📊 Scoring"
          },
          resources: {
            title: "Ressources",
            description: "Liens, documents et références complémentaires. Enrichit l'apprentissage avec du contenu externe.",
            tag1: "🔗 Liens",
            tag2: "📄 Documents",
            tag3: "🎥 Médias"
          }
        },

        tools: {
          title: "Outils de création",
          description: "La plateforme met à votre disposition plusieurs outils pour créer du contenu riche et engageant.",
          richEditor: {
            title: "Éditeur de texte enrichi",
            description: "Interface WYSIWYG pour la mise en forme du contenu textuel. Supports formatage, listes, liens et insertion de médias.",
            feature1: "Formatage du texte (gras, italique, couleurs)",
            feature2: "Listes à puces et numérotées",
            feature3: "Insertion d'images et de liens",
            feature4: "Blocs de code avec coloration syntaxique"
          },
          terminalIntegration: {
            title: "Intégration terminal",
            description: "Liaison directe avec les sessions terminal pour les exercices pratiques. Permet aux apprenants de pratiquer dans un environnement réel.",
            feature1: "Accès direct aux terminaux depuis les pages",
            feature2: "Exercices guidés step-by-step",
            feature3: "Validation automatique des commandes",
            feature4: "Environnements préconfigurés"
          },
          interactiveModules: {
            title: "Modules interactifs",
            description: "Création de contenus interactifs avancés avec widgets, simulations et éléments gamifiés.",
            badge: "Bientôt disponible"
          }
        },

        principles: {
          title: "Principes pédagogiques",
          description: "Appliquez ces principes pour créer du contenu pédagogiquement efficace :",
          clearObjectives: {
            title: "Objectifs d'apprentissage clairs",
            description: "Définissez explicitement ce que l'apprenant sera capable de faire après avoir terminé chaque page ou section.",
            exampleLabel: "Exemple :",
            exampleText: "\"À la fin de cette leçon, vous saurez créer et manipuler des variables en Python.\""
          },
          gradualProgression: {
            title: "Progression graduelle",
            description: "Introduisez les concepts de manière progressive, en vous appuyant sur les connaissances précédemment acquises.",
            exampleLabel: "Exemple :",
            exampleText: "Variables → Types → Opérations → Fonctions"
          },
          activeLearning: {
            title: "Apprentissage actif",
            description: "Alternez théorie et pratique. Proposez des exercices réguliers pour ancrer les connaissances.",
            exampleLabel: "Ratio recommandé :",
            exampleText: "30% théorie, 70% pratique"
          },
          immediateFeedback: {
            title: "Feedback immédiat",
            description: "Fournissez des retours rapides sur les exercices et évaluations pour maintenir l'engagement.",
            exampleLabel: "Méthodes :",
            exampleText: "Corrections automatiques, explications détaillées"
          }
        },

        writingTips: {
          title: "Conseils de rédaction",
          description: "Optimisez la qualité et l'efficacité de vos contenus avec ces recommandations :",
          languageStyle: {
            title: "Langage et style",
            tip1: "Utilisez un langage clair et accessible",
            tip2: "Évitez le jargon technique sans explication",
            tip3: "Privilégiez les phrases courtes et directes",
            tip4: "Adoptez un ton bienveillant et encourageant"
          },
          visualStructure: {
            title: "Structure visuelle",
            tip1: "Utilisez des titres et sous-titres explicites",
            tip2: "Aérez le texte avec des paragraphes courts",
            tip3: "Mettez en évidence les points importants",
            tip4: "Ajoutez des éléments visuels (images, schémas)"
          },
          validationExamples: {
            title: "Validation et exemples",
            tip1: "Illustrez chaque concept par des exemples concrets",
            tip2: "Proposez des cas d'usage réels",
            tip3: "Incluez des contre-exemples pour éviter les erreurs",
            tip4: "Testez vos exercices avant publication"
          },
          audienceAdaptation: {
            title: "Adaptation au public",
            tip1: "Adaptez le niveau de détail au public cible",
            tip2: "Proposez des parcours différenciés si nécessaire",
            tip3: "Incluez des prérequis clairement définis",
            tip4: "Anticipez les difficultés courantes"
          }
        },

        workflow: {
          title: "Workflow de création",
          description: "Suivez ce processus pour créer du contenu de qualité de manière efficace :",
          step1: {
            title: "Planification",
            description: "Définissez les objectifs, le public cible et la structure générale"
          },
          step2: {
            title: "Rédaction",
            description: "Créez le contenu en suivant les principes pédagogiques"
          },
          step3: {
            title: "Révision",
            description: "Relisez, corrigez et optimisez le contenu"
          },
          step4: {
            title: "Test",
            description: "Testez les exercices et validez la cohérence"
          },
          step5: {
            title: "Publication",
            description: "Publiez et collectez les retours pour amélioration"
          }
        },

        futureFeatures: {
          title: "Fonctionnalités à venir",
          description: "Les outils de création de contenu sont en développement actif. Voici un aperçu des fonctionnalités prévues :",
          soon: {
            title: "Prochainement",
            feature1: "Templates de pages prédéfinis",
            feature2: "Bibliothèque de ressources partagées",
            feature3: "Éditeur markdown avancé"
          },
          future: {
            title: "En développement",
            feature1: "Système de versions et collaboration",
            feature2: "Analytics et métriques d'engagement",
            feature3: "Import/export de contenus"
          }
        },

        resources: {
          title: "Ressources utiles",
          structure: {
            title: "Structure des cours",
            description: "Comprendre l'organisation hiérarchique des contenus"
          },
          pageManagement: {
            title: "Gestion des pages",
            description: "Accéder à l'interface de création et d'édition"
          },
          advancedGuide: {
            title: "Guide avancé (Bientôt)",
            description: "Techniques avancées de création de contenu"
          }
        }
      }
    },

    account: {
      subscription: {
        title: "Abonnement et plans",
        intro: "Ce que contient chaque formule, comment souscrire, changer de plan ou résilier, et comment lire votre tableau de bord d'abonnement.",

        catalogue: {
          title: "Les formules",
          description: "Quatre formules couvrent les usages, de la découverte à l'établissement. Elles se distinguent par la capacité de terminal (les tailles de machine que vous pouvez lancer en même temps), la durée maximale d'une session, la persistance des données et l'accès réseau.",
          ttc: "Les prix affichés dans l'application et sur la page Tarifs sont TTC. En cas de doute, la page Tarifs fait foi.",
          discovery: {
            title: "Découverte",
            price: "Gratuit",
            description: "Une machine XS éphémère, sessions d'une heure, historique des commandes 7 jours, sans accès réseau. Aucune carte bancaire n'est demandée."
          },
          solo: {
            title: "Solo",
            price: "11,90 € TTC / mois",
            description: "Pour apprendre et préparer ses supports : 1 XL ou 1 L ou 3 M en simultané, sessions jusqu'à 8 h, accès Internet, machines persistantes (5 Go), historique 90 jours."
          },
          trainer: {
            title: "Formateur",
            price: "19,90 € TTC / mois",
            description: "Pour animer des formations : mêmes machines que Solo, 20 Go de persistance, historique 365 jours, classes et supervision des sessions. Les sièges apprenants s'achètent séparément, à la journée ou au mois."
          },
          school: {
            title: "Écoles et organismes de formation",
            price: "Sur devis",
            description: "Capacité et tarifs négociés, licences attribuées administrativement à vos apprenants, facturation sur devis. Contactez-nous depuis la page Tarifs."
          },
          screenshot: "La page Plans disponibles, avec le plan actif signalé par le badge « Actuel »."
        },

        whereToFind: {
          title: "Où trouver ces pages",
          description: "Dans le menu latéral, la rubrique Abonnement & Licences regroupe :",
          dashboard: "Mon abonnement — votre tableau de bord : plan actif, utilisation, factures récentes.",
          plans: "Plans disponibles — la grille des formules pour souscrire ou changer de plan.",
          pricing: "Tarifs publics — la page Tarifs telle que la voient les visiteurs, ouverte dans un nouvel onglet.",
          licenses: "Acheter des licences et Gérer les licences — les sièges apprenants (formule Formateur)."
        },

        subscribe: {
          title: "Souscrire",
          description: "Depuis Plans disponibles, choisissez la vue grille ou le tableau comparatif (capacité, durée de session, stockage, réseau, supervision, historique des commandes), puis cliquez sur le bouton du plan voulu.",
          free: {
            title: "Plan Découverte",
            description: "Il s'active immédiatement, sans paiement ni carte bancaire. Vous arrivez sur votre tableau de bord avec le plan actif."
          },
          paid: {
            title: "Plan payant",
            description: "Une fenêtre récapitule le plan et son prix TTC, propose un code promo facultatif et vous demande de cocher la renonciation au délai de rétractation de 14 jours (le service démarre tout de suite). Vous êtes ensuite redirigé vers la page de paiement sécurisée Stripe ; à la fin, vous revenez dans l'application avec l'abonnement actif. Si vous annulez sur Stripe, vous revenez sur une page qui propose de réessayer."
          },
          emailVerified: "Un plan payant exige une adresse e-mail vérifiée. Si ce n'est pas encore fait, le bouton du plan vous renvoie vers la vérification.",
          screenshot: "La page Tarifs, publique, avec les quatre formules et la mention des prix TTC."
        },

        changePlan: {
          title: "Changer de plan",
          description: "Le bouton de chaque carte indique le sens du changement : Passer au plan supérieur ou Rétrograder.",
          upgrade: {
            title: "D'un plan payant à un autre",
            description: "Une confirmation précise que la différence est facturée immédiatement au prorata de la période en cours. Le nouveau plan s'applique aussitôt, sans repasser par Stripe."
          },
          fromFree: {
            title: "De Découverte à un plan payant",
            description: "C'est une nouvelle souscription : vous passez par la fenêtre de paiement décrite ci-dessus, et le plan gratuit est remplacé une fois le paiement effectué."
          },
          toFree: {
            title: "D'un plan payant à Découverte",
            description: "Après confirmation, l'abonnement en cours est résilié immédiatement puis le plan Découverte est activé. Vous n'êtes plus facturé."
          }
        },

        dashboard: {
          title: "Le tableau de bord Mon abonnement",
          description: "La carte Votre abonnement actif indique ce qui alimente vos terminaux en ce moment :",
          plan: "Le nom du plan et son type : Abonnement personnel, Licence attribuée ou Organisation.",
          source: "La source (qui paie) et, pour une licence attribuée, la personne qui vous l'a fournie.",
          priority: "La priorité du plan. Si vous cumulez plusieurs abonnements, celui de priorité la plus élevée est actif ; s'il expire, le suivant prend automatiquement le relais.",
          features: "Les fonctionnalités clés : capacité exprimée en tailles de machines (par exemple « 1 XL ou 1 L ou 3 M »), durée de session, stockage, accès réseau.",
          billing: "La date de prochaine facturation, ou la date de fin d'accès si une résiliation est programmée.",
          actions: "Pour un abonnement personnel payant, les boutons Gérer l'abonnement (portail Stripe), Changer de plan, Annuler ou Réactiver.",
          screenshot: "Le tableau de bord d'une formatrice dont le plan est fourni par son organisation."
        },

        usage: {
          title: "Mon utilisation",
          description: "Sous la carte, le panneau Mon utilisation se déplie pour montrer votre consommation en temps réel :",
          plan: "Le plan qui s'applique et sa source (personnel, ou fourni par votre organisation).",
          capacity: "La capacité du plan et la capacité restante, exprimées en tailles de machines encore lançables (« ≈ 1 L ou 2 M »).",
          bars: "Deux barres CPU et RAM : ce qu'occupent vos sessions actives sur le budget du plan.",
          sessions: "La liste des sessions actives : nom, taille, vCPU et mémoire, état (en cours ou en pause) et temps écoulé.",
          refresh: "Le panneau se rafraîchit toutes les 30 secondes ; le bouton de rafraîchissement force une mise à jour. Quand la capacité est épuisée, arrêtez une session pour pouvoir en lancer une autre.",
          orgPanel: "Si vous gérez une organisation, un second panneau montre l'utilisation de l'ensemble de ses membres : le budget est partagé entre eux."
        },

        sources: {
          title: "Personnel, organisation ou licence attribuée",
          description: "Un abonnement peut venir de trois sources. Le badge de la carte vous dit laquelle est active.",
          personal: {
            title: "Abonnement personnel",
            description: "Vous l'avez souscrit et vous le gérez : facturation, changement de plan, résiliation."
          },
          organization: {
            title: "Abonnement de l'organisation",
            description: "Votre organisation (école, organisme de formation, équipe) détient un plan et vous en héritez en tant que membre. Le plan appliqué à chaque rôle est configuré par l'administrateur de la plateforme avec l'organisation."
          },
          assigned: {
            title: "Licence attribuée",
            description: "Un siège acheté par un formateur ou une organisation vous a été attribué. Vous ne pouvez ni le modifier ni le résilier ; la section facturation et le menu Plans disponibles sont masqués. Dans le compositeur de session, seules les tailles permises par ce plan apparaissent."
          },
          assignedNote: "Avec une licence attribuée, vous ne pouvez pas rétrograder vers un plan inférieur, mais vous pouvez souscrire un abonnement personnel plus élevé — ou activer Découverte si vous n'avez jamais eu d'abonnement personnel."
        },

        cancel: {
          title: "Résilier et réactiver",
          description: "Le bouton Annuler du tableau de bord ouvre une confirmation avec deux options :",
          atPeriodEnd: "À la fin de la période payée — vous gardez l'accès jusqu'à la date indiquée, puis l'abonnement s'arrête. La carte affiche « Accès jusqu'au ».",
          immediately: "Immédiatement — l'abonnement s'arrête tout de suite.",
          reactivate: "Tant que la fin de période n'est pas atteinte, le bouton Réactiver annule la résiliation. Après une résiliation, le tableau de bord propose aussi de réactiver le dernier abonnement, ou d'activer le plan Découverte.",
          portal: "Le portail Stripe (bouton Gérer l'abonnement) permet aussi de mettre à jour la carte bancaire et de consulter les paiements ; voir la page Facturation."
        },

        nextSteps: {
          billing: {
            title: "Facturation et paiements",
            description: "Factures, adresses de facturation et moyens de paiement"
          },
          organizations: {
            title: "Organisations",
            description: "Comment une organisation partage son plan avec ses membres"
          },
          terminals: {
            title: "Sessions de terminal",
            description: "Composer une session avec les tailles permises par votre plan"
          }
        }
      },

      billing: {
        title: "Facturation et paiements",
        intro: "Où retrouver vos factures, renseigner une adresse de facturation et gérer vos moyens de paiement.",

        whereToFind: {
          title: "Où trouver ces pages",
          description: "Cliquez sur votre nom en haut à droite : la section Facturation et Paiement du menu contient Moyens de paiement, Adresses de facturation et Factures. Votre tableau de bord Mon abonnement affiche aussi vos trois factures les plus récentes.",
          verified: "Les pages Moyens de paiement et Adresses de facturation exigent une adresse e-mail vérifiée.",
          assigned: "Si votre plan vous est fourni par une organisation ou une licence attribuée, vous n'êtes pas facturé : ces pages restent accessibles mais vides."
        },

        invoices: {
          title: "Factures",
          description: "La page Factures liste toutes les factures émises pour votre compte, synchronisées depuis Stripe.",
          filter: "Filtrez par statut : toutes, payées, non payées, brouillons, annulées, remboursées ou partiellement remboursées.",
          refresh: "Le bouton Actualiser resynchronise la liste avec Stripe.",
          details: "Chaque facture affiche son numéro, son montant, sa date, son échéance et sa date de paiement ; une facture en retard est signalée.",
          download: "Télécharger ouvre le PDF de la facture ; Voir dans Stripe ouvre la page hébergée par Stripe, où vous pouvez aussi la régler si elle est en attente.",
          screenshot: "La page Factures d'un compte qui n'a encore rien acheté."
        },

        addresses: {
          title: "Adresses de facturation",
          description: "Une adresse de facturation figure sur vos factures. Vous pouvez en enregistrer plusieurs et en désigner une par défaut.",
          fields: "Champs disponibles : raison sociale, SIRET, numéro de TVA, adresse (deux lignes), code postal, ville, région, pays.",
          default: "L'adresse par défaut porte un badge ; le bouton Définir par défaut bascule sur une autre.",
          edit: "Ajoutez, modifiez ou supprimez une adresse avec les boutons de la liste."
        },

        paymentMethods: {
          title: "Moyens de paiement",
          description: "La page Moyens de paiement liste vos cartes bancaires enregistrées : marque, quatre derniers chiffres, date d'expiration, carte par défaut et alerte quand l'expiration approche.",
          add: "Pour ajouter ou remplacer une carte, le bouton Ajouter une carte ouvre le portail Stripe ; à votre retour, la liste est resynchronisée.",
          default: "Le bouton Définir par défaut choisit la carte utilisée pour les prochains prélèvements."
        },

        portal: {
          title: "Le portail Stripe",
          description: "OCF ne stocke aucune donnée de carte : les paiements et les cartes sont gérés par Stripe. Le portail s'ouvre depuis Gérer l'abonnement (tableau de bord) ou Ajouter une carte (moyens de paiement) et vous ramène ensuite dans l'application. Vous pouvez y :",
          card: "mettre à jour votre carte bancaire ;",
          history: "consulter l'historique des paiements ;",
          invoices: "télécharger vos factures."
        },

        nextSteps: {
          subscription: {
            title: "Abonnement et plans",
            description: "Souscrire, changer de plan, résilier"
          },
          licenses: {
            title: "Licences apprenants",
            description: "Acheter et attribuer des sièges à vos apprenants"
          },
          settings: {
            title: "Paramètres",
            description: "Langue, thème, sécurité du compte"
          }
        }
      },

      rolesAndPermissions: {
        title: "Rôles et permissions",
        intro: "Qui peut faire quoi : les deux rôles de plateforme, puis les rôles dans une organisation et dans une classe.",
        overviewTitle: "Vue d'ensemble",
        overviewDescription: "Les droits se lisent à trois niveaux. Sur la plateforme, tout le monde est « membre » ; ce sont vos rôles dans chaque organisation et chaque classe qui font la différence.",
        platformLevel: "Plateforme",
        platformLevelDesc: "Deux rôles seulement : membre et administrateur. Tous les utilisateurs réels — apprenants, formateurs, gestionnaires d'organisation — sont membres. L'administrateur est l'opérateur de la plateforme.",
        organizationLevel: "Organisation",
        organizationLevelDesc: "Membre, formateur, gestionnaire ou propriétaire. Le rôle décide qui administre l'organisation et qui peut y créer des classes.",
        groupLevel: "Classe",
        groupLevelDesc: "Membre (apprenant), gestionnaire (co-formateur) ou propriétaire (créateur de la classe).",
        orgRolesTitle: "Rôles dans une organisation",
        orgRolesDescription: "Le rôle se change depuis l'onglet Membres de l'organisation ; seul un propriétaire peut nommer un autre propriétaire.",
        permission: "Action",
        owner: "Propriétaire",
        manager: "Gestionnaire",
        teacher: "Formateur",
        member: "Membre",
        viewOrganization: "Voir l'organisation et ses membres",
        useOrgPlan: "Utiliser le plan de l'organisation dans ses terminaux",
        createClasses: "Créer et animer des classes",
        inviteMembers: "Ajouter ou importer des membres",
        removeMembers: "Retirer des membres",
        changeRoles: "Changer le rôle des membres",
        promoteToOwner: "Nommer un propriétaire",
        manageBilling: "Gérer l'abonnement de l'organisation",
        editOrgSettings: "Modifier les paramètres",
        deleteOrganization: "Supprimer l'organisation",
        transferOwnership: "Transférer la propriété",
        allowed: "Autorisé",
        partial: "Partiel",
        denied: "Non autorisé",
        cannotPromoteToOwner: "Peut attribuer membre, formateur ou gestionnaire, mais pas propriétaire",
        groupRolesTitle: "Rôles dans une classe",
        groupRolesDescription: "Une classe est un groupe de l'organisation. Le formateur qui la crée en est propriétaire ; il peut y ajouter des co-formateurs comme gestionnaires.",
        groupOwner: "Propriétaire",
        groupOwnerDesc: "Le créateur de la classe.",
        groupOwnerPerm1: "Tout ce que fait un gestionnaire",
        groupOwnerPerm2: "Nommer d'autres propriétaires ou gestionnaires",
        groupOwnerPerm3: "Archiver ou supprimer la classe",
        groupManager: "Gestionnaire",
        groupManagerDesc: "Un co-formateur.",
        groupManagerPerm1: "Assigner des scénarios et lancer des sessions pour la classe",
        groupManagerPerm2: "Suivre les apprenants en direct et intervenir dans leur terminal",
        groupManagerPerm3: "Ajouter ou retirer des apprenants, lire les analyses",
        groupMember: "Membre",
        groupMemberDesc: "Un apprenant.",
        groupMemberPerm1: "Lancer les scénarios assignés à la classe",
        groupMemberPerm2: "Utiliser le plan de l'organisation ou la licence qui lui est attribuée",
        groupMemberPerm3: "Voir sa propre progression",
        platformAdminTitle: "Administrateur de la plateforme",
        platformAdminNoticeTitle: "Réservé à l'opérateur",
        platformAdminNoticeDesc: "L'administrateur passe outre les rôles d'organisation et de classe et voit toutes les données. Ce n'est pas un rôle que vous pouvez attribuer : un gestionnaire d'école ou d'organisme est un membre avec le rôle propriétaire de son organisation. Dans l'interface, les éléments visibles uniquement grâce à ce rôle portent un badge.",
        scenariosTitle: "Questions fréquentes",
        scenario1Question: "Un gestionnaire peut-il supprimer l'organisation ?",
        scenario1Answer: "Non. Seul un propriétaire peut supprimer l'organisation ou en transférer la propriété.",
        scenario2Question: "Quel rôle donner à un formateur ?",
        scenario2Answer: "Formateur suffit pour créer des classes, y inscrire des apprenants et les suivre. Gestionnaire ajoute l'administration de l'organisation : membres, abonnement, paramètres.",
        scenario3Question: "Que se passe-t-il si le propriétaire quitte l'organisation ?",
        scenario3Answer: "Il doit d'abord transférer la propriété à un autre membre. Un compte ne peut d'ailleurs pas être supprimé tant qu'il possède une organisation ou une classe.",
        scenario4Question: "Puis-je cumuler des rôles ?",
        scenario4Answer: "Oui. Vous pouvez être propriétaire d'une organisation, formateur dans une autre, et apprenant dans une classe d'une troisième. Le menu utilisateur permet de changer d'organisation active.",
        reference: {
          title: "Référence technique",
          description: "Pour les intégrateurs, la référence des permissions liste chaque endpoint de l'API avec son rôle de plateforme et sa règle d'accès.",
          button: "Ouvrir la référence des permissions"
        }
      },

      settings: {
        title: "Paramètres et préférences",
        intro: "Les pages Paramètres règlent votre page d'accueil, votre langue, l'apparence, les notifications, votre mot de passe et vos clés d'accès terminal.",
        overview: {
          title: "Accéder aux paramètres",
          description: "Cliquez sur votre nom en haut à droite, puis sur Paramètres. Un menu latéral dédié remplace la navigation habituelle ; la flèche en haut du menu ramène à l'application.",
          autosave: "Chaque réglage est enregistré dès que vous le changez ; une notification confirme l'enregistrement."
        },
        navigation: {
          title: "Navigation",
          description: "Page d'accueil par défaut : la page ouverte après connexion et quand vous cliquez sur le logo OCF.",
          defaultPage: {
            title: "Choix proposés",
            description: "Tableau de bord d'abonnement, Sessions de terminal, Mes classes ou Groupes (selon les fonctionnalités ouvertes sur la plateforme). Sans choix explicite, un formateur qui gère des classes dans son organisation active arrive sur Mes classes ; les autres sur Sessions de terminal."
          }
        },
        localization: {
          title: "Localisation",
          description: "Langue de l'interface et fuseau horaire.",
          language: {
            title: "Langue préférée",
            description: "Français ou anglais. Le changement s'applique immédiatement à toute l'interface, aide comprise. Le sélecteur de langue en haut de l'écran fait la même chose."
          },
          timezone: {
            title: "Fuseau horaire",
            description: "Automatique (celui de votre navigateur) ou un fuseau fixe. Il sert à afficher les dates et heures : sessions, factures, historique."
          },
          screenshot: "La page Localisation."
        },
        ui: {
          title: "Interface utilisateur",
          description: "Apparence de l'application.",
          theme: {
            title: "Thème",
            description: "Clair, Sombre ou Auto (suit votre système). Voir la page Mode sombre et thèmes."
          },
          compact: {
            title: "Mode compact",
            description: "Réduit les espacements pour afficher plus de contenu à l'écran."
          },
          screenshot: "La page Interface utilisateur."
        },
        notifications: {
          title: "Notifications",
          description: "Deux cases à cocher : Notifications par e-mail et Notifications bureau (notifications du navigateur)."
        },
        security: {
          title: "Sécurité",
          description: "La page affiche la date du dernier changement de mot de passe et permet d'en définir un nouveau.",
          password: {
            title: "Changer le mot de passe",
            description: "Saisissez le mot de passe actuel, puis le nouveau deux fois. Les deux saisies doivent être identiques et le mot de passe suffisamment robuste."
          },
          deleteAccount: {
            title: "Supprimer mon compte",
            description: "En bas de la page, la zone de danger supprime définitivement votre compte : sessions de terminal, clés SSH, historique des scénarios et appartenances sont effacés ; les factures et paiements sont anonymisés et conservés pour la comptabilité. Vous devez d'abord transférer la propriété des organisations et classes que vous possédez. La suppression demande de recopier un texte de confirmation."
          }
        },
        sshKeys: {
          title: "Clés d'accès terminal",
          description: "La dernière entrée du menu gère vos clés SSH pour vous connecter aux sessions depuis votre propre terminal.",
          linkText: "Le détail est dans le guide des clés SSH de la rubrique Terminaux.",
          button: "Guide des clés SSH"
        },
        version: {
          title: "Version de l'application",
          description: "Les numéros de version de l'interface, de l'API et du service de terminaux figurent dans le menu utilisateur, section À propos. Indiquez-les quand vous signalez un problème."
        },
        nextSteps: {
          themes: {
            title: "Mode sombre et thèmes",
            description: "Choisir et changer le thème"
          },
          sshKeys: {
            title: "Clés SSH",
            description: "Se connecter à une session depuis son propre terminal"
          },
          roles: {
            title: "Rôles et permissions",
            description: "Qui peut faire quoi dans une organisation ou une classe"
          }
        }
      },
      themes: {
        title: "Mode sombre et thèmes",
        intro: "L'application propose un thème clair, un thème sombre et un mode automatique. Le choix est enregistré avec votre compte et s'applique partout, terminaux compris.",
        selection: {
          title: "Les trois modes",
          light: {
            title: "Clair",
            description: "Fonds clairs, texte sombre. Le thème par défaut."
          },
          dark: {
            title: "Sombre",
            description: "Fonds sombres, texte clair : moins de fatigue en faible luminosité."
          },
          auto: {
            title: "Auto (Système)",
            description: "Suit le réglage clair/sombre de votre système d'exploitation ou de votre navigateur, et bascule avec lui."
          }
        },
        whereToChange: {
          title: "Où changer le thème",
          description: "Menu utilisateur (votre nom en haut à droite) > Paramètres > Interface utilisateur > Thème. Le changement est immédiat et enregistré.",
          compact: "La même page propose le mode compact, qui resserre les espacements.",
          button: "Voir le guide des paramètres",
          screenshot: "La page Interface utilisateur, où se choisit le thème."
        },
        nextSteps: {
          settings: {
            title: "Paramètres et préférences",
            description: "Langue, page d'accueil, notifications, sécurité"
          },
          gettingStarted: {
            title: "Premiers pas avec les terminaux",
            description: "Lancer votre première session"
          },
          subscription: {
            title: "Abonnement et plans",
            description: "Votre plan et ce qu'il permet"
          }
        }
      }
    },

    organizations: {
      overview: {
        title: "Organisations",
        intro: "Une organisation est l'endroit où un formateur, une école ou un organisme de formation réunit son monde : des membres et leurs rôles, des classes, une bibliothèque de scénarios, et un forfait sous lequel tout le monde travaille. Votre espace personnel en est une aussi — celle qui est venue avec votre compte.",
        types: {
          title: "Personnelle ou d'équipe",
          description: "Chaque compte a une organisation personnelle ; enseigner demande une organisation d'équipe.",
          personal: {
            title: "Organisation personnelle",
            description: "Créée avec votre compte, pour vous seul. Elle porte votre propre forfait (Découverte, Solo, Formateur), vos propres terminaux et scénarios. Elle n'accueille jamais de classe."
          },
          team: {
            title: "Organisation d'équipe",
            description: "Des membres avec des rôles, des classes, l'importation groupée, une bibliothèque de scénarios, et les sessions terminal de tous les membres au même endroit. Dimensionnée à la création : un nombre maximum de groupes et de membres."
          },
          caption: "La page Organisations : l'organisation personnelle à gauche, une organisation d'équipe avec son forfait et ses boutons Importer / Gérer / Voir à droite.",
          compare: "« Afficher la comparaison » sur la page Organisations met les deux côte à côte."
        },
        switcher: {
          title: "Travailler dans une organisation à la fois",
          description: "Toute l'application suit l'organisation dans laquelle vous êtes : « Mes classes » liste ses classes, le catalogue de scénarios montre ce qui y est assigné ou partagé, et les tailles de terminal proposées viennent de son forfait.",
          how: "Pour changer : ouvrez le menu sous votre nom, en haut à droite. La section Organisation montre l'organisation courante et, quand vous appartenez à plusieurs, « Changer d'organisation »."
        },
        creating: {
          title: "Créer une organisation d'équipe",
          description: "Créer une organisation demande un forfait qui couvre l'enseignement — Formateur, ou un forfait École / Organisme de formation. Avec un autre forfait, le formulaire est refusé avec un message qui renvoie au forfait Formateur.",
          step1: {
            title: "Cliquez sur « Créer une organisation »",
            description: "Sur la page Organisations — en haut à droite, ou dans le bandeau « Animer une classe ». « Mes classes » propose le même bouton tant que vous êtes dans votre espace personnel."
          },
          step2: {
            title: "Remplissez le formulaire",
            description: "Un nom (l'identifiant : lettres minuscules, chiffres et tirets), un nom d'affichage, une description, et les limites : groupes maximum et membres maximum."
          },
          step3: {
            title: "Ouvrez-la et faites entrer du monde",
            description: "« Gérer » sur sa carte ouvre la page de l'organisation. Ajoutez des membres un par un, ou importez une cohorte entière par CSV (guide ci-dessous)."
          },
          button: "Ouvrir Organisations"
        },
        page: {
          title: "La page d'une organisation",
          description: "« Gérer » sur une carte ouvre l'organisation sur sept onglets :",
          caption: "La page d'une organisation : ses membres et ses groupes dans l'en-tête, et les onglets d'Aperçu à Paramètres.",
          overview: "<strong>Aperçu</strong> — l'identité (nom, nom d'affichage, type, statut) et les limites : groupes et membres maximum et actuels.",
          members: "<strong>Membres</strong> — qui est dans l'organisation et avec quel rôle (ci-dessous).",
          groups: "<strong>Groupes</strong> — les classes de l'organisation.",
          scenarios: "<strong>Scénarios</strong> — la bibliothèque de l'organisation : les scénarios créés ou importés ici, disponibles pour toutes les classes.",
          sessions: "<strong>Sessions des apprenants</strong> — les sessions terminal de tous les membres : apprenant, nom, statut, dates de création et d'expiration. Avec recherche et filtre par statut.",
          subscription: "<strong>Abonnement</strong> — le forfait sous lequel l'organisation fonctionne (ci-dessous).",
          settings: "<strong>Paramètres</strong> — la conversion d'une organisation personnelle en organisation d'équipe, le délai de conservation des données, et la suppression (propriétaire seulement)."
        },
        members: {
          title: "Membres et rôles",
          description: "« Ajouter un membre » dans l'onglet Membres retrouve un compte existant par nom ou e-mail et lui donne un rôle. Les rôles, du moins au plus étendu :",
          member: "<strong>Membre</strong> — un apprenant. Travaille dans l'organisation, suit les scénarios assignés, ne voit aucune administration.",
          teacher: "<strong>Formateur</strong> — peut créer et animer des classes : assigner des scénarios, suivre les apprenants en direct, lire les résultats.",
          manager: "<strong>Gestionnaire</strong> — un formateur qui administre aussi l'organisation : les membres et leurs rôles, les importations groupées, la régénération des mots de passe.",
          owner: "<strong>Propriétaire</strong> — tout, plus le délai de conservation et la suppression de l'organisation.",
          offboarding: "Un membre marqué parti lors de l'archivage d'une classe apparaît « Désinscrit » avec la date à laquelle son compte sera effacé. « Réintégrer » annule ; « Effacer maintenant » n'attend pas la date. L'ajouter de nouveau par e-mail le réintègre aussi."
        },
        plans: {
          title: "Sous quel forfait fonctionne une organisation",
          inherited: "<strong>Par défaut, une organisation d'équipe n'a pas de forfait à elle</strong> : elle utilise celui de la personne qui y travaille. Un formateur souscrit Formateur à titre personnel, et les organisations qu'il possède suivent — la carte indique « Hérité ». Rien n'est acheté pour l'organisation elle-même.",
          dedicated: "<strong>Les écoles et les organismes de formation ont un forfait dédié</strong>, mis en place par l'équipe de la plateforme sur devis — la carte indique « Plan dédié ». Les membres travaillent alors sous ce forfait, quel que soit le leur.",
          roles: "Dans une organisation à forfait dédié, l'équipe de la plateforme peut associer un rôle à un forfait : les apprenants (membres) tournent alors sur un forfait de siège apprenant tandis que les formateurs gardent le forfait complet.",
          seats: "Des sièges apprenant s'achètent aussi par lots et s'attribuent un par un — voir Licences en volume."
        },
        nextSteps: {
          classes: {
            title: "Qu'est-ce qu'une classe ?",
            description: "Enseigner au sein de l'organisation"
          },
          bulkImport: {
            title: "Importation groupée",
            description: "Comptes, groupes et adhésions depuis des fichiers CSV"
          },
          roles: {
            title: "Rôles et permissions",
            description: "Ce que chaque rôle peut faire, en détail"
          }
        }
      },

      groups: {
        title: "Groupes et hiérarchie",
        intro: "Une classe est un groupe : même objet, mêmes pages. Le menu Groupes en est la vue à l'échelle de l'organisation, à côté de « Mes classes », qui est la console de celles que vous animez.",
        classes: {
          title: "Pour enseigner, passez par « Mes classes »",
          description: "Créer une classe, ajouter des apprenants, assigner des scénarios, suivre la classe en direct, lire les résultats et archiver se font depuis « Mes classes » et les cinq pages d'une classe. Ces guides sont dans la section Classes.",
          button: "La section Classes"
        },
        list: {
          title: "La page Groupes",
          description: "Groupes dans le menu liste tous les groupes de l'organisation courante — y compris ceux que vous n'animez pas — sous forme de cartes :",
          card: "Une carte montre l'état (active, archivée, expirée ou complète), le nombre de membres, l'organisation et le groupe parent. Pour une classe que vous animez, elle montre aussi combien d'apprenants sont connectés.",
          open: "Cliquer sur une carte ouvre la classe sur sa page En direct.",
          scope: "La liste suit l'organisation dans laquelle vous êtes ; changez d'organisation pour voir les groupes d'une autre.",
          access: "La page est ouverte aux rôles Formateur, Gestionnaire et Propriétaire, avec un forfait qui couvre l'enseignement."
        },
        hierarchy: {
          title: "La hiérarchie des groupes",
          description: "« Hiérarchie des groupes » dans le même menu dessine l'arbre : organisation, groupes, sous-groupes.",
          tree: "Dépliez ou repliez tout, cherchez un groupe par son nom, et cochez « Afficher les archivés » pour inclure les classes clôturées.",
          counts: "Chaque groupe affiche ses membres directs et son total sous-groupes compris.",
          move: "Glissez un groupe sur un autre pour le déplacer sous ce parent. Les organisations elles-mêmes ne se déplacent pas.",
          details: "« Voir les détails » ouvre les pages du groupe."
        },
        subgroups: {
          title: "Les sous-groupes",
          description: "Un sous-groupe se crée depuis la page Réglages d'une classe (« Ajouter un sous-groupe ») ou en choisissant un groupe parent dans le formulaire de classe. C'est une classe à part entière, et ses membres sont aussi listés dans la classe parente, avec son nom en badge."
        },
        nextSteps: {
          overview: {
            title: "Qu'est-ce qu'une classe ?",
            description: "La console et les cinq pages d'une classe"
          },
          settings: {
            title: "Réglages et archivage",
            description: "Sous-groupes, limites, clôture d'une classe"
          }
        }
      },

      bulkImport: {
        title: "Importation groupée",
        intro: "Créez les comptes, les classes et les adhésions d'une cohorte entière à partir de fichiers CSV. Rien n'est écrit avant que vous ayez vu ce que l'import va faire.",
        where: {
          title: "Où et qui",
          description: "Depuis la page de l'organisation, « Importation groupée » — ou « Importer » sur la carte de l'organisation. L'import est réservé aux gestionnaires et propriétaires de l'organisation.",
          caption: "La page d'importation groupée : trois zones de dépôt, puis les options."
        },
        files: {
          title: "Les trois fichiers",
          description: "« Télécharger des exemples » vous donne un modèle de chacun. Virgule, point-virgule et tabulation sont tous détectés.",
          users: {
            title: "CSV des utilisateurs (requis)",
            description: "Une ligne par personne. Requis : <code>email</code> et <code>name</code> — ou <code>first_name</code> et <code>last_name</code>. Facultatifs : <code>password</code> (généré s'il manque — la personne devra le changer à sa première connexion), <code>role</code> (laissez-le vide), <code>external_id</code> (votre propre identifiant, par exemple un numéro d'étudiant)."
          },
          groups: {
            title: "CSV des groupes (facultatif)",
            description: "Une ligne par classe à créer : <code>group_name</code> (identifiant), <code>display_name</code>, <code>description</code>, <code>parent_group</code> (pour un sous-groupe), <code>max_members</code>, <code>expires_at</code>, <code>external_id</code>."
          },
          memberships: {
            title: "CSV des adhésions (facultatif)",
            description: "Qui va où : <code>user_email</code>, <code>group_name</code>, <code>role</code> — <code>member</code> pour un apprenant, <code>teacher</code>, <code>manager</code> ou <code>owner</code> pour l'encadrement."
          },
          nameSplit: "Une colonne <code>name</code> unique est découpée en prénom et nom. Ouvrez l'aperçu du fichier des utilisateurs (« Aperçu » sur la zone de dépôt) pour vérifier et ajuster la coupe ligne par ligne."
        },
        options: {
          title: "Les options",
          update: "<strong>Mettre à jour les utilisateurs existants si trouvés</strong> — un e-mail déjà connu est mis à jour au lieu d'être ignoré.",
          verified: "<strong>Marquer les adresses e-mail importées comme vérifiées</strong> — coché par défaut : l'organisation se porte garante des adresses, les apprenants se connectent tout de suite. Décochez pour que chaque apprenant confirme d'abord son adresse par e-mail.",
          target: "<strong>Groupe cible</strong> — chaque utilisateur importé est ajouté à cette classe, en plus du fichier des adhésions. Le plus simple pour remplir une seule classe."
        },
        run: {
          title: "Valider, puis importer",
          step1: {
            title: "« Valider & importer »",
            description: "Les fichiers sont lus et l'import entier est simulé. Rien n'est encore écrit."
          },
          step2: {
            title: "Lisez le résumé",
            description: "Combien d'utilisateurs seront créés, mis à jour ou ignorés, combien de groupes et d'adhésions, puis les avertissements et les erreurs avec leur ligne et leur champ. En cas d'erreur, « Retour », corrigez le fichier, et validez de nouveau."
          },
          step3: {
            title: "« Procéder à l'import »",
            description: "L'import s'exécute ; ne fermez pas la fenêtre. L'écran de résultat donne les compteurs et, si des lignes ont échoué, les erreurs."
          },
          step4: {
            title: "Téléchargez les identifiants",
            description: "Quand des mots de passe ont été générés, l'écran de résultat en propose un CSV. C'est la seule fois où ils s'affichent : téléchargez-le avant de fermer. Plus tard, les mots de passe se régénèrent pour les apprenants sélectionnés depuis la page Apprenants d'une classe — par un gestionnaire ou propriétaire de l'organisation."
          }
        },
        nextSteps: {
          classes: {
            title: "Ajouter des apprenants",
            description: "Les mêmes étapes vues depuis la classe"
          },
          overview: {
            title: "Organisations",
            description: "Membres, rôles et forfaits"
          }
        }
      },

      bulkLicenses: {
        title: "Licences en volume",
        intro: "Des sièges apprenant achetés par lots, puis attribués un par un aux personnes qui en ont besoin. Pour les formateurs dont les apprenants ne sont pas couverts par un forfait d'organisation.",
        what: {
          title: "Ce qu'est un siège",
          description: "Un siège donne à un apprenant un forfait à lui pour une période — un nombre de jours, ou un mois — afin qu'il lance des terminaux et des scénarios dans les limites de ce forfait. Les sièges s'achètent par lot ; un lot s'attribue, s'agrandit ou s'annule ensuite.",
          eligibility: "Acheter des sièges demande un forfait qui le permet (Formateur). Avec un autre forfait, la page indique « Votre plan ne permet pas d'acheter des sièges pour des apprenants »."
        },
        purchase: {
          title: "Acheter un lot",
          description: "« Acheter des Licences » dans le menu Abonnement, ou « Acheter plus de licences » depuis la page de gestion des licences.",
          step1: {
            title: "Décrivez votre classe",
            description: "Combien d'apprenants, et pour combien de temps : de 1 à 10 jours, ou un mois."
          },
          step2: {
            title: "Comparez ce que ça coûte",
            description: "Chaque produit de siège qui convient est chiffré — total, quantité en sièges-mois ou apprenants-jours, et prix par apprenant. Quand plusieurs s'appliquent, le moins cher est signalé. Choisissez-en un."
          },
          step3: {
            title: "Options, puis confirmation",
            description: "Liez éventuellement le lot à une classe et saisissez un code promo. Le récapitulatif reprend forfait, quantité et classe ; « Finaliser l'achat » mène au paiement. Votre adresse e-mail doit être vérifiée pour acheter."
          },
          after: "Après paiement, vous arrivez sur la gestion des licences pendant que les sièges sont provisionnés — quelques secondes. S'ils tardent, la page le dit ; rien à faire."
        },
        manage: {
          title: "Gérer un lot",
          description: "« Gérer les Licences » dans le menu Abonnement liste vos lots : forfait, total, attribuées, disponibles, taux d'utilisation, date de renouvellement, statut.",
          batch: "<strong>Voir les détails</strong> ouvre le lot : ses sièges, filtrables (tous, attribués, disponibles) et cherchables.",
          assign: "<strong>Attribuer une licence</strong> — cherchez un utilisateur par nom ou e-mail et donnez-lui un siège. C'est immédiat.",
          revoke: "<strong>Révoquer</strong> — reprend un siège : l'apprenant perd l'accès immédiatement et le siège redevient disponible. Plusieurs peuvent être révoqués d'un coup.",
          add: "<strong>Ajouter</strong> — agrandit le lot.",
          delete: "<strong>Supprimer</strong> — retire des sièges disponibles du lot (révoquez d'abord ceux qui sont attribués) ; un avoir au prorata peut suivre. Un lot annulé se supprime définitivement depuis la liste."
        },
        nextSteps: {
          organizations: {
            title: "Organisations",
            description: "Quand un forfait d'organisation couvre les apprenants à la place"
          },
          subscription: {
            title: "Abonnement et forfaits",
            description: "Votre propre forfait et ce qu'il permet"
          }
        }
      }
    },

    scenarios: {
      gettingStarted: {
        title: "Premiers pas avec les scénarios",
        intro: "Un scénario est un exercice guidé : une vraie machine Linux d'un côté, les consignes de l'autre, et un bouton Vérifier qui contrôle votre travail étape après étape. Cette page suit un scénario du catalogue jusqu'à votre historique.",
        catalogue: {
          title: "Le catalogue Scénarios",
          description: "Ouvrez Scénarios › Scénarios. Chaque carte est un scénario que vous pouvez lancer : ceux que votre classe ou votre organisation vous a attribués, et les scénarios publics. Le champ de recherche filtre par titre.",
          shot: "Le catalogue : trois cartes de scénario avec leurs badges de difficulté, de durée, d'image et de taille, et un bouton Lancer sur chacune.",
          card: "Une carte affiche la difficulté (Débutant, Intermédiaire, Avancé), la durée estimée, l'image sur laquelle il tourne et la taille de machine qu'il demande. Survolez un badge pour les détails.",
          language: "Un scénario proposé en plusieurs langues affiche un sélecteur Langue au-dessus de son bouton. Choisissez avant de lancer : la machine est construite dans cette langue et ne peut pas être reconstruite ensuite.",
          unavailable: "Une carte grisée avec l'encart Scénario indisponible ne peut pas être lancée pour l'instant, et dit pourquoi : la taille demandée n'est pas dans votre offre, vos sessions en cours consomment toute votre capacité, le serveur est hors ligne, ou aucune image compatible n'existe. La seconde ligne de l'encart dit ce qui débloquerait la situation."
        },
        launch: {
          title: "Lancer",
          description: "Cliquez sur Lancer. Un écran de préparation suit les trois phases : création de votre terminal, installation des paquets et configuration de l'environnement, exécution des scripts de mise en place du scénario. Cela prend en général moins d'une minute ; Annuler reste disponible si vous changez d'avis.",
          budget: "Une session de scénario est une session terminal : elle compte sur le même budget CPU et RAM que les sessions que vous créez à la main, et apparaît dans Mes sessions comme les autres.",
          existing: "Si vous avez déjà une exécution de ce scénario en cours, la carte indique Scénario en cours et son bouton devient Reprendre. Une exécution terminée transforme le bouton en Relancer, à côté de Revoir."
        },
        player: {
          title: "Le lecteur",
          description: "Une fois prêt, vous arrivez sur la vue de session en mode scénario : le terminal à gauche, le panneau d'étape à droite, et une séparation redimensionnable entre les deux.",
          shot: "Le lecteur : le briefing en haut, le terminal à gauche avec ses boutons Arrêter et Détruire, le panneau d'étape à droite avec Vérifier et Réinitialiser étape, et les points de progression en bas.",
          briefing: "La carte Briefing du scénario en haut est l'introduction du scénario. Fermez-la avec le bouton en dessous ; le bouton Briefing du scénario de la barre supérieure la ramène.",
          terminal: "Le terminal se comporte exactement comme une session seule : bandeau d'enregistrement, état de connexion, temps restant, Arrêter (sessions persistantes seulement) et Détruire. En dessous, Historique des commandes, et Flags trouvés quand le scénario utilise des flags.",
          panel: "Le panneau d'étape affiche le titre et les consignes de l'étape en cours. Certaines commandes des consignes sont cliquables : un clic colle la commande dans le terminal. En bas, Étape n / total et un point par étape montrent où vous en êtes ; les étapes précédentes peuvent être rouvertes pour relecture, puis Retour à l'étape en cours.",
          abandon: "Abandonner le scénario, en haut à droite, met fin à l'exécution pour de bon après confirmation. La session reste dans votre historique comme Abandonnée ; vous pouvez relancer une nouvelle exécution depuis le catalogue."
        },
        stepTypes: {
          title: "Les quatre types d'étape",
          terminal: "Terminal — faites quelque chose dans la machine, puis cliquez sur Vérifier. Un script contrôle le résultat ; si ce n'est pas encore bon, le panneau le dit et vous réessayez.",
          info: "Lecture — du texte seulement, pas d'exercice. Cliquez sur J'ai lu, suivant pour avancer.",
          flag: "Flag — l'étape demande une réponse : un jeton caché quelque part dans la machine, ou un mot que vous devez trouver. Tapez-le dans le champ et Soumettre. Les flags validés apparaissent dans le panneau Flags trouvés sous le terminal.",
          quiz: "Quiz — une ou plusieurs questions : choix multiple, réponses multiples, vrai/faux ou texte libre. Répondez à toutes, puis Soumettre les réponses. Selon le scénario vous voyez soit seulement votre score, soit les bonnes réponses avec une explication. Vous pouvez refaire le quiz, puis Étape suivante ou Terminer le scénario."
        },
        help: {
          title: "Quand vous êtes bloqué",
          hints: "Les indices, quand l'étape en a, se révèlent un niveau à la fois avec Révéler l'indice 1, Révéler l'indice 2… Le compteur indique Indices : utilisés/total. Votre formateur voit combien d'indices vous avez utilisés.",
          reset: "Réinitialiser étape reconstruit la machine pour l'étape en cours seulement, en gardant ce que les étapes précédentes ont fait. Utilisez-le quand vous avez rendu l'étape impossible à finir (un fichier supprimé, un service cassé). Une confirmation est demandée.",
          preparing: "Entre deux étapes, le panneau peut afficher Préparation de l'étape suivante… pendant qu'il installe ce dont l'étape a besoin. Si cela échoue, le panneau le dit clairement : ce n'est pas une énigme. Cliquez sur Relancer la préparation ; si l'échec persiste, prévenez votre formateur.",
          crashTraps: "Certains scénarios de type défi arment des pièges : un plantage du conteneur met fin à l'exécution et remet votre progression à zéro, et la session est toujours éphémère. Le briefing du scénario le précise."
        },
        endings: {
          title: "Comment une exécution se termine",
          completed: "Terminée — après la dernière étape, le panneau affiche Scénario terminé avec vos résultats : étapes accomplies et temps passé. Le terminal reste ouvert jusqu'à son expiration ou jusqu'à ce que vous le détruisiez.",
          abandoned: "Abandonnée — vous avez cliqué sur Abandonner le scénario, dans le lecteur ou dans votre historique.",
          expired: "Expirée — le terminal a atteint sa durée limite avant la dernière étape. Relancez le scénario pour recommencer."
        },
        history: {
          title: "Votre historique de scénarios",
          description: "Scénarios › Historique des scénarios liste toutes vos exécutions, regroupées par scénario, avec les onglets Tous, Actifs, Terminés et Abandonnés. Une carte affiche la progression (étapes validées / total), la date de début et, quand le scénario note, votre note.",
          shot: "Historique des scénarios : deux exécutions du même scénario, une Active avec Reprendre et Abandonner, une Abandonnée avec Revoir.",
          resume: "Reprendre rouvre le lecteur d'une exécution active.",
          review: "Revoir ouvre une exécution terminée en lecture seule : le terminal n'est plus là, mais les étapes et votre historique de commandes y sont toujours.",
          abandon: "Abandonner met fin à une exécution active sans l'ouvrir. C'est irréversible."
        },
        nextSteps: {
          terminals: "Comment fonctionne le terminal sous un scénario.",
          managing: "Où une session de scénario apparaît parmi vos autres sessions.",
          creation: "Pour les formateurs : concevoir vos propres scénarios."
        }
      },

      creation: {
        title: "Créer des scénarios",
        intro: "En tant que formateur, vous concevez vos scénarios dans l'Éditeur de scénarios : un nœud scénario, des étapes enchaînées l'une après l'autre, et pour chaque étape le texte que l'apprenant lit et les scripts qui la préparent et la vérifient. Cette page parcourt l'éditeur et les outils d'import, d'archivage et de santé autour de lui.",
        access: {
          title: "Qui peut ouvrir l'éditeur",
          description: "Scénarios › Éditeur de scénarios est accessible aux gestionnaires et propriétaires d'une organisation ou d'une classe, et aux administrateurs de la plateforme. Un apprenant qui suit le lien est renvoyé vers ses sessions.",
          shot: "Le catalogue vu par un formateur : les scénarios de l'organisation, prêts à lancer, avec le sélecteur de langue sur celui qui est multilingue."
        },
        layout: {
          title: "L'éditeur en un coup d'œil",
          description: "La page a trois zones. À gauche, la bibliothèque de nœuds : glissez un type de nœud sur le canevas, ou cliquez dessus pour l'ajouter au centre. Au centre, le canevas : les nœuds et les liens entre eux. À droite, une liste repliable de tous les scénarios et de leurs étapes, depuis laquelle vous pouvez glisser des étapes d'autres scénarios dans le vôtre comme modèles.",
          header: "La barre du haut contient le sélecteur de scénario, Créer Nouveau, le sélecteur de langue quand le scénario est multilingue, un compteur de nœuds et de liens, Jouer comme apprenant, Réinitialiser, Enregistrer et un menu ⋮ avec les actions d'export, de copie, d'archivage et d'import.",
          readOnly: "Un scénario que vous ne pouvez pas modifier (un scénario de la plateforme, ou celui d'une autre organisation) s'ouvre en lecture seule, avec un bandeau. Copier vers une organisation, dans le menu ⋮, en crée une copie modifiable dans l'une des vôtres."
        },
        scenario: {
          title: "Créer un scénario",
          description: "Cliquez sur Créer Nouveau. La fenêtre du scénario a des onglets :",
          general: "Général — nom, titre, difficulté, durée estimée, description, et Emplacement de création : une organisation, une de vos classes (le scénario lui est alors attribué automatiquement), ou la plateforme pour les administrateurs.",
          content: "Contenu — des textes en Markdown : l'introduction affichée avant la première étape (le briefing), le texte de fin, les objectifs et les prérequis.",
          setup: "Installation — le script d'installation global, exécuté une fois à la création du terminal de l'apprenant, avant l'étape 1. Servez-vous-en pour installer des paquets et disposer des fichiers.",
          options: "Options — la taille de machine sur laquelle le scénario tourne, le nom d'hôte du conteneur, le type d'OS, et trois interrupteurs : Activer les drapeaux CTF, Activer les pièges de crash (mode challenge : tous les flags sont déployés au départ et un plantage remet la progression à zéro), et Public, qui propose le scénario à tous les utilisateurs.",
          languages: "Langues — la langue dans laquelle le scénario est écrit, et les autres langues dans lesquelles vous le proposez. Cocher une seconde langue active l'éditeur de traduction : un sélecteur de langue apparaît dans la barre du haut et dans chaque fenêtre, avec un indicateur de couverture, et vous traduisez titres et textes langue par langue. Les scripts sont communs à toutes les langues.",
          vocabulary: "Vocabulaire — disponible une fois le scénario enregistré. Il nomme les objets auxquels un script fait référence (un fichier, un répertoire, un service) pour qu'un seul script fonctionne dans toutes les langues : traduisez les noms ici, pas les scripts."
        },
        steps: {
          title: "Ajouter des étapes",
          description: "Glissez un type d'étape depuis la bibliothèque sur le canevas, ou survolez un lien et cliquez sur son + pour insérer une étape entre deux autres. Il existe quatre types ; le type décide des onglets que la fenêtre d'étape affiche.",
          terminal: "Terminal — l'apprenant travaille dans la machine et clique sur Vérifier. Onglets : Contenu, Indices, Vérification, Arrière-plan, Premier plan, Effets.",
          info: "Info — du texte à lire, rien à faire. Onglets : Contenu, Effets.",
          flag: "Flag — l'apprenant soumet une réponse. Onglets : Contenu, Indices, Arrière-plan, Effets, plus le chemin et le niveau du flag.",
          quiz: "Quiz — des questions. Onglets : Contenu, Indices, Questions, Effets."
        },
        stepDialog: {
          title: "Remplir une étape",
          content: "Contenu — le titre et les consignes, en Markdown. Une commande marquée avec le marqueur exec de KillerCoda — la commande entre accents graves, immédiatement suivie du mot exec entre doubles accolades — devient cliquable dans le lecteur.",
          hints: "Indices — les indices progressifs, révélés niveau par niveau. Séparez les niveaux par des titres ### Indice 1, ### Indice 2 (ou ### Hint 1 en anglais) ; un texte d'indice sans titre est un niveau unique.",
          verify: "Vérification — un script shell exécuté dans le conteneur quand l'apprenant clique sur Vérifier. Le code de sortie 0 valide l'étape ; tout autre code le laisse dessus. Affichez ce que vous vérifiez : la sortie l'aide.",
          background: "Arrière-plan — un script exécuté dans le conteneur quand l'apprenant arrive sur l'étape, en arrière-plan : démarrer un service, déposer un fichier, casser quelque chose exprès.",
          foreground: "Premier plan — des commandes tapées dans le shell de l'apprenant quand il arrive sur l'étape, comme s'il les avait tapées. Restez court : il les voit défiler.",
          flag: "Étapes Flag — cochez A un drapeau et donnez un Chemin du drapeau : quand l'apprenant arrive sur l'étape, un jeton FLAG unique à sa session est écrit dans ce fichier du conteneur, et l'étape est validée quand il le soumet. Le niveau du drapeau est un nombre libre conservé avec l'étape.",
          questions: "Questions — pour un quiz : ajoutez des questions, choisissez un type (choix multiple, réponses multiples, vrai/faux, texte libre), marquez les bonnes options, donnez éventuellement des points et une explication. Afficher le retour après envoi fait passer le quiz du mode examen (score seul) au mode apprentissage (réponses et explications affichées).",
          effects: "Effets — un effet d'intro dessiné dans le terminal quand l'apprenant arrive sur l'étape, et un effet de sortie une fois qu'il la valide, chacun avec un court texte. Purement visuel."
        },
        chaining: {
          title: "Enchaîner les étapes et enregistrer",
          description: "Les étapes se déroulent dans un seul sens, du nœud scénario à la dernière étape. Tracez un lien de la sortie d'une étape vers l'entrée de la suivante ; une étape ne peut mener qu'à une seule suivante et la chaîne ne peut pas boucler. Les étapes laissées sans lien sont ajoutées à la fin à l'enregistrement, avec un avertissement qui les nomme. Enregistrer écrit l'ordre ; Réinitialiser ne fait que réarranger le canevas.",
          reorder: "Pour déplacer une étape, supprimez ses liens et tracez-en de nouveaux, ou déposez-la sur un lien : l'éditeur recâble la chaîne autour d'elle."
        },
        preview: {
          title: "Le jouer comme apprenant",
          description: "Jouer comme apprenant provisionne un vrai terminal (il compte sur votre propre limite de sessions) et ouvre le lecteur exactement comme un apprenant le voit. Parcourez les étapes, puis détruisez la session. Les modifications faites pendant qu'une exécution est en cours ne changent pas cette exécution : lancez un nouvel aperçu."
        },
        importExport: {
          title: "Importer et exporter",
          description: "L'import se fait depuis l'onglet Scénarios d'une organisation ou d'une classe, pas depuis l'éditeur. Deux formats :",
          killercoda: "Importer KillerCoda — une archive .zip ou .tar.gz (10 Mo max) organisée comme un scénario KillerCoda : un index.json, un répertoire par étape avec son texte et ses scripts, des ressources. Les indices écrits avec des titres ### Indice n deviennent des niveaux d'indice ; un extensions.json facultatif par étape déclare le type d'étape et les questions de quiz.",
          json: "Importer JSON — un fichier .json (5 Mo max) exporté d'OCF avec Exporter en JSON. Il doit contenir un titre et des étapes. Importer un scénario qui existe déjà dans l'organisation le met à jour.",
          export: "Exporter en JSON et Exporter Archive KillerCoda, dans le menu ⋮ de l'éditeur et sur l'onglet Scénarios de l'organisation, téléchargent le scénario dans l'un ou l'autre format : pour le sauvegarder, le déplacer vers une autre organisation, ou le modifier dans un éditeur de texte."
        },
        archive: {
          title: "Archiver un scénario",
          description: "Archiver, dans le menu ⋮ de l'éditeur ou sur l'onglet Scénarios, retire un scénario sans le supprimer : il n'est plus proposé aux apprenants, ni attribuable, ni lançable, mais les résultats passés le gardent dans leur historique et les exécutions en cours se terminent normalement. Restaurer le ramène à tout moment. Supprimer, sur l'onglet Scénarios, l'efface définitivement."
        },
        health: {
          title: "Santé des scénarios",
          description: "Les administrateurs de la plateforme disposent d'une page Administration › Santé des scénarios qui liste ce qu'un scénario promet et ne peut pas tenir : une langue déclarée mais non proposée, une étape sans moyen de la franchir. Rien de cela n'est signalé aux apprenants ; si un de vos scénarios se comporte bizarrement, demandez à votre administrateur de le vérifier."
        },
        nextSteps: {
          gettingStarted: "Ce que voit l'apprenant : catalogue, lecteur, historique.",
          classes: "Attribuer des scénarios à une classe et suivre les apprenants en direct."
        }
      }
    }
  }
};
