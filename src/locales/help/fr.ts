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
        title: "Premiers Pas avec les Terminaux",
        intro: "Les terminaux sont des environnements de développement virtuels qui vous permettent de travailler sur vos projets directement depuis votre navigateur. Ce guide vous aidera à créer votre première session terminal.",

        overview: {
          title: "Que sont les Terminaux ?",
          description: "Les terminaux vous fournissent des environnements Linux sécurisés et isolés accessibles via votre navigateur. Chaque terminal est un environnement de développement complet avec des outils pré-installés et la possibilité d'installer des logiciels supplémentaires selon vos besoins."
        },

        firstSteps: {
          title: "Créer Votre Premier Terminal",
          step1: {
            title: "Accéder à la Création de Terminal",
            description: "Rendez-vous sur la page \"Création de Terminal\" depuis le menu principal. Cette page vous permet de configurer votre nouvelle session terminal."
          },
          step2: {
            title: "Composer Votre Environnement",
            description: "Utilisez le compositeur de session pour sélectionner votre environnement en trois étapes : choisissez une <strong>distribution</strong> (ex. Ubuntu, Debian), une <strong>taille</strong> (S / M / L / XL) et activez les <strong>fonctionnalités</strong> optionnelles comme Docker ou Kubernetes. Une taille recommandée et les fonctionnalités disponibles sont pré-sélectionnées pour vous."
          },
          step3: {
            title: "Définir les Paramètres d'Accès",
            description: "Configurez votre session : nom, durée et autres paramètres."
          },
          step4: {
            title: "Lancer Votre Terminal",
            description: "Une fois configuré, lancez votre terminal. Le démarrage initial peut prendre quelques instants pour préparer votre environnement."
          }
        },

        quickAccess: {
          title: "Accès Rapide",
          mySessions: "Consultez vos sessions actives sur la page \"Mes Sessions\"",
          keys: "Gérez vos clés SSH dans \"Clés Terminal\""
        },

        steps: {
          accessKeys: {
            title: "Accéder aux clés d'accès",
            description: "Naviguez vers <strong>Travaux Pratiques > Clés d'Accès Terminal</strong> dans le menu principal.",
            button: "Voir mes clés d'accès"
          },
          checkStatus: {
            title: "Vérifier le statut",
            description: "Si vous voyez \"Aucune clé terminal trouvée\" ou si votre clé est inactive, utilisez le bouton <strong>\"Régénérer la clé\"</strong> pour en créer une nouvelle."
          },
          accessCreation: {
            title: "Accéder à la création de session",
            description: "Cliquez sur <strong>Travaux Pratiques > Créer une Session</strong> dans le menu.",
            button: "Créer une session maintenant"
          },
          configure: {
            title: "Composer votre environnement",
            item1: "<strong>Distribution :</strong> Choisissez la distribution Linux affichée sous forme de cartes avec des icônes de marque (ex. Ubuntu, Debian). Le système recommande la plus courante par défaut.",
            item2: "<strong>Taille :</strong> Sélectionnez S, M, L ou XL via les pastilles de taille. Les tailles verrouillées par votre plan apparaissent en grisé avec un cadenas — améliorez votre plan pour les débloquer.",
            item3: "<strong>Fonctionnalités :</strong> Activez les modules optionnels tels que Docker ou Kubernetes. Les fonctionnalités indisponibles sont affichées comme désactivées.",
            item4: "<strong>Conditions d'utilisation :</strong> Acceptez les conditions (obligatoire)",
            item5: "<strong>Durée d'expiration :</strong> Choisissez combien de temps votre session restera active (optionnel)"
          },
          launch: {
            title: "Lancer la session",
            description: "Cliquez sur <strong>\"Démarrer une session\"</strong>. La création peut prendre quelques instants pendant que le système prépare votre environnement."
          },
          locate: {
            title: "Localiser votre session",
            description: "Dans <strong>Travaux Pratiques > Mes Sessions</strong>, vous verrez votre nouvelle session avec le statut \"active\".",
            button: "Voir mes sessions"
          },
          connect: {
            title: "Se connecter au terminal",
            description: "Cliquez sur le bouton <strong>\"Ouvrir\"</strong> pour accéder à votre terminal dans un nouvel onglet, ou utilisez <strong>\"Aperçu\"</strong> pour le voir directement dans la page."
          }
        },

        multiBackend: {
          title: "Support Multi-Serveur",
          description: "Lorsque plusieurs serveurs de terminaux sont disponibles, vous pouvez choisir le serveur à utiliser pour votre session. Cela vous permet de sélectionner l'infrastructure la plus proche de votre localisation ou la mieux adaptée à votre charge de travail.",
          selectBackend: {
            title: "Sélectionner un serveur",
            description: "Sur la page de création de session, un <strong>sélecteur de serveur</strong> apparaît lorsque plusieurs serveurs sont disponibles. Choisissez le serveur qui correspond le mieux à vos besoins."
          },
          tip: {
            title: "Conseil",
            description: "Si un seul serveur est configuré, le sélecteur est masqué et le serveur par défaut est utilisé automatiquement."
          }
        },

        machineSizes: {
          title: "Tailles et capacité des environnements",
          description: "Votre forfait inclut une capacité pour exécuter des environnements d'apprentissage. Vous pouvez la répartir entre n'importe quelle combinaison de tailles, tant que vous ne dépassez pas la limite globale du forfait. Le compositeur de session indique en permanence combien de sessions de chaque taille vous pouvez encore lancer.",
          small: {
            title: "S - Petite",
            description: "Environnement léger pour les tâches simples, le scripting et le développement basique."
          },
          medium: {
            title: "M - Moyenne",
            description: "Environnement équilibré pour le développement standard et les charges de travail modérées."
          },
          large: {
            title: "L - Grande",
            description: "Environnement puissant pour les tâches intensives en ressources, la compilation et les architectures multi-services."
          },
          xlarge: {
            title: "XL - Très Grande",
            description: "Ressources maximales pour les charges lourdes, les builds à grande échelle et les environnements de type production."
          },
          budgetExplain: {
            title: "Comment la capacité est consommée",
            description: "Lorsque vous démarrez une session, la taille choisie est réservée sur votre capacité. Arrêter une session non persistante libère immédiatement sa capacité. Les sessions persistantes mobilisent la capacité jusqu'à leur suppression. Le compositeur affiche le résumé en nombre de tailles (\"3 L OU 6 M OU 12 S\") afin que vous sachiez toujours ce qu'il reste à lancer."
          },
          combinationExample: {
            title: "À combiner librement",
            description: "Exemple : un forfait avec la capacité de 2 sessions L peut aussi accueillir 4 sessions M, 8 sessions S, ou n'importe quel mélange qui rentre — par exemple 1 L + 2 M. Vous décidez comment répartir la capacité entre vos apprenants ou vos environnements."
          },
          planTip: {
            title: "Disponibilité selon le forfait",
            description: "Votre forfait d'abonnement détermine la capacité globale et les tailles débloquées. Les tailles trop grandes pour votre forfait apparaissent en grisé avec un cadenas dans le compositeur de session. Sur un abonnement géré par l'organisation, les tailles indisponibles sont masquées. Pour augmenter votre capacité, améliorez votre forfait."
          }
        },

        usageQuota: {
          title: "Panneau d'utilisation et quotas",
          description: "Avant de créer une session, le panneau d'utilisation affiche votre consommation actuelle de ressources en un coup d'œil.",
          concurrentSessions: {
            title: "Capacité du forfait",
            description: "Votre forfait comprend un budget CPU + mémoire ; lancez n'importe quelle combinaison de tailles qui rentre dedans. Le panneau indique combien de sessions supplémentaires de chaque taille vous pouvez encore lancer."
          },
          maxDuration: {
            title: "Durée maximale de session",
            description: "Affiche la durée la plus longue autorisée pour une session unique selon votre plan d'abonnement actuel."
          }
        },

        advancedOptions: {
          title: "Options avancées",
          description: "Lors de la création d'une session, vous pouvez optionnellement configurer des paramètres supplémentaires pour une meilleure organisation.",
          terminalName: {
            title: "Nom du terminal",
            description: "Donnez à votre session un <strong>nom personnalisé</strong> pour l'identifier facilement parmi vos sessions actives (ex. : \"TP 3 - Réseau\")."
          },
          exerciseRef: {
            title: "Référence d'exercice",
            description: "Associez votre session à un <strong>exercice ou travail pratique</strong> spécifique à des fins de suivi et d'organisation."
          }
        },

        bulkGroupCreation: {
          title: "Création en masse pour un groupe",
          description: "Lorsque la fonctionnalité de groupes est activée, les formateurs peuvent créer des sessions de terminal pour tous les membres d'un groupe en une seule opération. Idéal pour la mise en place de salles de cours et de sessions de formation.",
          selectGroup: {
            title: "Sélectionner un groupe",
            description: "Choisissez un <strong>groupe</strong> dans la liste déroulante. Tous les membres de ce groupe recevront leur propre session terminal."
          },
          confirm: {
            title: "Confirmer la création en masse",
            description: "Vérifiez le nombre de sessions à créer et cliquez sur <strong>\"Créer les sessions\"</strong>. Chaque membre du groupe recevra une session terminal dédiée avec la même configuration."
          },
          tip: {
            title: "Disponibilité",
            description: "Cette fonctionnalité nécessite que le feature flag des groupes soit activé. Contactez votre administrateur si vous ne voyez pas cette option."
          }
        },

        recordingConsent: {
          title: "Consentement d'enregistrement",
          description: "Lorsque l'enregistrement de session est activé par votre organisation, une fenêtre de consentement apparaît après le démarrage de votre session terminal.",
          modal: {
            title: "Fenêtre de consentement",
            description: "Après la création de la session, une <strong>boîte de dialogue de consentement à l'enregistrement</strong> apparaît pour vous demander si vous acceptez que votre session soit enregistrée."
          },
          choices: {
            title: "Vos choix",
            description: "Vous pouvez <strong>accepter</strong> l'enregistrement pour autoriser la capture de session, ou <strong>refuser</strong> si vous préférez ne pas être enregistré. Votre choix est enregistré pour la session en cours."
          }
        },

        expiryWarnings: {
          title: "Alertes de compte à rebours avant expiration",
          description: "À l'approche de l'expiration de votre session, la plateforme affiche des bannières de notification pour vous rappeler de sauvegarder votre travail.",
          tenMin: {
            title: "10 minutes restantes",
            description: "Une notification d'information apparaît, vous rappelant que votre session va bientôt expirer."
          },
          fiveMin: {
            title: "5 minutes restantes",
            description: "Une notification d'avertissement vous invite à sauvegarder votre travail et à vous préparer à terminer votre session."
          },
          oneMin: {
            title: "1 minute restante",
            description: "Une alerte critique signale la fin imminente de la session. Sauvegardez immédiatement tout votre travail."
          }
        }
      },

      managingSessions: {
        title: "Gestion de Vos Sessions Terminal",
        intro: "Apprenez à gérer efficacement vos sessions terminal, synchroniser votre travail et accéder à vos environnements depuis n'importe où.",

        quickAccessCard: {
          title: "Accès rapide",
          description: "Naviguez vers <strong>Travaux Pratiques > Mes Sessions</strong> pour voir toutes vos sessions.",
          button: "Voir mes sessions"
        },

        sessionTypes: {
          title: "Types de Sessions",
          personal: {
            title: "Sessions Personnelles",
            description: "Sessions privées auxquelles vous seul pouvez accéder. Parfaites pour le développement personnel ou les tests."
          },
          shared: {
            title: "Sessions Partagées",
            description: "Sessions que vous pouvez partager avec des collègues ou apprenants. Utiles pour la collaboration ou l'enseignement."
          },
          temporary: {
            title: "Sessions Temporaires",
            description: "Sessions avec une durée limitée, automatiquement supprimées après une période définie."
          }
        },

        synchronization: {
          title: "Synchronisation du Travail",
          description: "Votre travail est automatiquement sauvegardé dans chaque session. Vous pouvez accéder à vos fichiers et configurations même après déconnexion et reconnexion.",
          tips: {
            title: "Conseils de Synchronisation",
            tip1: "Utilisez des systèmes de contrôle de version (git) pour sauvegarder votre travail externellement",
            tip2: "Sauvegardez régulièrement les fichiers importants vers un stockage externe",
            tip3: "Configurez votre environnement de développement avec des dotfiles pour une restauration facile"
          }
        },

        syncMethods: {
          individual: {
            title: "Synchronisation individuelle",
            description: "Cliquez sur le bouton \"Sync\" d'une session pour mettre à jour son statut spécifiquement."
          },
          global: {
            title: "Synchronisation globale",
            description: "Le bouton \"Tout synchroniser\" met à jour toutes vos sessions en une seule fois."
          },
          automatic: {
            title: "Synchronisation automatique",
            description: "Les sessions se synchronisent automatiquement toutes les 30 secondes."
          }
        },

        syncTip: {
          title: "Conseil",
          description: "Si une session semble inactive mais apparaît encore comme \"active\", utilisez la synchronisation pour obtenir le statut le plus récent."
        },

        accessMethods: {
          title: "Accès aux terminaux",
          description: "Plusieurs options sont disponibles pour accéder à vos sessions terminal :",
          newTab: {
            title: "Ouvrir dans un nouvel onglet",
            description: "Le bouton <strong>\"Ouvrir\"</strong> lance votre terminal dans une nouvelle fenêtre optimisée, idéal pour un travail prolongé."
          },
          preview: {
            title: "Aperçu intégré",
            description: "L'<strong>\"Aperçu\"</strong> affiche le terminal directement dans la page, pratique pour des vérifications rapides."
          },
          copyLink: {
            title: "Copie de lien",
            description: "Copiez l'URL du terminal pour y accéder plus tard ou l'intégrer dans vos favoris."
          }
        },

        iframeIntegration: {
          title: "Intégration iframe",
          description: "Vous pouvez intégrer vos terminaux dans d'autres sites web ou plateformes d'apprentissage :",
          step1: {
            title: "Générer le code iframe",
            description: "Cliquez sur le bouton <strong>\"iframe\"</strong> à côté d'une session active pour copier automatiquement le code d'intégration."
          },
          step2: {
            title: "Personnaliser l'affichage",
            description: "Le code iframe par défaut utilise une taille de 100% x 600px. Vous pouvez modifier ces dimensions selon vos besoins."
          },
          codeExample: {
            title: "Exemple de code iframe :"
          }
        },

        stopAndCleanup: {
          title: "Arrêt et nettoyage",
          description: "Une gestion appropriée de vos sessions permet d'optimiser les ressources :",
          stopSession: {
            title: "Arrêter une session",
            description: "Utilisez le bouton <strong>\"Arrêter\"</strong> pour terminer proprement une session active quand vous avez fini de travailler."
          },
          hideSessions: {
            title: "Masquer les sessions inactives",
            description: "Le bouton <strong>\"Masquer\"</strong> sur les sessions expirées ou arrêtées les retire de votre liste pour un affichage plus propre."
          },
          warning: {
            title: "Important",
            description: "<strong>Sauvegardez toujours votre travail</strong> avant d'arrêter une session. Une fois arrêtée, vous ne pourrez plus récupérer les fichiers non sauvegardés."
          }
        },

        monitoring: {
          title: "Surveillance et optimisation",
          description: "Suivez ces bonnes pratiques pour une utilisation optimale :",
          practices: {
            expiration: {
              title: "Surveillez les expirations",
              description: "Vérifiez régulièrement les dates d'expiration pour éviter la perte de travail."
            },
            backup: {
              title: "Sauvegardez fréquemment",
              description: "Téléchargez vos fichiers importants ou utilisez des dépôts Git."
            },
            resources: {
              title: "Gérez les ressources",
              description: "N'utilisez que le nombre de sessions nécessaires selon votre abonnement."
            },
            sync: {
              title: "Synchronisez régulièrement",
              description: "Utilisez la synchronisation si vous suspectez des problèmes de statut."
            }
          }
        },

        nextSteps: {
          troubleshooting: {
            title: "Dépannage",
            description: "Solutions aux problèmes courants de gestion des sessions"
          }
        },

        access: {
          title: "Méthodes d'Accès",
          browser: {
            title: "Accès Navigateur",
            description: "Accès direct via l'interface web. Aucune installation requise, fonctionne sur tout appareil avec une connexion internet."
          },
          ssh: {
            title: "Accès SSH",
            description: "Connectez-vous avec votre client SSH préféré. Configurez vos clés SSH dans la section \"Clés Terminal\"."
          },
          iframe: {
            title: "Intégration Iframe",
            description: "Intégrez les terminaux dans vos propres applications ou plateformes éducatives."
          }
        },

        dashboardLayout: {
          title: "Disposition unifiée du tableau de bord",
          description: "Le tableau de bord des sessions organise vos terminaux en deux sections distinctes pour une vue d'ensemble claire de tous vos environnements.",
          activeSessions: {
            title: "Sessions actives",
            description: "Vos sessions en cours d'exécution sont affichées en évidence en haut avec un badge de comptage indiquant le nombre total de terminaux actifs."
          },
          inactiveSessions: {
            title: "Sessions inactives",
            description: "Les sessions arrêtées et expirées sont regroupées dans une section repliable que vous pouvez développer ou réduire pour garder votre tableau de bord ordonné."
          }
        },

        inlineRenaming: {
          title: "Renommage de session en ligne",
          description: "Vous pouvez renommer vos sessions terminal directement depuis le tableau de bord sans ouvrir de fenêtre modale ou de page de paramètres.",
          howTo: {
            title: "Renommer une session",
            description: "Cliquez sur l'<strong>icône de crayon</strong> à côté du nom de la session, saisissez le nouveau nom, puis appuyez sur <strong>Entrée</strong> pour enregistrer ou <strong>Échap</strong> pour annuler."
          }
        },

        commandHistory: {
          title: "Historique des commandes",
          description: "Chaque session terminal conserve un historique détaillé des commandes que vous pouvez parcourir, rechercher et exporter.",
          search: {
            title: "Recherche et filtrage",
            description: "Utilisez la barre de recherche pour filtrer les commandes par mot-clé. Les résultats se mettent à jour en temps réel pendant la saisie."
          },
          sort: {
            title: "Tri par date",
            description: "Les commandes sont listées par ordre chronologique. Basculez entre l'ordre du plus récent au plus ancien et inversement."
          },
          export: {
            title: "Exporter l'historique",
            description: "Téléchargez votre historique de commandes au format CSV ou JSON à des fins de documentation ou d'audit."
          },
          clickToPaste: {
            title: "Cliquer pour coller",
            description: "Cliquez sur n'importe quelle commande dans l'historique pour la coller instantanément dans le terminal actif, prête à être exécutée."
          },
          deleteAll: {
            title: "Supprimer tout l'historique",
            description: "Le bouton <strong>\"Tout supprimer\"</strong> efface l'intégralité de l'historique des commandes. Une boîte de confirmation empêche la suppression accidentelle."
          }
        },

        moreActions: {
          title: "Menu d'actions supplémentaires",
          description: "Chaque carte de session inclut un menu déroulant \"Plus d'actions\" avec des opérations complémentaires.",
          copyUrl: {
            title: "Copier l'URL",
            description: "Copiez l'URL d'accès direct au terminal dans votre presse-papiers pour un partage rapide ou un ajout aux favoris."
          },
          copyIframe: {
            title: "Copier le code iframe",
            description: "Générez et copiez le code d'intégration iframe pour intégrer le terminal dans des sites web externes ou des plateformes LMS."
          },
          syncSession: {
            title: "Synchroniser la session",
            description: "Synchronisez manuellement le statut de la session avec le serveur pour obtenir les informations les plus récentes."
          }
        },

        statusIndicators: {
          title: "Indicateurs de statut",
          description: "Chaque session affiche un point coloré de statut pour une identification visuelle rapide de son état actuel.",
          active: {
            title: "Active (vert)",
            description: "La session est en cours d'exécution et prête à être utilisée. Vous pouvez vous connecter au terminal immédiatement."
          },
          stopped: {
            title: "Arrêtée (gris)",
            description: "La session a été arrêtée manuellement. Elle n'est plus accessible mais peut encore apparaître dans votre liste."
          },
          expired: {
            title: "Expirée (rouge)",
            description: "La session a atteint sa date d'expiration et a été automatiquement terminée."
          }
        },

        lastSyncTime: {
          title: "Dernière synchronisation",
          description: "Un horodatage en haut du tableau de bord indique quand les sessions ont été synchronisées pour la dernière fois avec le serveur, vous permettant de savoir si les informations affichées sont à jour.",
          tip: {
            title: "Conseil",
            description: "Si l'heure de synchronisation semble obsolète, cliquez sur le bouton de synchronisation globale pour actualiser toutes les sessions d'un coup."
          }
        },

        expiryWarnings: {
          title: "Alertes de compte à rebours avant expiration",
          description: "Dans le visualiseur de terminal, des bannières de notification apparaissent à l'approche de l'expiration de votre session pour vous aider à sauvegarder votre travail à temps.",
          tenMin: {
            title: "10 minutes restantes",
            description: "Une bannière d'information apparaît en haut du visualiseur de terminal en guise de rappel."
          },
          fiveMin: {
            title: "5 minutes restantes",
            description: "Une bannière d'avertissement vous invite à sauvegarder votre travail et à terminer vos tâches en cours."
          },
          oneMin: {
            title: "1 minute restante",
            description: "Une alerte critique signale la fin imminente de la session. Sauvegardez immédiatement tout votre travail."
          }
        }
      },

      troubleshooting: {
        title: "Dépannage Terminal",
        intro: "Solutions aux problèmes courants et guide de résolution des incidents",

        quickDiagnosis: {
          title: "Diagnostic rapide",
          description: "Avant de chercher une solution spécifique, effectuez ces vérifications de base :",
          checks: {
            internet: "Connexion Internet stable",
            browser: "Navigateur à jour (Chrome, Firefox, Safari, Edge)",
            key: "Clé d'accès terminal active",
            session: "Session non expirée",
            blocker: "Pas de bloqueur de publicités/scripts sur le domaine"
          },
          actionsTitle: "Actions rapides :",
          syncButton: "Synchroniser mes sessions",
          keyButton: "Vérifier ma clé d'accès"
        },

        commonProblems: {
          connectionIssues: {
            title: "Problèmes de connexion"
          },
          cannotCreateSession: {
            title: "Impossible de créer une session",
            causesTitle: "Causes possibles :",
            causes: {
              cause1: "Clé d'accès terminal manquante ou inactive",
              cause2: "Limite de sessions simultanées atteinte",
              cause3: "Problème temporaire du serveur",
              cause4: "Quota d'utilisation dépassé"
            },
            solutionsTitle: "Solutions :",
            solutions: {
              step1: {
                title: "Vérifiez votre clé d'accès :",
                description: "Allez dans \"Clés d'Accès Terminal\" et régénérez votre clé si nécessaire"
              },
              step2: {
                title: "Fermez les sessions inutiles :",
                description: "Arrêtez les sessions actives que vous n'utilisez plus"
              },
              step3: {
                title: "Attendez et réessayez :",
                description: "Patientez quelques minutes puis tentez une nouvelle création"
              }
            }
          },
          blackScreen: {
            title: "Terminal ne s'affiche pas ou écran noir",
            causesTitle: "Causes possibles :",
            causes: {
              cause1: "Bloqueur de contenu actif",
              cause2: "WebSocket bloqué par le réseau/firewall",
              cause3: "Session expirée ou arrêtée",
              cause4: "Problème de navigateur"
            },
            solutionsTitle: "Solutions :",
            solutions: {
              step1: {
                title: "Désactivez les bloqueurs :",
                description: "Mettez le domaine OCF en liste blanche dans vos extensions"
              },
              step2: {
                title: "Essayez un autre navigateur :",
                description: "Testez avec Chrome, Firefox ou Edge en navigation privée"
              },
              step3: {
                title: "Vérifiez le statut de la session :",
                description: "Synchronisez la session pour confirmer qu'elle est active"
              }
            }
          },
          keyboard: {
            title: "Clavier ne répond pas ou caractères incorrects",
            causesTitle: "Causes possibles :",
            causes: {
              cause1: "Configuration clavier incorrecte",
              cause2: "Conflit avec raccourcis navigateur",
              cause3: "Délai de réseau élevé",
              cause4: "Focus perdu sur le terminal"
            },
            solutionsTitle: "Solutions :",
            solutions: {
              step1: {
                title: "Cliquez dans le terminal :",
                description: "Assurez-vous que le focus est bien sur la zone de terminal"
              },
              step2: {
                title: "Configurez le clavier :",
                description: "Utilisez <code>sudo dpkg-reconfigure keyboard-configuration</code>"
              },
              step3: {
                title: "Rechargez la page :",
                description: "Actualisez (F5) pour rétablir la connexion"
              }
            }
          }
        },

        performanceProblems: {
          title: "Problèmes de performance",
          slowTerminal: {
            title: "Terminal lent ou qui rame",
            tip1: "Fermez les onglets/applications inutiles",
            tip2: "Vérifiez votre connexion Internet",
            tip3: "Réduisez le nombre d'utilisateurs connectés",
            tip4: "Redémarrez votre navigateur"
          },
          freezing: {
            title: "Session qui se fige",
            tip1: "Évitez les processus consommant beaucoup de mémoire",
            tip2: "Tuez les processus bloqués avec <code>Ctrl+C</code>",
            tip3: "Redémarrez la session si nécessaire",
            tip4: "Contactez le support si le problème persiste"
          },
          disconnections: {
            title: "Déconnexions fréquentes",
            tip1: "Vérifiez la stabilité de votre réseau",
            tip2: "Désactivez les VPN si possible",
            tip3: "Changez de réseau (4G/WiFi)",
            tip4: "Utilisez une connexion filaire si disponible"
          }
        },

        syncProblems: {
          title: "Problèmes de synchronisation",
          incorrectStatus: {
            title: "Statut de session incorrect",
            description: "Utilisez le bouton \"Sync\" pour mettre à jour le statut. Si le problème persiste, attendez quelques minutes et réessayez."
          },
          inconsistentDates: {
            title: "Dates d'expiration incohérentes",
            description: "La synchronisation globale (\"Tout synchroniser\") résout généralement ce problème. Vérifiez aussi les fuseaux horaires de votre système."
          },
          syncErrors: {
            title: "Erreurs de synchronisation",
            description: "Ces erreurs sont souvent temporaires. Patientez quelques minutes et relancez la synchronisation. Contactez le support si elles persistent."
          }
        },

        support: {
          whenToContact: {
            title: "Quand contacter le support",
            description: "Contactez notre équipe support dans ces situations :",
            critical: {
              title: "Critique - Contact immédiat",
              item1: "Perte de données importantes non sauvegardées",
              item2: "Accès non autorisé à vos sessions",
              item3: "Facturation incorrecte ou charges inattendues",
              item4: "Problème de sécurité suspecté"
            },
            high: {
              title: "Important - Contact sous 24h",
              item1: "Impossible de créer des sessions depuis plusieurs jours",
              item2: "Erreurs persistantes malgré les solutions tentées",
              item3: "Problèmes de performance généralisés",
              item4: "Fonctionnalités de partage non fonctionnelles"
            },
            normal: {
              title: "Normal - Support général",
              item1: "Questions sur l'utilisation des fonctionnalités",
              item2: "Demandes d'amélioration ou suggestions",
              item3: "Aide pour optimiser votre utilisation",
              item4: "Formation ou accompagnement"
            }
          },
          infoToInclude: {
            title: "Informations à inclure dans votre demande :",
            username: "Votre nom d'utilisateur et email",
            dateTime: "Date et heure du problème",
            detailedDescription: "Description détaillée des étapes effectuées",
            browser: "Navigateur et version utilisés",
            os: "Système d'exploitation (Windows, Mac, Linux)",
            screenshots: "Captures d'écran des erreurs (si possible)"
          },
          contactButton: "Contacter le Support"
        },

        prevention: {
          title: "Conseils de prévention",
          description: "Adoptez ces bonnes pratiques pour éviter les problèmes :",
          backup: {
            title: "Sauvegarde",
            tip1: "Sauvegardez régulièrement vos fichiers importants",
            tip2: "Utilisez Git pour versionner votre code",
            tip3: "Téléchargez les données critiques localement",
            tip4: "Documentez vos configurations importantes"
          },
          timeManagement: {
            title: "Gestion du temps",
            tip1: "Surveillez les dates d'expiration de vos sessions",
            tip2: "Prolongez les sessions actives avant expiration",
            tip3: "Planifiez votre travail selon les limites de temps",
            tip4: "Arrêtez les sessions inutilisées"
          },
          security: {
            title: "Sécurité",
            tip1: "Ne partagez jamais vos clés d'accès",
            tip2: "Révoquez les partages dès qu'ils ne sont plus nécessaires",
            tip3: "Vérifiez les accès accordés régulièrement",
            tip4: "Utilisez des mots de passe forts pour vos comptes"
          },
          maintenance: {
            title: "Maintenance",
            tip1: "Gardez votre navigateur à jour",
            tip2: "Nettoyez le cache régulièrement",
            tip3: "Synchronisez vos sessions fréquemment",
            tip4: "Surveillez l'utilisation de vos ressources"
          }
        },

        resources: {
          title: "Ressources supplémentaires",
          gettingStarted: {
            title: "Guide de démarrage",
            description: "Retour aux bases pour une configuration optimale"
          },
          managingSessions: {
            title: "Gestion des sessions",
            description: "Optimisez votre utilisation des sessions terminal"
          }
        }
      },
      sshKeys: {
        title: "Gestion des clés SSH",
        intro: "Gérez vos clés d'accès terminal pour vous connecter aux sessions de terminal en toute sécurité.",
        overview: {
          title: "Que sont les clés d'accès terminal ?",
          description: "Les clés d'accès terminal sont des identifiants qui vous authentifient lors de la connexion aux sessions de terminal. Chaque clé est unique à votre compte et vous permet de créer et rejoindre des sessions de terminal sur la plateforme.",
          requirement: "Vous avez besoin d'une clé d'accès terminal active pour créer ou vous connecter à toute session de terminal. Sans clé, les fonctionnalités de terminal ne seront pas disponibles."
        },
        regenerate: {
          title: "Créer ou régénérer une clé",
          description: "Vous pouvez générer une nouvelle clé d'accès terminal depuis la page Clés d'Accès Terminal. Si vous possédez déjà une clé, la régénération la remplacera.",
          step1: {
            title: "Accéder aux Clés d'Accès Terminal",
            description: "Rendez-vous sur la page Clés d'Accès Terminal depuis le menu des paramètres ou la navigation principale."
          },
          step2: {
            title: "Cliquer sur Régénérer la clé",
            description: "Appuyez sur le bouton « Régénérer la clé ». Une boîte de dialogue de confirmation apparaîtra pour vérifier votre intention."
          },
          step3: {
            title: "Confirmer l'action",
            description: "Confirmez la régénération dans la boîte de dialogue. Votre nouvelle clé sera générée immédiatement et deviendra active."
          },
          warning: {
            title: "Important",
            description: "La régénération de votre clé invalidera immédiatement votre clé précédente. Toute session authentifiée avec l'ancienne clé pourra être affectée. Ne régénérez que lorsque c'est nécessaire."
          }
        },
        details: {
          title: "Détails de la clé",
          description: "La page de votre clé d'accès terminal affiche les informations suivantes sur votre clé actuelle.",
          keyId: {
            title: "Identifiant de la clé",
            description: "Un identifiant unique pour votre clé d'accès terminal. Il est utilisé en interne pour le suivi et la gestion de votre clé."
          },
          keyName: {
            title: "Nom de la clé",
            description: "Un nom descriptif pour votre clé, généralement généré automatiquement à partir des informations de votre compte."
          },
          status: {
            title: "Statut",
            description: "Indique si votre clé est active ou inactive. Une clé active (badge vert) permet l'accès au terminal. Une clé inactive (badge rouge) doit être régénérée."
          }
        },
        security: {
          title: "Bonnes pratiques de sécurité",
          description: "Suivez ces recommandations pour maintenir la sécurité de vos accès terminal.",
          keepSecure: {
            title: "Gardez votre clé en sécurité",
            description: "Votre clé d'accès terminal donne accès aux sessions de terminal en votre nom. Traitez-la comme un mot de passe et ne l'exposez pas inutilement."
          },
          noShare: {
            title: "Ne partagez jamais votre clé",
            description: "Ne partagez pas votre clé d'accès terminal avec d'autres personnes. Chaque utilisateur doit avoir sa propre clé. Le partage de clés peut entraîner un accès non autorisé et des conflits de sessions."
          },
          regenerateIfCompromised: {
            title: "Régénérez en cas de compromission",
            description: "Si vous suspectez que votre clé a été compromise ou consultée par quelqu'un d'autre, régénérez-la immédiatement pour invalider l'ancienne clé."
          }
        },
        troubleshooting: {
          title: "Dépannage",
          description: "Problèmes courants avec les clés d'accès terminal et comment les résoudre.",
          noKey: {
            title: "Aucune clé trouvée (état vide)",
            description: "Si la page affiche « Aucune clé terminal trouvée », vous devez générer votre première clé. Cliquez sur le bouton « Régénérer la clé » pour en créer une. C'est normal pour les nouveaux comptes."
          },
          inactive: {
            title: "Clé inactive",
            description: "Une clé inactive (badge rouge) signifie que votre clé a été désactivée. Cela peut être dû à des actions administratives ou des changements de politique. Essayez de régénérer votre clé. Si le problème persiste, contactez votre administrateur."
          },
          lost: {
            title: "Clé perdue ou oubliée",
            description: "Si vous avez perdu l'accès à votre clé ou ne vous en souvenez plus, régénérez simplement une nouvelle clé depuis la page Clés d'Accès Terminal. L'ancienne clé sera invalidée et une nouvelle prendra sa place."
          }
        },
        nextSteps: {
          gettingStarted: {
            title: "Premiers pas avec les terminaux",
            description: "Apprenez à créer et utiliser votre première session de terminal"
          },
          troubleshooting: {
            title: "Dépannage des terminaux",
            description: "Solutions aux problèmes courants des terminaux"
          },
          settings: {
            title: "Paramètres & Préférences",
            description: "Configurez les paramètres de votre compte"
          }
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
        title: "Vue d'ensemble des Organisations",
        intro: "Les organisations sont la structure de base pour gérer les équipes, les licences et le contenu. Apprenez à créer et configurer efficacement vos organisations.",
        whatAre: {
          title: "Qu'est-ce qu'une Organisation ?",
          description: "Une organisation est un conteneur logique qui regroupe les utilisateurs, gère les abonnements et contrôle l'accès aux fonctionnalités de la plateforme. Les organisations peuvent représenter des entreprises, des écoles, des départements ou des équipes.",
          benefit1: "Gestion centralisée des utilisateurs et des licences",
          benefit2: "Facturation et plans d'abonnement partagés",
          benefit3: "Attribution de contenu par groupe",
          benefit4: "Contrôle d'accès basé sur les rôles"
        },
        creating: {
          title: "Création et Gestion des Organisations",
          description: "Découvrez comment configurer votre organisation étape par étape.",
          step1: {
            title: "Créer votre Organisation",
            description: "Naviguez vers la page Organisations et cliquez sur 'Créer une Organisation'. Fournissez un nom et une description optionnelle."
          },
          step2: {
            title: "Configurer les Paramètres",
            description: "Configurez les préférences de votre organisation, notamment les rôles par défaut, les paramètres de notification et les options de personnalisation."
          },
          step3: {
            title: "Inviter des Membres",
            description: "Ajoutez des membres par e-mail ou par import en masse. Attribuez les rôles (Propriétaire, Gestionnaire ou Membre) selon les responsabilités."
          }
        },
        members: {
          title: "Gestion des Membres",
          description: "Gérez les membres de votre organisation et leurs niveaux d'accès.",
          addMembers: "Invitez de nouveaux membres par e-mail ou importez depuis un CSV",
          assignRoles: "Attribuez les rôles Propriétaire, Gestionnaire ou Membre",
          manageLicenses: "Allouez des licences aux membres individuels",
          removeMembers: "Supprimez des membres ou transférez leurs données"
        },
        settings: {
          title: "Paramètres de l'Organisation",
          description: "Configurez votre organisation pour qu'elle corresponde à votre flux de travail.",
          general: "Paramètres généraux : nom, description et personnalisation",
          notifications: "Préférences de notification pour les événements de l'organisation",
          security: "Paramètres de sécurité et politiques d'accès",
          billing: "Informations de facturation et gestion des abonnements"
        },
        bestPractices: {
          title: "Bonnes Pratiques",
          description: "Suivez ces recommandations pour une gestion efficace de votre organisation.",
          tip1: {
            title: "Commencez par des Rôles Clairs",
            description: "Définissez qui doit être propriétaire, gestionnaire et membre avant d'inviter des personnes. Cela évite la confusion des permissions par la suite."
          },
          tip2: {
            title: "Utilisez les Groupes pour la Structure",
            description: "Créez des groupes au sein de votre organisation pour gérer les classes, les équipes ou les départements séparément."
          },
          tip3: {
            title: "Audits Réguliers des Licences",
            description: "Vérifiez périodiquement les attributions de licences pour vous assurer qu'elles sont allouées aux utilisateurs actifs."
          }
        },
        detailTabs: {
          title: "Onglets de la page Organisation",
          description: "La page détaillée d'une organisation est organisée en onglets pour une navigation facile entre les différentes zones de gestion.",
          overview: {
            title: "Vue d'ensemble",
            description: "Un résumé de votre organisation incluant le nombre de membres, les groupes actifs et l'état de l'abonnement."
          },
          members: {
            title: "Membres",
            description: "Consultez, invitez et gérez tous les membres de l'organisation. Attribuez des rôles et suivez l'activité."
          },
          groups: {
            title: "Groupes",
            description: "Créez et gérez les groupes au sein de l'organisation. Affectez des membres et du contenu par groupe."
          },
          subscription: {
            title: "Abonnement",
            description: "Consultez et gérez l'abonnement au niveau de l'organisation, y compris les détails du plan et les indicateurs d'utilisation."
          },
          settings: {
            title: "Paramètres",
            description: "Configurez les préférences de l'organisation, la personnalisation, les règles de notification et les politiques de sécurité."
          }
        },
        orgSubscription: {
          title: "Abonnement au niveau de l'organisation",
          description: "Chaque organisation peut avoir son propre abonnement, distinct des abonnements personnels détenus par les membres individuels.",
          separate: {
            title: "Distinct des abonnements personnels",
            description: "L'abonnement de l'organisation est géré indépendamment dans l'onglet Abonnement de l'organisation. Il couvre tous les membres de l'organisation et est facturé à l'organisation plutôt qu'aux utilisateurs individuels."
          }
        },
        subscriptionPreference: {
          title: "Priorité d'abonnement",
          description: "Lorsqu'un utilisateur appartient à une organisation qui dispose de son propre abonnement, le système détermine quel abonnement s'applique en fonction du niveau du plan.",
          priority: {
            title: "Le niveau supérieur a la priorité",
            description: "Si l'abonnement de l'organisation offre un niveau supérieur à l'abonnement personnel de l'utilisateur, l'abonnement de l'organisation prend le dessus. Cela garantit que les membres bénéficient toujours du meilleur plan disponible sans intervention manuelle."
          }
        },
        bulkImportIntegration: {
          title: "Intégration de l'import en masse",
          description: "Vous pouvez importer des membres directement depuis la page détaillée de l'organisation sans avoir à naviguer vers un outil séparé.",
          accessButton: "Un bouton « Import en masse » est disponible sur la page détaillée de l'organisation, préconfiguré pour importer des membres dans l'organisation courante",
          autoAssign: "Les utilisateurs importés sont automatiquement associés à l'organisation et peuvent être affectés à des groupes pendant l'importation"
        },
        nextSteps: {
          groups: {
            title: "Gestion des Groupes",
            description: "Apprenez à créer et gérer les groupes au sein de votre organisation"
          },
          roles: {
            title: "Rôles et Permissions",
            description: "Comprenez le système de permissions pour les organisations et les groupes"
          }
        }
      }
    },

    groups: {
      management: {
        title: "Gestion des Groupes",
        intro: "Les groupes permettent d'organiser les membres au sein d'une organisation en classes, équipes ou départements. Apprenez à créer, configurer et gérer efficacement vos groupes.",
        overview: {
          title: "Comprendre les Groupes",
          description: "Les groupes sont des sous-ensembles d'une organisation qui vous aident à gérer les membres et à attribuer du contenu à un niveau plus fin.",
          feature1: "Organisez les membres en classes ou équipes",
          feature2: "Attribuez des cours et l'accès aux terminaux par groupe",
          feature3: "Gérez les rôles au sein de chaque groupe indépendamment",
          feature4: "Support des structures hiérarchiques de groupes"
        },
        creating: {
          title: "Création de Groupes",
          description: "Suivez ces étapes pour créer un nouveau groupe au sein de votre organisation.",
          step1: {
            title: "Naviguer vers les Groupes",
            description: "Accédez à la page Groupes depuis la navigation principale ou depuis la page détaillée de votre organisation."
          },
          step2: {
            title: "Créer un Nouveau Groupe",
            description: "Cliquez sur 'Créer un Groupe', entrez un nom et une description, et sélectionnez l'organisation parente."
          },
          step3: {
            title: "Ajouter des Membres",
            description: "Invitez des membres dans le groupe ou ajoutez des membres existants de l'organisation. Attribuez des rôles spécifiques au groupe."
          }
        },
        hierarchy: {
          title: "Hiérarchie des Groupes",
          description: "Les groupes peuvent être organisés en structure hiérarchique pour les organisations complexes.",
          parentGroups: "Les groupes parents peuvent contenir des sous-groupes",
          inheritance: "Les paramètres peuvent être hérités du groupe parent vers les groupes enfants",
          navigation: "Utilisez l'éditeur de hiérarchie pour une organisation par glisser-déposer",
          visualization: "Visualisez l'arborescence complète depuis la page de hiérarchie"
        },
        roles: {
          title: "Rôles des Membres du Groupe",
          description: "Chaque membre d'un groupe a un rôle qui détermine ses permissions au sein de ce groupe.",
          owner: {
            title: "Propriétaire du Groupe",
            description: "Contrôle total sur le groupe, y compris les paramètres, les membres et le contenu"
          },
          manager: {
            title: "Gestionnaire du Groupe",
            description: "Peut gérer les membres et le contenu mais ne peut pas supprimer le groupe ou modifier les paramètres critiques"
          },
          member: {
            title: "Membre du Groupe",
            description: "Peut accéder au contenu assigné et participer aux activités du groupe"
          }
        },
        content: {
          title: "Attribution de Contenu",
          description: "Attribuez des cours et des ressources aux groupes pour que tous les membres y aient accès.",
          assignCourses: "Attribuez des cours à un groupe pour tous les membres",
          terminalAccess: "Configurez les paramètres d'accès aux terminaux par groupe",
          scheduling: "Planifiez la disponibilité du contenu",
          tracking: "Suivez la progression et les taux de complétion du groupe"
        },
        settings: {
          title: "Paramètres du Groupe",
          description: "Configurez votre groupe selon vos besoins.",
          general: "Nom, description et paramètres de visibilité",
          enrollment: "Inscription ouverte ou fermée, accès sur invitation uniquement",
          notifications: "Préférences de notification au niveau du groupe",
          limits: "Limites de membres et restrictions de contenu"
        },
        nextSteps: {
          organizations: {
            title: "Vue d'ensemble des Organisations",
            description: "Découvrez la structure organisationnelle qui contient vos groupes"
          },
          roles: {
            title: "Rôles et Permissions",
            description: "Explorez en détail le système de permissions pour les organisations et les groupes"
          }
        }
      }
    },

    bulkImport: {
      overview: {
        title: "Import en Masse",
        intro: "Importez plusieurs utilisateurs dans votre organisation en une seule fois à l'aide de fichiers CSV. Ce guide vous accompagne dans le processus d'importation, les exigences de format CSV et les bonnes pratiques.",
        whatIs: {
          title: "Qu'est-ce que l'Import en Masse ?",
          description: "L'import en masse permet aux gestionnaires d'organisation d'ajouter de nombreux utilisateurs simultanément en téléchargeant un fichier CSV. C'est idéal pour l'intégration de classes, de départements ou d'organisations entières.",
          benefit1: "Importez des dizaines ou des centaines d'utilisateurs à la fois",
          benefit2: "Création automatique de comptes et attribution de rôles",
          benefit3: "Validation et rapport d'erreurs avant l'importation",
          benefit4: "Support de l'attribution de groupes pendant l'importation"
        },
        csvFormat: {
          title: "Format du Fichier CSV",
          description: "Votre fichier CSV doit suivre un format spécifique pour une importation réussie.",
          requiredFields: "Champs obligatoires : email, prénom, nom",
          optionalFields: "Champs optionnels : rôle, groupe, téléphone",
          encoding: "Encodage du fichier : UTF-8 recommandé",
          delimiter: "Délimiteur : virgule (,) ou point-virgule (;)",
          nameSplit: "Une colonne nom unique est découpée en first_name et last_name avant l'envoi. Ouvrez l'aperçu du fichier des utilisateurs pour choisir l'ordre par défaut (nom d'abord, comme DUPONT Marie, ou prénom d'abord) et, pour chaque ligne, cliquez entre deux mots pour déplacer la coupure ou inverser les deux parties ; un nom d'un seul mot devient le nom de famille.",
          example: "email,prenom,nom,role\njean{'@'}exemple.com,Jean,Dupont,member\nmarie{'@'}exemple.com,Marie,Martin,manager"
        },
        wizard: {
          title: "Assistant d'Importation",
          description: "L'assistant d'importation vous guide à travers le processus étape par étape.",
          step1: {
            title: "Télécharger le Fichier",
            description: "Sélectionnez votre fichier CSV et choisissez le format de délimiteur. Le système affichera un aperçu des premières lignes."
          },
          step2: {
            title: "Mapper les Colonnes",
            description: "Associez les colonnes de votre CSV aux champs requis. Le système tente un mapping automatique basé sur les en-têtes de colonnes."
          },
          step3: {
            title: "Valider les Données",
            description: "Examinez les résultats de la validation. Corrigez les erreurs dans votre CSV et re-téléchargez si nécessaire."
          },
          step4: {
            title: "Confirmer l'Importation",
            description: "Vérifiez le résumé et confirmez l'importation. Les nouveaux comptes seront créés et les e-mails d'invitation envoyés."
          }
        },
        validation: {
          title: "Validation et Gestion des Erreurs",
          description: "Le système valide vos données avant l'importation pour éviter les problèmes.",
          emailValidation: "Les adresses e-mail sont vérifiées pour le format et les doublons",
          roleValidation: "Les rôles sont validés par rapport aux options disponibles",
          groupValidation: "Les noms de groupes sont mis en correspondance avec les groupes existants",
          errorReport: "Un rapport d'erreurs détaillé est généré pour tout problème trouvé"
        },
        tips: {
          title: "Conseils et Bonnes Pratiques",
          description: "Suivez ces conseils pour une expérience d'importation fluide.",
          tip1: {
            title: "Testez avec de Petits Lots",
            description: "Commencez avec un petit CSV (5-10 utilisateurs) pour vérifier votre format avant d'importer la liste complète."
          },
          tip2: {
            title: "Préparez vos Groupes d'Abord",
            description: "Créez tous les groupes avant l'importation pour pouvoir assigner les utilisateurs aux groupes pendant l'import."
          },
          tip3: {
            title: "Vérifiez les Doublons",
            description: "Supprimez les adresses e-mail en double de votre CSV. Le système signalera les doublons mais ne les importera pas."
          }
        },
        csvEncoding: {
          title: "Détection automatique de l'encodage CSV",
          description: "Le système d'importation détecte automatiquement l'encodage de caractères de votre fichier, vous n'avez donc pas besoin de convertir les fichiers manuellement.",
          utf8: "Les fichiers UTF-8 sont pris en charge nativement et recommandés pour une compatibilité optimale",
          windows: "L'encodage Windows-1252 (courant avec les exports Excel) est détecté et géré automatiquement",
          bomStripping: "Les caractères BOM (Byte Order Mark) sont supprimés automatiquement, évitant les problèmes de caractères cachés dans vos en-têtes"
        },
        columnAliases: {
          title: "Support des alias de colonnes",
          description: "Les en-têtes de colonnes en français sont reconnus automatiquement lors du mapping, vous pouvez donc utiliser votre langue maternelle dans les exports CSV sans renommage manuel.",
          examplesTitle: "Alias pris en charge :"
        },
        forcePasswordReset: {
          title: "Réinitialisation forcée du mot de passe",
          description: "Vous pouvez exiger que les utilisateurs importés changent leur mot de passe à la première connexion pour renforcer la sécurité.",
          column: "Ajoutez une colonne force_reset à votre CSV avec les valeurs true ou false par utilisateur",
          automatic: "Lorsqu'un mot de passe est généré automatiquement (aucune colonne password fournie), la réinitialisation forcée est activée automatiquement"
        },
        autoGeneratedPasswords: {
          title: "Mots de passe générés automatiquement",
          description: "Lorsque votre CSV ne contient pas de colonne mot de passe, le système génère des mots de passe aléatoires robustes pour chaque nouveau compte utilisateur.",
          secure: "Les mots de passe générés font 16 caractères, combinant lettres, chiffres et caractères spéciaux",
          downloadable: "Après l'importation, un tableau d'identifiants téléchargeable contenant l'e-mail et le mot de passe temporaire de chaque utilisateur est disponible",
          warning: {
            title: "Avertissement de sécurité",
            description: "Téléchargez et distribuez le tableau d'identifiants rapidement. Pour des raisons de sécurité, les mots de passe générés automatiquement ne peuvent pas être récupérés après avoir quitté la page de résultats d'importation."
          }
        },
        trialPlanAssignment: {
          title: "Attribution automatique du plan d'essai",
          description: "Les comptes utilisateurs nouvellement créés se voient automatiquement attribuer le plan d'essai, leur donnant un accès immédiat à la plateforme sans configuration manuelle d'abonnement."
        },
        targetGroupDropdown: {
          title: "Sélection du groupe cible",
          description: "Un menu déroulant sur la page d'importation vous permet de sélectionner un groupe cible. Tous les utilisateurs du lot d'importation en cours seront automatiquement ajoutés au groupe sélectionné, vous évitant de les affecter un par un après l'importation."
        },
        updateExistingUsers: {
          title: "Mise à jour des utilisateurs existants",
          description: "Activez l'option « Mettre à jour les utilisateurs existants si trouvés » pour actualiser les informations de profil des utilisateurs déjà présents sur la plateforme (correspondance par adresse e-mail). Lorsque cette option est désactivée, les utilisateurs existants sont ignorés pendant l'importation."
        },
        verifyEmails: {
          title: "Adresses e-mail vérifiées",
          description: "L'option « Marquer les adresses e-mail importées comme vérifiées », activée par défaut, dispense les comptes importés de l'étape de confirmation d'e-mail car l'organisation se porte garante ; décochez-la pour que chaque apprenant confirme d'abord sa propre adresse."
        },
        validationPreview: {
          title: "Aperçu de la validation",
          description: "Avant d'exécuter l'importation, une étape de prévisualisation affiche les résultats de validation pour chaque ligne de votre CSV. Vous pouvez examiner les avertissements, erreurs et actions en attente pour savoir exactement ce qui va se passer avant de confirmer."
        },
        importProgress: {
          title: "Progression de l'importation",
          description: "Une fois l'importation confirmée, un affichage en temps réel montre le résultat pour chaque utilisateur au fur et à mesure du traitement.",
          created: "Créés : nouveaux comptes ajoutés avec succès à la plateforme",
          updated: "Mis à jour : utilisateurs existants dont le profil a été actualisé avec les nouvelles données",
          skipped: "Ignorés : lignes ignorées en raison d'erreurs ou de doublons"
        },
        nextSteps: {
          organizations: {
            title: "Vue d'ensemble des Organisations",
            description: "Découvrez la structure et la gestion des organisations"
          },
          groups: {
            title: "Gestion des Groupes",
            description: "Configurez les groupes avant d'importer les utilisateurs"
          }
        }
      }
    },

    scenarios: {
      gettingStarted: {
        title: "Premiers pas avec les scénarios interactifs",
        intro: "Les scénarios interactifs sont des exercices pratiques guidés, étape par étape, qui s'exécutent sur de vrais terminaux Linux. Suivez les instructions, exécutez des commandes et obtenez un retour instantané sur votre progression.",

        whatAre: {
          title: "Que sont les scénarios interactifs ?",
          description: "Les scénarios interactifs sont des exercices guidés qui vous accompagnent à travers des tâches concrètes, étape par étape. Chaque scénario s'exécute sur un vrai terminal Linux — vous suivez les instructions, exécutez des commandes, et le système vérifie automatiquement votre travail. Les scénarios couvrent des sujets comme l'installation de logiciels, la configuration de services, l'écriture de scripts, et bien plus encore."
        },

        starting: {
          title: "Démarrer un scénario",
          description: "Suivez ces étapes pour lancer votre premier scénario interactif.",
          step1: {
            title: "Ouvrir le lanceur de scénarios",
            description: "Naviguez vers la section <strong>Scénarios</strong> dans le menu. Vous verrez une liste des scénarios disponibles — filtrée selon les scénarios assignés à votre organisation ou groupe.",
            button: "Mes sessions terminales"
          },
          step2: {
            title: "Parcourir et sélectionner un scénario",
            description: "Parcourez les scénarios disponibles. Chacun affiche son <strong>titre</strong>, son <strong>badge de difficulté</strong> (débutant, intermédiaire ou avancé) et sa <strong>durée estimée</strong>. Cliquez sur <strong>\"Démarrer\"</strong> sur le scénario que vous souhaitez réaliser."
          },
          step3: {
            title: "Provisionnement de l'environnement",
            description: "La plateforme provisionne automatiquement le bon environnement pour ce scénario — la distribution et la taille correctes sont sélectionnées pour vous. Une superposition de provisionnement s'affiche pendant que votre environnement est en cours de préparation. Vous n'avez pas besoin de composer une session manuellement."
          },
          step4: {
            title: "Le panneau de scénario s'ouvre",
            description: "Une fois prêt, un <strong>panneau s'ouvre sur le côté droit</strong> de votre terminal. Ce panneau contient les instructions de l'étape en cours, et le terminal reste entièrement utilisable sur la gauche."
          },
          tip: {
            title: "Conseil",
            description: "Si vous avez déjà une session de scénario en cours, vous pouvez la reprendre directement depuis le lanceur de scénarios — pas besoin de la recréer."
          }
        },

        panel: {
          title: "Le panneau de scénario",
          description: "Le panneau de scénario est votre guide tout au long de l'exercice. Voici ce que vous y trouverez.",
          progress: {
            title: "Progression des étapes",
            description: "Des points de progression, en bas du panneau, montrent votre avancement. Les étapes terminées apparaissent en vert, l'étape en cours pulse en bleu, et les étapes à venir sont grises."
          },
          content: {
            title: "Contenu de l'étape",
            description: "Les instructions de chaque étape sont affichées en format markdown enrichi, incluant titres, blocs de code, images et listes. Lisez attentivement les instructions avant d'exécuter les commandes."
          },
          collapse: {
            title: "Réduire / Agrandir",
            description: "Cliquez sur le bouton circulaire sur le bord gauche du panneau pour le réduire ou l'agrandir. Cela vous donne plus d'espace terminal quand vous en avez besoin."
          },
          tip: {
            title: "Conseil",
            description: "Le panneau mémorise votre préférence de réduction entre les sessions, il restera dans l'état où vous l'avez laissé la prochaine fois."
          }
        },

        verifying: {
          title: "Vérifier votre travail",
          description: "Après avoir suivi les instructions d'une étape, vous pouvez vérifier que tout est correctement configuré.",
          click: {
            title: "Cliquer sur Vérifier",
            description: "Cliquez sur le bouton <strong>\"Vérifier\"</strong> en bas des instructions de l'étape. Le système exécutera un script de vérification sur votre terminal en arrière-plan."
          },
          result: {
            title: "Consulter le résultat",
            description: "Après quelques secondes, vous verrez un retour indiquant si la vérification a <strong>réussi</strong> ou <strong>échoué</strong>, accompagné de la sortie du script de vérification."
          },
          passed: {
            title: "Réussi",
            description: "Un message de succès vert apparaît avec la sortie du script. Le scénario avance automatiquement à l'étape suivante après une courte animation."
          },
          failed: {
            title: "Échoué",
            description: "Un message d'erreur rouge apparaît expliquant ce qui n'a pas fonctionné. Consultez la sortie, corrigez le problème dans votre terminal et réessayez la vérification."
          },
          tip: {
            title: "Conseil",
            description: "Vous pouvez vérifier autant de fois que nécessaire — il n'y a aucune pénalité pour les nouvelles tentatives. Prenez le temps de bien réaliser chaque étape."
          }
        },

        hints: {
          title: "Utiliser les indices",
          description: "Certaines étapes incluent des indices pour vous aider si vous êtes bloqué.",
          show: {
            title: "Afficher un indice",
            description: "Si une étape dispose d'un indice, vous verrez un bouton <strong>\"Afficher l'indice\"</strong>. Cliquez dessus pour révéler des conseils supplémentaires dans un encadré mis en évidence."
          },
          hide: {
            title: "Masquer l'indice",
            description: "Cliquez sur <strong>\"Masquer l'indice\"</strong> pour fermer l'encadré d'indice et revenir aux instructions de l'étape uniquement."
          }
        },

        ctf: {
          title: "Défis Flag CTF",
          description: "Certains scénarios incluent des défis de type Capture The Flag (CTF) qui testent vos compétences de manière ludique.",
          find: {
            title: "Trouver le flag",
            description: "Au lieu d'un bouton Vérifier, les étapes CTF affichent un <strong>champ de saisie de flag</strong>. Complétez l'exercice et cherchez un flag au format <strong>FLAG{'{'} ...{'}'}</strong> quelque part dans le système."
          },
          submit: {
            title: "Soumettre le flag",
            description: "Tapez ou collez le flag trouvé dans le champ de saisie et cliquez sur <strong>\"Soumettre le flag\"</strong>. Un message vert confirme un flag correct, tandis qu'un message rouge signifie qu'il est incorrect — vous pouvez réessayer."
          },
          unique: {
            title: "Unique par apprenant",
            description: "Chaque apprenant reçoit des <strong>flags uniques</strong> générés spécifiquement pour sa session. Partager des flags avec d'autres ne fonctionnera pas, car ils sont liés cryptographiquement à chaque apprenant individuel."
          },
          tip: {
            title: "Conseil",
            description: "Les flags sont générés de manière unique pour chaque apprenant par hachage cryptographique, vous devez donc trouver le vôtre. Cherchez attentivement dans l'environnement de l'exercice — les flags peuvent être cachés dans des fichiers, des sorties de commandes ou des configurations de services."
          }
        },

        codeBlocks: {
          title: "Blocs de code",
          description: "Les instructions des scénarios contiennent souvent des blocs de code. Ceux-ci disposent de boutons d'action pratiques lorsque vous les survolez.",
          copy: {
            title: "Copier dans le presse-papiers",
            description: "Survolez un bloc de code et cliquez sur le bouton de copie (coin supérieur droit) pour copier le code dans votre presse-papiers."
          },
          execute: {
            title: "Coller dans le terminal",
            description: "Pour les commandes sur une seule ligne, un bouton terminal apparaît (coin inférieur droit). Cliquez dessus pour coller la commande directement dans votre terminal actif."
          }
        },

        abandoning: {
          title: "Abandonner un scénario",
          description: "Si vous devez arrêter de travailler sur un scénario avant de l'avoir terminé, vous pouvez abandonner votre tentative en cours.",
          click: {
            title: "Cliquer sur Abandonner",
            description: "En haut de la page de session, à droite du lien <strong>\"Retour aux sessions\"</strong>, cliquez sur le bouton <strong>\"Abandonner le scénario\"</strong>."
          },
          confirm: {
            title: "Confirmer l'abandon",
            description: "Une boîte de dialogue de confirmation apparaîtra. Confirmez votre choix pour marquer la session comme <strong>abandonnée</strong>."
          },
          warning: {
            title: "Attention",
            description: "Vous pourrez démarrer une nouvelle tentative plus tard, mais votre progression actuelle sera perdue. Assurez-vous de vraiment vouloir abandonner avant de confirmer."
          }
        },

        completing: {
          title: "Terminer un scénario",
          description: "Une fois toutes les étapes d'un scénario réussies, vous l'avez terminé.",
          finish: {
            title: "Écran de réussite",
            description: "Après avoir réussi la dernière étape, un <strong>écran de réussite avec une icône de trophée</strong> apparaît pour vous féliciter d'avoir terminé le scénario."
          },
          history: {
            title: "Consulter votre historique",
            description: "Cliquez sur <strong>\"Voir mes scénarios\"</strong> pour consulter votre historique de scénarios, incluant les sessions terminées, actives et abandonnées.",
            button: "Mes scénarios"
          }
        },

        nextSteps: {
          description: "Continuez votre apprentissage avec ces guides complémentaires."
        }
      },

      creation: {
        title: "Création de scénarios interactifs",
        intro: "Apprenez à concevoir des exercices interactifs engageants, étape par étape, pour vos apprenants avec des environnements terminaux réels, des scripts de vérification et des défis CTF.",

        overview: {
          title: "Vue d'ensemble",
          description: "En tant que formateur, vous pouvez créer des scénarios interactifs qui guident les apprenants à travers des exercices concrets. Chaque scénario se compose d'étapes ordonnées avec des instructions, des scripts de vérification et des indices optionnels. Les scénarios s'exécutent sur de vrais conteneurs Linux correspondant à la distribution choisie, offrant aux apprenants une expérience pratique."
        },

        creating: {
          title: "Créer un scénario",
          description: "Suivez ces étapes pour créer un nouveau scénario interactif.",
          step1: {
            title: "Accéder aux scénarios",
            description: "Allez dans <strong>Admin > Scénarios</strong> dans le panneau d'administration pour accéder à la page de gestion des scénarios.",
            button: "Accéder aux scénarios"
          },
          step2: {
            title: "Remplir les détails du scénario",
            description: "Cliquez sur <strong>\"Créer\"</strong> et remplissez les détails du scénario : <strong>titre</strong>, <strong>description</strong>, <strong>niveau de difficulté</strong> (débutant, intermédiaire ou avancé) et <strong>durée estimée</strong> en minutes."
          },
          step3: {
            title: "Choisir la distribution",
            description: "Sélectionnez la <strong>distribution</strong> (image Linux) que les environnements des apprenants utiliseront pour ce scénario. Cela détermine le système d'exploitation et les outils pré-installés disponibles pendant l'exercice. Le lancement du scénario provisionne automatiquement le bon environnement — les apprenants n'ont pas besoin de choisir une taille ou des fonctionnalités eux-mêmes."
          },
          tip: {
            title: "Conseil",
            description: "Choisissez un titre descriptif — les apprenants le voient quand ils choisissent un scénario dans la liste. Un bon titre indique clairement ce que l'exercice couvre."
          }
        },

        steps: {
          title: "Ajouter des étapes",
          description: "Chaque scénario est composé d'étapes ordonnées. Créez-les et configurez-les individuellement.",
          step1: {
            title: "Accéder aux étapes de scénario",
            description: "Allez dans <strong>Admin > Étapes de scénario</strong> dans le panneau d'administration.",
            button: "Accéder aux étapes"
          },
          step2: {
            title: "Créer une étape",
            description: "Créez une nouvelle étape liée à votre scénario. Chaque étape comporte les champs suivants :",
            fieldTitle: "<strong>Titre</strong> — affiché dans l'en-tête de l'étape, doit être concis et descriptif",
            fieldText: "<strong>Contenu textuel</strong> — instructions en markdown affichées à l'apprenant (supporte les titres, blocs de code, images et listes)",
            fieldHint: "<strong>Indice</strong> — texte optionnel en markdown révélé quand l'apprenant clique sur « Afficher l'indice »",
            fieldVerify: "<strong>Script de vérification</strong> — un script shell qui retourne le code de sortie 0 en cas de succès (c'est le cœur de la vérification de l'exercice)",
            fieldBackground: "<strong>Script d'arrière-plan</strong> — script optionnel exécuté en arrière-plan au démarrage de l'étape",
            fieldForeground: "<strong>Script d'avant-plan</strong> — script optionnel exécuté au premier plan au démarrage de l'étape",
            fieldOrder: "<strong>Ordre</strong> — un nombre déterminant la séquence des étapes (commence à 0, les nombres plus petits viennent en premier)"
          },
          step3: {
            title: "Définir le bon ordre",
            description: "Assurez-vous que chaque étape a la bonne <strong>valeur d'ordre</strong> pour que les étapes soient présentées aux apprenants dans la bonne séquence. Les étapes sont triées par leur numéro d'ordre (en commençant par 0)."
          },
          tip: {
            title: "Conseil",
            description: "Écrivez des scripts de vérification qui vérifient l'état réel du système — par exemple, si un paquet est installé, si un fichier existe ou si un service est en cours d'exécution. Le code de sortie (0 pour succès, non-zéro pour échec) détermine si l'étape est réussie ou non."
          }
        },

        verifyScripts: {
          title: "Écrire de bons scripts de vérification",
          description: "Un script de vérification est une commande shell qui retourne le code de sortie 0 si l'apprenant a correctement complété l'étape, et un code non-zéro dans le cas contraire. Voici quelques exemples courants.",
          checkPackage: {
            title: "Vérifier un paquet installé"
          },
          checkFile: {
            title: "Vérifier l'existence d'un fichier"
          },
          checkService: {
            title: "Vérifier un service en cours d'exécution"
          },
          checkContent: {
            title: "Vérifier le contenu d'un fichier"
          },
          warning: {
            title: "Important",
            description: "Les scripts de vérification ne sont jamais montrés aux apprenants. Ils s'exécutent côté serveur sur le terminal de l'apprenant avec un délai d'expiration de 10 secondes. Assurez-vous que vos scripts s'exécutent rapidement et produisent une sortie claire en cas d'échec."
          }
        },

        ctf: {
          title: "Défis Flag CTF",
          description: "Ajoutez une dimension ludique à vos scénarios avec des défis Capture The Flag.",
          enable: {
            title: "Activer les flags sur le scénario",
            description: "Lors de la création ou la modification d'un scénario, activez l'option <strong>\"Flags activés\"</strong> pour activer le mode CTF pour ce scénario."
          },
          markSteps: {
            title: "Marquer les étapes comme étapes flag",
            description: "Pour les étapes individuelles, activez l'option <strong>\"A un flag\"</strong>. Ces étapes afficheront un champ de saisie de flag au lieu d'un bouton Vérifier."
          },
          unique: {
            title: "Flags uniques par apprenant",
            description: "Les flags sont générés par <strong>HMAC-SHA256</strong> et sont uniques par apprenant — il est impossible pour les apprenants de partager les réponses. Le format des flags est <strong>FLAG{'{'} 16-caractères-hexadécimaux {'}'}</strong>."
          },
          tip: {
            title: "Conseil",
            description: "Les flags CTF ajoutent un élément compétitif et ludique à vos exercices. Utilisez-les pour des défis bonus, des exercices orientés sécurité ou des sessions de formation compétitives."
          }
        },

        challengeMode: {
          title: "Mode Challenge (Crash Traps)",
          description: "Le mode challenge permet des scénarios avancés de type examen où l'environnement entier est provisionné en une fois — avec des comptes utilisateurs protégés par mot de passe, des configurations sabotées et des pièges mortels qui détruisent la machine en cas d'action irréfléchie.",
          enable: {
            title: "Activer le mode challenge",
            description: "Lors de la création d'un scénario, activez l'option <strong>\"Crash Traps\"</strong>. Cela active le mode challenge, qui change la façon dont le scénario est provisionné."
          },
          howItWorks: {
            title: "Comment ça fonctionne",
            description: "En mode challenge, le moteur de scénarios fonctionne différemment des scénarios standard étape par étape :",
            standard: "<strong>Mode standard</strong> : les flags sont déployés un par un au fur et à mesure que l'apprenant progresse. Le script d'arrière-plan de chaque étape configure uniquement cette étape.",
            challenge: "<strong>Mode challenge</strong> : TOUS les flags sont regroupés dans un fichier de configuration et poussés dans le conteneur au démarrage de la session. Le script d'arrière-plan de la première étape est un script de setup complet qui provisionne l'environnement entier en une fois — création d'utilisateurs, installation de pièges, placement de tous les flags."
          },
          whyNeeded: {
            title: "Pourquoi un mode séparé ?",
            description: "Les scénarios challenge utilisent le <strong>flag comme mot de passe</strong> : le flag de chaque niveau devient le mot de passe du compte Linux suivant (par ex., trouver FLAG_L0 permet de faire <code>su - level1</code>). Cela nécessite que TOUS les flags existent au moment de la création du conteneur pour définir tous les mots de passe des comptes. Déployer les flags un par un rendrait impossible la création des comptes avec les bons mots de passe."
          },
          setupScript: {
            title: "Le script de setup",
            description: "En mode challenge, le <strong>script d'arrière-plan de l'étape 0</strong> sert de script de provisionnement complet. Il lit <code>/etc/challenge/config.json</code> (automatiquement poussé par la plateforme avec tous les flags générés) et configure l'environnement entier : comptes utilisateurs, pièges, configurations sabotées et placement des flags."
          },
          crashTraps: {
            title: "Pièges mortels (Crash Traps)",
            description: "Les pièges mortels sont des mécanismes intégrés au conteneur qui <strong>détruisent la machine</strong> quand l'apprenant effectue une action irréfléchie (par ex., exécuter <code>sudo</code> sans vérifier les aliases, supprimer un fichier système au lieu de l'éditer). L'apprenant perd toute sa progression et doit démarrer une nouvelle session — c'est le mécanisme rogue-lite qui enseigne <strong>« comprendre avant d'agir »</strong>."
          },
          naming: {
            title: "Important : Nommage des fichiers flags",
            description: "Si votre challenge utilise LD_PRELOAD ou d'autres mécanismes de masquage de fichiers, assurez-vous que les noms de fichiers flags ne contiennent <strong>pas</strong> les mots « flag » ou « FLAG » — les fichiers cachés avec ces motifs deviennent invisibles dans les listings de répertoire. Utilisez des noms neutres comme <code>.the_key</code> ou <code>level1_key.txt</code> à la place."
          },
          tip: {
            title: "Conseil",
            description: "Les scénarios en mode challenge sont complexes à construire. Commencez par le script de setup (testez-le manuellement dans un conteneur), puis intégrez-le comme script d'arrière-plan de l'étape 0 et importez le scénario. La plateforme gère automatiquement la génération des flags, l'injection de la configuration et le changement d'utilisateur du terminal."
          }
        },

        killercoda: {
          title: "Compatibilité KillerCoda",
          description: "OCF supporte le format index.json de KillerCoda pour l'importation de scénarios, facilitant la migration de contenu existant.",
          layout: "L'arborescence standard KillerCoda est supportée : index.json pour les métadonnées, intro.md et finish.md pour les textes d'introduction et de conclusion, et des répertoires d'étapes (step1/, step2/, etc.) contenant text.md pour les instructions et verify.sh pour les scripts de vérification.",
          info: {
            title: "Note",
            description: "L'import par Git est prévu pour une prochaine version. En attendant, vous pouvez importer des scénarios via le panneau d'administration ou le script CLI seed."
          }
        },

        uploadAdmin: {
          title: "Import via le panneau d'administration",
          description: "Le moyen le plus simple d'importer un scénario compatible KillerCoda est via le panneau d'administration.",
          step1: {
            title: "Préparer votre archive",
            description: "Empaquetez votre répertoire de scénario en fichier <strong>.zip</strong> ou <strong>.tar.gz</strong>. L'archive doit contenir un fichier <strong>index.json</strong> à la racine (ou un niveau en dessous)."
          },
          step2: {
            title: "Ouvrir la fenêtre d'import",
            description: "Accédez à <strong>Admin > Scénarios</strong> et cliquez sur le bouton <strong>« Importer KillerCoda »</strong> en haut de la page.",
            button: "Aller aux Scénarios"
          },
          step3: {
            title: "Télécharger l'archive",
            description: "Glissez-déposez votre fichier archive sur la zone de téléchargement, ou cliquez pour le sélectionner. Le fichier doit faire moins de <strong>10 Mo</strong>. Cliquez sur <strong>« Importer »</strong> pour lancer le téléchargement."
          },
          upsert: {
            title: "Comportement de mise à jour",
            description: "Si un scénario avec le même nom existe déjà, il sera mis à jour avec le nouveau contenu. Les sessions actives et les secrets de drapeaux sont préservés."
          }
        },

        seeding: {
          title: "Import & mise à jour de scénarios (CLI)",
          description: "Utilisez le script seed-scenario.sh pour importer ou mettre à jour un scénario depuis un répertoire compatible KillerCoda. C'est le moyen le plus rapide pour charger du contenu en masse.",
          usage: {
            title: "Utilisation",
            description: "Lancez le script depuis le répertoire <strong>challenges/</strong> :",
            command: "./seed-scenario.sh &lt;scenario-dir&gt; [api-url] [auth-token]",
            example: "./seed-scenario.sh ./gameshell-basics http://localhost:8080 \"eyJhbGci...\""
          },
          token: {
            title: "Obtenir un token d'authentification",
            description: "Vous avez besoin d'un token JWT valide. Obtenez-le en vous connectant via l'API :",
            command: "curl -s -X POST http://localhost:8080/api/v1/auth/login -H 'Content-Type: application/json' -d '{'{'}\"email\":\"votre{'@'}email.com\",\"password\":\"votremotdepasse\"{'}'}' | python3 -c \"import json,sys; print(json.load(sys.stdin)['access_token'])\"",
            altDescription: "Ou copiez-le depuis les DevTools de votre navigateur (onglet Network, n'importe quelle requête API, en-tête Authorization)."
          },
          upsert: {
            title: "Création ou mise à jour",
            description: "L'endpoint seed utilise une logique upsert : si un scénario avec le même nom existe déjà, il met à jour le contenu (étapes, scripts, texte) tout en préservant le secret des flags pour que les sessions actives restent valides. Sinon, un nouveau scénario est créé."
          },
          envVar: {
            title: "Astuce",
            description: "Définissez la variable d'environnement <strong>OCF_AUTH_TOKEN</strong> pour éviter de passer le token à chaque fois : <code>export OCF_AUTH_TOKEN=\"eyJhbGci...\"</code>"
          }
        },

        monitoring: {
          title: "Suivi de la progression des apprenants",
          description: "Suivez la progression de vos apprenants à travers vos scénarios.",
          navigate: {
            title: "Consulter les sessions de scénario",
            description: "Allez dans <strong>Admin > Sessions de scénario</strong> pour voir toutes les sessions des apprenants sur vos scénarios.",
            button: "Accéder aux sessions"
          },
          track: {
            title: "Détails de progression",
            description: "Pour chaque session, vous pouvez voir le <strong>nom du scénario</strong>, l'<strong>étape en cours</strong>, le <strong>statut</strong> (active, terminée ou abandonnée) et les <strong>horodatages</strong> de début et fin de session. Les détails par étape montrent le nombre de tentatives de vérification et le temps passé par étape."
          }
        },

        archiving: {
          title: "Retirer un scénario",
          description: "Lorsqu'un scénario n'a plus lieu d'être joué — remplacé par une nouvelle édition, ou simplement obsolète — archivez-le plutôt que de le supprimer. La suppression retire ses affectations et prive les résultats passés du scénario sur lequel ils ont été obtenus ; l'archivage conserve chaque session, note et flag.",
          effect: {
            title: "Ce que l'archivage change",
            offered: "Le scénario disparaît du catalogue des apprenants et du sélecteur d'affectation.",
            assign: "Il ne peut plus être affecté à un groupe ou une organisation, ni lancé pour toute une classe.",
            launch: "Il ne peut plus être lancé, prévisualisé, ni repris sur un nouveau terminal.",
            keeps: "Les affectations existantes sont conservées, et chaque session passée garde sa note, sa progression et le nom du scénario dans les résultats de classe."
          },
          running: {
            title: "Les sessions en cours",
            description: "Un apprenant en train de suivre le scénario au moment où vous l'archivez n'est pas interrompu et va jusqu'au bout. L'archivage empêche les nouveaux lancements ; il n'interrompt jamais une session en cours."
          },
          where: {
            title: "Où le faire",
            library: "Scénarios d'organisation : l'onglet bibliothèque de scénarios, à côté des actions d'export.",
            editor: "Vos propres scénarios : l'éditeur de scénarios, dans le menu ⋯ à côté de Réinitialiser.",
            restore: "Les scénarios archivés restent visibles dans ces listes via l'option « Afficher les scénarios archivés », et Restaurer les remet en service à tout moment."
          },
          newEdition: {
            title: "Publier une nouvelle édition",
            description: "Dupliquez le scénario, modifiez la copie, puis archivez l'original. Les apprenants obtiennent la nouvelle édition tandis que les résultats obtenus sur l'ancienne continuent de la référencer."
          }
        },

        bestPractices: {
          title: "Bonnes pratiques",
          description: "Suivez ces recommandations pour créer des scénarios efficaces et engageants.",
          tips: {
            title: "Recommandations",
            tip1: "Commencez par une première étape simple pour mettre l'apprenant en confiance avant de passer à des tâches plus complexes.",
            tip2: "Utilisez des instructions claires et orientées action — dites aux apprenants exactement quelles commandes exécuter et quels résultats attendre.",
            tip3: "Fournissez des indices pour les étapes difficiles afin que les apprenants puissent se débloquer sans aide externe.",
            tip4: "Écrivez des scripts de vérification qui vérifient le résultat, pas la méthode — il existe souvent plusieurs approches valides pour une tâche.",
            tip5: "Définissez des durées estimées réalistes en fonction du niveau de difficulté et du nombre d'étapes du scénario.",
            tip6: "Utilisez le texte d'introduction pour poser le contexte et le texte de conclusion pour résumer ce qui a été appris dans l'exercice."
          }
        },

        nextSteps: {
          description: "Explorez d'autres ressources pour tirer le meilleur parti de la plateforme."
        }
      }
    },

    bulkLicenses: {
      overview: {
        title: "Gestion des Licences en Volume",
        intro: "Achetez et gérez des licences en volume pour votre organisation. Découvrez l'achat par lots, l'attribution de licences et les niveaux de tarification.",
        whatIs: {
          title: "Que sont les Licences en Volume ?",
          description: "Les licences en volume permettent aux organisations d'acheter plusieurs licences d'abonnement à un tarif réduit et de les distribuer aux membres.",
          benefit1: "Remises sur les achats en volume",
          benefit2: "Tableau de bord centralisé de gestion des licences",
          benefit3: "Attribution et réattribution flexibles",
          benefit4: "Suivi d'utilisation détaillé et rapports"
        },
        purchasing: {
          title: "Achat de Licences",
          description: "Suivez ces étapes pour acheter des licences en volume pour votre organisation.",
          step1: {
            title: "Choisir un Plan",
            description: "Sélectionnez le plan d'abonnement pour lequel vous souhaitez acheter des licences. Différents plans offrent différentes fonctionnalités."
          },
          step2: {
            title: "Sélectionner la Quantité",
            description: "Choisissez le nombre de licences dont vous avez besoin. Les remises de volume s'appliquent automatiquement à certains seuils."
          },
          step3: {
            title: "Finaliser le Paiement",
            description: "Vérifiez le détail des prix et finalisez l'achat. Les licences sont disponibles immédiatement après le paiement."
          }
        },
        batchManagement: {
          title: "Gestion des Lots",
          description: "Gérez vos lots de licences depuis le tableau de bord de gestion des licences.",
          viewBatches: "Consultez tous les lots de licences actifs et expirés",
          trackUsage: "Suivez le nombre de licences attribuées vs disponibles",
          renewBatches: "Renouvelez les lots avant leur expiration",
          exportReports: "Exportez des rapports d'utilisation à des fins comptables"
        },
        assignment: {
          title: "Attribution des Licences",
          description: "Attribuez des licences aux membres de l'organisation.",
          individual: "Attribuez des licences à des utilisateurs individuels depuis la page de détail du lot",
          group: "Attribuez des licences à tous les membres d'un groupe en une fois",
          automatic: "Configurez l'attribution automatique pour les nouveaux membres de groupe",
          revoke: "Révoquez et réattribuez les licences lorsque des membres partent"
        },
        pricing: {
          title: "Tarification",
          description: "Des tarifs dégressifs sont disponibles pour les achats de licences en volume.",
          tier1: "1-10 licences : tarif standard",
          tier2: "11-50 licences : réduction de 10%",
          tier3: "51-100 licences : réduction de 15%",
          tier4: "Plus de 100 licences : contactez-nous pour un tarif personnalisé",
          note: "Les tarifs peuvent varier selon le plan d'abonnement. Contactez le service commercial pour les devis entreprise."
        },
        nextSteps: {
          organizations: {
            title: "Vue d'ensemble des Organisations",
            description: "Découvrez les fonctionnalités de gestion des organisations"
          },
          billing: {
            title: "Facturation et Paiements",
            description: "Comprenez le système de facturation et les options de paiement"
          }
        }
      }
    }
  }
};