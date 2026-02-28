/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
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
        description: "Apprenez à créer, gérer et partager vos sessions de terminaux",
        gettingStarted: "Premiers Pas",
        managingSessions: "Gestion des Sessions",
        sharing: "Partage et Collaboration",
        troubleshooting: "Dépannage"
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
        rolesAndPermissions: "Rôles et Permissions"
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
            title: "Choisir Votre Configuration",
            description: "Sélectionnez le type d'environnement dont vous avez besoin (développement, production, langage spécifique, etc.). Chaque configuration vient avec des outils pré-installés adaptés à vos besoins."
          },
          step3: {
            title: "Définir les Paramètres d'Accès",
            description: "Configurez les paramètres d'accès : nom de session, options de partage et durée. Vous pouvez créer des sessions privées ou des sessions partagées avec votre équipe."
          },
          step4: {
            title: "Lancer Votre Terminal",
            description: "Une fois configuré, lancez votre terminal. Le démarrage initial peut prendre quelques instants pour préparer votre environnement."
          }
        },

        quickAccess: {
          title: "Accès Rapide",
          mySessions: "Consultez vos sessions actives sur la page \"Mes Sessions\"",
          sharedSessions: "Accédez aux sessions partagées avec vous via \"Partagées avec Moi\"",
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
            title: "Configurer votre session",
            item1: "<strong>Conditions d'utilisation :</strong> Acceptez les conditions (obligatoire)",
            item2: "<strong>Durée d'expiration :</strong> Choisissez combien de temps votre session restera active (optionnel)"
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
          title: "Support Multi-Backend",
          description: "Lorsque plusieurs backends de terminaux sont disponibles, vous pouvez choisir le serveur à utiliser pour votre session. Cela vous permet de sélectionner l'infrastructure la plus proche de votre localisation ou la mieux adaptée à votre charge de travail.",
          selectBackend: {
            title: "Sélectionner un backend",
            description: "Sur la page de création de session, un <strong>sélecteur de backend</strong> apparaît lorsque plusieurs serveurs sont disponibles. Choisissez le backend qui correspond le mieux à vos besoins."
          },
          tip: {
            title: "Conseil",
            description: "Si un seul backend est configuré, le sélecteur est masqué et le serveur par défaut est utilisé automatiquement."
          }
        },

        machineSizes: {
          title: "Tailles de machine",
          description: "Les sessions de terminal sont disponibles en différentes tailles, chacune offrant des quantités différentes de CPU et de mémoire. Les tailles disponibles dépendent de votre plan d'abonnement.",
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
          planTip: {
            title: "Disponibilité selon le plan",
            description: "Votre plan d'abonnement détermine les tailles de machine auxquelles vous avez accès. Consultez les détails de votre plan pour connaître les tailles autorisées."
          }
        },

        usageQuota: {
          title: "Panneau d'utilisation et quotas",
          description: "Avant de créer une session, le panneau d'utilisation affiche votre consommation actuelle de ressources en un coup d'œil.",
          concurrentSessions: {
            title: "Sessions simultanées",
            description: "Indique le nombre de sessions terminal actives que vous utilisez actuellement par rapport au maximum autorisé par votre plan."
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
            description: "Sessions que vous pouvez partager avec des collègues ou étudiants. Utiles pour la collaboration ou l'enseignement."
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
          sharing: {
            title: "Partage et Collaboration",
            description: "Apprenez à partager vos terminaux avec d'autres utilisateurs"
          },
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
        }
      },

      sharing: {
        title: "Partage et Collaboration",
        intro: "Les terminaux peuvent être partagés avec d'autres utilisateurs pour faciliter la collaboration, l'enseignement ou le support technique.",

        howToShare: {
          title: "Comment Partager un Terminal"
        },

        sharingSteps: {
          description: "Le partage de terminaux se fait en quelques étapes simples :",
          step1: {
            title: "Accédez à vos sessions",
            description: "Allez dans <strong>Travaux Pratiques > Mes Sessions</strong> pour voir la liste de vos sessions terminal actives.",
            button: "Voir mes sessions"
          },
          step2: {
            title: "Configurer le partage",
            description: "Pour chaque session, vous pouvez configurer les options de partage :",
            item1: "<strong>Activer le partage</strong> pour rendre la session accessible",
            item2: "<strong>Ajouter des utilisateurs</strong> par email ou nom d'utilisateur",
            item3: "<strong>Définir les permissions</strong> (lecture seule ou lecture-écriture)",
            item4: "<strong>Définir la durée</strong> d'accès si nécessaire"
          },
          step3: {
            title: "Partager le lien",
            description: "Copiez le <strong>lien de partage</strong> et envoyez-le aux utilisateurs autorisés. Ils pourront accéder au terminal directement depuis leur compte."
          }
        },

        accessManagement: {
          title: "Gestion des Accès",
          description: "Contrôlez précisément qui peut accéder à vos terminaux et ce qu'ils peuvent faire.",
          readOnly: {
            description: "L'utilisateur peut voir le contenu du terminal et observer les commandes exécutées, mais ne peut pas interagir ou modifier quoi que ce soit.",
            tag1: "👁️ Observation",
            tag2: "📋 Copie autorisée",
            tag3: "🚫 Pas de modification"
          },
          readWrite: {
            description: "L'utilisateur peut exécuter des commandes, modifier des fichiers et interagir pleinement avec le terminal.",
            tag1: "⌨️ Commandes",
            tag2: "✏️ Modifications",
            tag3: "💾 Sauvegarde"
          },
          actionsTitle: "Actions de gestion :",
          actions: {
            manage: {
              title: "Gérer les utilisateurs",
              description: "Ajoutez ou supprimez des utilisateurs ayant accès à votre terminal"
            },
            revoke: {
              title: "Révoquer l'accès",
              description: "Retirez immédiatement l'accès d'un utilisateur spécifique"
            },
            modify: {
              title: "Modifier les permissions",
              description: "Changez les niveaux d'accès ou les durées de partage"
            }
          }
        },

        permissions: {
          title: "Permissions d'Accès",
          readOnly: {
            title: "Lecture Seule",
            description: "Les utilisateurs peuvent voir le contenu du terminal mais ne peuvent pas exécuter de commandes"
          },
          readWrite: {
            title: "Lecture-Écriture",
            description: "Les utilisateurs peuvent exécuter des commandes et modifier des fichiers"
          },
          admin: {
            title: "Administrateur",
            description: "Accès complet incluant les paramètres du terminal et la gestion des utilisateurs"
          }
        },

        accessingShared: {
          title: "Accéder aux Terminaux Partagés",
          description: "Lorsque quelqu'un partage un terminal avec vous, voici comment y accéder :",
          step1: {
            title: "Vérifiez vos partages",
            description: "Allez dans <strong>Travaux Pratiques > Partagés avec Moi</strong> pour voir tous les terminaux auxquels vous avez accès.",
            button: "Voir les terminaux partagés"
          },
          step2: {
            title: "Informations du partage",
            description: "Pour chaque terminal partagé, vous verrez :",
            item1: "<strong>Le propriétaire</strong> qui a partagé le terminal",
            item2: "<strong>Vos permissions</strong> (lecture seule ou lecture-écriture)",
            item3: "<strong>La date d'expiration</strong> de l'accès si applicable",
            item4: "<strong>Le statut</strong> de la session (active, arrêtée, expirée)"
          },
          step3: {
            title: "Se connecter",
            description: "Cliquez sur <strong>\"Ouvrir\"</strong> pour accéder au terminal partagé dans une nouvelle fenêtre."
          }
        },

        useCases: {
          title: "Cas d'Usage",
          teaching: {
            title: "Enseignement et Formation",
            description: "Partagez des terminaux avec des étudiants pour des exercices pratiques ou des démonstrations en direct"
          },
          collaboration: {
            title: "Collaboration d'Équipe",
            description: "Travaillez ensemble sur la même base de code en temps réel"
          },
          support: {
            title: "Support Technique",
            description: "Permettez à l'équipe de support d'accéder à votre environnement pour résoudre des problèmes"
          },
          presentation: {
            title: "Présentations",
            description: "Utilisez des terminaux partagés pour des démonstrations de programmation en direct"
          }
        },

        commonUseCases: {
          title: "Cas d'Usage Fréquents",
          description: "Le partage de terminaux s'adapte à de nombreux scénarios d'utilisation :",
          teaching: {
            description: "Créez des <strong>environnements d'apprentissage guidés</strong> où les étudiants peuvent pratiquer sous supervision. Partagez des terminaux préparés avec des exercices et observez leur progression en temps réel."
          },
          support: {
            description: "Facilitez le <strong>dépannage et l'assistance technique</strong> en donnant un accès temporaire à votre environnement. L'équipe support peut diagnostiquer et résoudre les problèmes directement."
          },
          collaboration: {
            title: "Développement Collaboratif",
            description: "Travaillez en équipe sur le même code, en temps réel, avec partage d'écran intégré et synchronisation instantanée."
          },
          mentoring: {
            title: "Mentorat et Accompagnement",
            description: "Accompagnez des développeurs juniors en leur montrant directement les bonnes pratiques et techniques de développement."
          }
        },

        securityPractices: {
          verifyIdentity: {
            title: "Vérifiez l'identité",
            description: "Assurez-vous de ne partager vos terminaux qu'avec des personnes de confiance et vérifiez les adresses email"
          },
          limitDuration: {
            title: "Limitez la durée",
            description: "Configurez des durées d'accès limitées pour les partages temporaires"
          },
          monitorActivity: {
            title: "Surveillez l'activité",
            description: "Gardez un œil sur ce qui se passe dans les terminaux partagés en accès écriture"
          },
          backupFirst: {
            title: "Sauvegardez d'abord",
            description: "Faites une copie de sauvegarde de votre travail important avant de partager en mode écriture"
          },
          revokeQuickly: {
            title: "Révoquez rapidement",
            description: "Supprimez les accès dès qu'ils ne sont plus nécessaires"
          },
          respectData: {
            title: "Respectez les données",
            description: "Ne partagez jamais de terminaux contenant des informations sensibles ou confidentielles"
          }
        },

        security: {
          title: "Sécurité et Bonnes Pratiques",
          practices: {
            practice1: "Ne partagez jamais de terminaux contenant des informations sensibles",
            practice2: "Révisez et révoquez régulièrement les accès non nécessaires",
            practice3: "Utilisez l'accès en lecture seule quand c'est possible",
            practice4: "Surveillez l'activité dans les sessions partagées",
            practice5: "Configurez l'expiration automatique des sessions pour les accès temporaires"
          }
        },

        limitations: {
          title: "Limitations et Considérations",
          description: "Gardez à l'esprit ces aspects lors du partage de terminaux :",
          users: {
            title: "Nombre d'utilisateurs",
            description: "Le nombre d'utilisateurs pouvant accéder simultanément à un terminal peut être limité selon votre plan d'abonnement"
          },
          network: {
            title: "Performance réseau",
            description: "La latence peut augmenter avec plusieurs utilisateurs connectés. Privilégiez les connexions stables"
          },
          sync: {
            title: "Synchronisation",
            description: "Les modifications sont synchronisées en temps réel mais peuvent avoir un léger délai selon la connexion"
          },
          history: {
            title: "Historique des commandes",
            description: "Toutes les commandes exécutées par tous les utilisateurs sont enregistrées dans l'historique du terminal"
          }
        },

        nextSteps: {
          managingSessions: {
            title: "Gestion des Sessions",
            description: "Apprendre à gérer efficacement vos sessions terminal"
          },
          troubleshooting: {
            title: "Dépannage",
            description: "Résoudre les problèmes courants de partage et d'accès"
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

        sharingProblems: {
          title: "Problèmes de partage",
          cannotShare: {
            title: "Impossible de partager un terminal",
            checksTitle: "Vérifications :",
            checks: {
              check1: "La session est-elle active ?",
              check2: "L'utilisateur destinataire existe-t-il ?",
              check3: "Avez-vous les permissions de partage ?"
            },
            solutionTitle: "Solution :",
            solution: "Synchronisez d'abord votre session, puis réessayez le partage avec un email valide."
          },
          cannotAccess: {
            title: "Utilisateur ne peut pas accéder au terminal partagé",
            checksTitle: "Points à vérifier :",
            checks: {
              check1: "Le partage n'a pas expiré",
              check2: "L'utilisateur est connecté à son compte",
              check3: "Les permissions sont correctes",
              check4: "La session source est toujours active"
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
          },
          sharing: {
            title: "Partage et collaboration",
            description: "Maîtrisez les fonctionnalités de partage"
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
        title: "Abonnement et Plans",
        intro: "Gérez votre abonnement, comprenez les fonctionnalités des plans et optimisez votre utilisation.",

        overview: {
          title: "Vue d'ensemble des abonnements",
          description: "OCF propose différents plans d'abonnement adaptés à vos besoins d'apprentissage et d'enseignement. Chaque plan offre un accès à des fonctionnalités spécifiques et des quotas d'utilisation.",
          individual: {
            title: "Plans individuels",
            description: "Parfaits pour l'apprentissage personnel et les projets individuels. Accès aux terminaux, création de contenu et ressources de base."
          },
          educational: {
            title: "Plans éducatifs",
            description: "Conçus pour les enseignants et formateurs. Fonctionnalités avancées de collaboration et gestion de classes."
          },
          enterprise: {
            title: "Plans entreprise",
            description: "Solutions pour les organisations et institutions. Support prioritaire, personnalisation et intégrations avancées."
          }
        },

        dashboard: {
          title: "Tableau de bord abonnement",
          description: "Le tableau de bord vous donne une vue complète de votre abonnement actuel et de votre utilisation.",
          usage: {
            title: "Suivi de l'utilisation",
            description: "Surveillez votre consommation de ressources : sessions terminal actives, stockage utilisé, bande passante et autres métriques importantes.",
            button: "Voir le tableau de bord"
          },
          info: {
            title: "Informations d'abonnement",
            description: "Consultez les détails de votre plan actuel : date de renouvellement, fonctionnalités incluses, limites et quotas disponibles."
          },
          alerts: {
            title: "Alertes et notifications",
            description: "Recevez des alertes lorsque vous approchez de vos limites d'utilisation ou lorsque votre abonnement nécessite une attention."
          }
        },

        usageMetrics: {
          title: "Indicateurs d'utilisation",
          description: "Le tableau de bord de votre abonnement affiche les indicateurs clés d'utilisation pour suivre votre consommation en un coup d'oeil.",
          activeCourses: {
            title: "Cours actifs",
            description: "Le nombre de cours actuellement actifs sur votre compte. Ce compteur reflète les cours en cours ou publiés, vous permettant de suivre votre production de contenu."
          },
          concurrentTerminals: {
            title: "Terminaux simultanés",
            description: "Le nombre de sessions terminal fonctionnant simultanément. Votre plan définit le maximum autorisé, et le tableau de bord affiche votre utilisation actuelle en temps réel."
          },
          concurrentUsers: {
            title: "Utilisateurs simultanés",
            description: "Le nombre d'utilisateurs connectés en même temps sur l'ensemble de vos sessions. Cet indicateur est particulièrement pertinent pour les formateurs gérant des classes en direct."
          }
        },

        subscriptionSource: {
          title: "Source de l'abonnement",
          description: "Votre abonnement peut provenir de deux sources différentes. Le tableau de bord indique clairement laquelle est actuellement active.",
          personal: {
            title: "Abonnement personnel",
            description: "Un abonnement que vous avez souscrit et que vous gérez vous-même. Vous avez le contrôle total sur la facturation, les changements de plan et l'annulation."
          },
          organization: {
            title: "Abonnement attribué par une organisation",
            description: "Un abonnement qui vous a été attribué par un administrateur d'organisation. L'organisation gère la facturation et les paramètres du plan en votre nom."
          },
          indicator: {
            title: "Indicateur visuel",
            description: "Un badge sur votre tableau de bord indique clairement si votre abonnement actif est personnel ou attribué par une organisation, pour lever toute ambiguïté."
          }
        },

        multipleSubscriptions: {
          title: "Abonnements multiples",
          description: "Si vous disposez d'abonnements provenant de plusieurs sources (par exemple, un plan personnel et un plan attribué par une organisation), ils sont affichés sous forme empilée sur votre tableau de bord.",
          stacked: {
            title: "Affichage empilé",
            description: "Lorsque vous détenez deux abonnements ou plus provenant de sources différentes, chacun apparaît sous forme de carte distincte. L'abonnement de niveau le plus élevé a la priorité pour déterminer vos fonctionnalités et quotas disponibles."
          }
        },

        assignedSubscriptions: {
          title: "Abonnements attribués",
          description: "Lorsque votre abonnement est attribué par une organisation, votre expérience est simplifiée : la section facturation est masquée puisque l'organisation gère directement les paiements.",
          managedByAdmin: "Géré par l'administrateur de votre organisation qui contrôle le niveau du plan et le renouvellement",
          noBilling: "Vue simplifiée sans détails de facturation, l'organisation prenant en charge tous les paiements",
          sameFeatures: "Accès aux mêmes fonctionnalités et quotas qu'un abonnement personnel du même niveau"
        },

        freePlan: {
          title: "Plan gratuit",
          description: "Le plan gratuit vous permet d'explorer la plateforme et de démarrer sans aucun engagement financier.",
          noCreditCard: {
            title: "Aucune carte bancaire requise",
            description: "Vous pouvez activer le plan gratuit instantanément sans saisir aucune information de paiement. Créez simplement votre compte et commencez à utiliser la plateforme immédiatement."
          }
        },

        trialPeriod: {
          title: "Période d'essai",
          description: "Lorsque vous démarrez l'essai d'un plan payant, votre tableau de bord affiche un compte à rebours pour que vous sachiez toujours combien de temps il reste avant la fin de l'essai.",
          countdown: "Un compteur de compte à rebours d'essai est affiché de manière visible sur votre tableau de bord d'abonnement",
          daysRemaining: "Le nombre de jours restants dans votre essai est affiché clairement, avec une mise à jour quotidienne",
          upgradeAnytime: "Vous pouvez passer à un plan payant à tout moment pendant l'essai pour conserver un accès ininterrompu"
        },

        planChange: {
          title: "Changement de plan",
          description: "Vous pouvez modifier votre abonnement à tout moment selon l'évolution de vos besoins.",
          step1: {
            title: "Évaluer vos besoins",
            description: "Analysez votre utilisation actuelle et identifiez les fonctionnalités dont vous avez besoin pour optimiser votre choix de plan."
          },
          step2: {
            title: "Comparer les plans",
            description: "Explorez les différentes options disponibles et leurs avantages. Comparez les fonctionnalités, quotas et tarifs.",
            button: "Voir les plans disponibles"
          },
          step3: {
            title: "Effectuer le changement",
            description: "Sélectionnez votre nouveau plan et suivez le processus de mise à niveau ou de rétrogradation selon vos besoins."
          },
          tips: {
            title: "Points importants à retenir :",
            upgrade: {
              title: "Mise à niveau",
              description: "Les améliorations prennent effet immédiatement. La facturation est ajustée au prorata pour la période en cours."
            },
            downgrade: {
              title: "Rétrogradation",
              description: "Les changements vers un plan inférieur prennent généralement effet au prochain cycle de facturation pour éviter la perte de données."
            },
            dataProtection: {
              title: "Protection des données",
              description: "Vos données et configurations sont préservées lors des changements de plan. Seuls les quotas et fonctionnalités disponibles sont modifiés."
            }
          }
        },

        optimization: {
          title: "Optimisation de l'utilisation",
          description: "Maximisez la valeur de votre abonnement en adoptant ces bonnes pratiques :",
          sessions: {
            title: "Gestion des sessions",
            description: "Fermez les sessions terminal inutilisées pour économiser vos quotas. Utilisez des durées d'expiration appropriées pour vos sessions."
          },
          storage: {
            title: "Stockage efficace",
            description: "Nettoyez régulièrement les fichiers temporaires et anciens projets. Utilisez des dépôts Git externes pour les gros projets."
          },
          sharing: {
            title: "Partage intelligent",
            description: "Partagez les ressources avec vos collaborateurs pour éviter la duplication et optimiser l'utilisation collective."
          },
          planning: {
            title: "Planification d'usage",
            description: "Planifiez vos activités intensives pendant les heures creuses et surveillez vos pics d'utilisation."
          }
        },

        suspension: {
          title: "Suspension et annulation",
          description: "Vous avez le contrôle total sur votre abonnement, y compris la possibilité de le suspendre temporairement ou de l'annuler définitivement.",
          pause: {
            title: "Suspension temporaire",
            description: "Mettez votre abonnement en pause pendant une période déterminée. Idéal pour les vacances ou les périodes d'inactivité prévues.",
            feature1: "Conservation de toutes vos données",
            feature2: "Arrêt de la facturation pendant la pause",
            feature3: "Reprise facile quand vous le souhaitez",
            feature4: "Durée maximale selon les conditions"
          },
          cancel: {
            title: "Annulation définitive",
            description: "Annulez votre abonnement de manière permanente. Toutes les données seront supprimées après la période de grâce.",
            feature1: "Accès maintenu jusqu'à la fin du cycle payé",
            feature2: "Période de grâce pour récupérer les données",
            feature3: "Suppression définitive après expiration",
            feature4: "Possibilité de réactivation avec nouveau compte"
          },
          warning: {
            title: "Important",
            description: "<strong>Sauvegardez vos données importantes</strong> avant toute suspension ou annulation. Bien que nous conservions vos données pendant une période de grâce, il est recommandé de faire des sauvegardes locales de vos projets critiques."
          }
        },

        evolution: {
          title: "Évolution du système d'abonnement",
          notice: "<strong>Le système d'abonnement OCF est en développement actif.</strong> De nouvelles options de plans, fonctionnalités de facturation et outils de gestion seront régulièrement ajoutés pour mieux répondre à vos besoins.",
          upcoming: {
            title: "Améliorations prévues :",
            feature1: "Plans personnalisables avec options à la carte",
            feature2: "Facturation basée sur l'utilisation réelle",
            feature3: "Gestion d'équipe et facturation centralisée",
            feature4: "Intégrations avec systèmes de gestion existants",
            feature5: "Analytics avancés d'utilisation"
          },
          documentation: "Cette documentation sera mise à jour pour refléter les nouvelles fonctionnalités au fur et à mesure de leur déploiement."
        },

        support: {
          title: "Support et assistance",
          description: "Notre équipe support est là pour vous aider avec toutes vos questions d'abonnement :",
          email: {
            title: "Support par email",
            description: "Pour les questions générales sur votre abonnement",
            button: "Contacter le support"
          },
          billing: {
            title: "Questions de facturation",
            description: "Pour les problèmes de paiement et facturation",
            button: "Support facturation"
          },
          optimization: {
            title: "Conseils d'optimisation",
            description: "Pour optimiser votre utilisation et choisir le bon plan",
            button: "Demander conseil"
          }
        },

        nextSteps: {
          billing: {
            title: "Facturation",
            description: "Gérer vos méthodes de paiement et consulter vos factures"
          },
          dashboard: {
            title: "Tableau de bord",
            description: "Consulter votre utilisation actuelle et les détails de votre plan"
          },
          plans: {
            title: "Plans disponibles",
            description: "Explorer et comparer tous les plans d'abonnement"
          }
        }
      },

      billing: {
        title: "Facturation et Paiements",
        intro: "Tout ce que vous devez savoir sur la facturation, les paiements et la gestion financière de votre compte.",

        system: {
          title: "Système de facturation",
          description: "OCF utilise un système de facturation automatisé intégré avec Stripe pour garantir des paiements sécurisés et une gestion transparente de votre abonnement.",
          recurring: {
            title: "Facturation récurrente",
            description: "Les abonnements sont facturés automatiquement selon votre cycle choisi (mensuel ou annuel). Vous recevez une facture avant chaque prélèvement."
          },
          secure: {
            title: "Paiements sécurisés",
            description: "Tous les paiements sont traités via Stripe, leader mondial de la sécurité des paiements en ligne. Vos données sont protégées."
          },
          transparent: {
            title: "Facturation transparente",
            description: "Toutes les charges sont clairement détaillées dans vos factures. Pas de frais cachés, seulement ce que vous utilisez et souscrivez."
          }
        },

        paymentMethods: {
          title: "Méthodes de paiement",
          description: "Gérez vos cartes de crédit et autres méthodes de paiement pour assurer la continuité de votre service OCF.",
          types: {
            title: "Types de paiement acceptés :",
            visa: "Visa",
            mastercard: "Mastercard",
            amex: "American Express",
            sepa: "Virement SEPA"
          },
          management: {
            title: "Gestion de vos méthodes :",
            add: {
              title: "Ajouter une méthode",
              description: "Ajoutez une nouvelle carte ou méthode de paiement de secours",
              button: "Gérer les paiements"
            },
            default: {
              title: "Méthode par défaut",
              description: "Définissez quelle méthode utiliser en priorité pour vos factures"
            },
            update: {
              title: "Mise à jour",
              description: "Modifiez les informations d'une carte expirée ou changée"
            }
          },
          security: {
            title: "Conseils de sécurité :",
            tip1: "Utilisez uniquement des connexions sécurisées (HTTPS)",
            tip2: "Vérifiez régulièrement vos relevés bancaires",
            tip3: "Activez les notifications de paiement",
            tip4: "Supprimez les méthodes de paiement inutilisées"
          }
        },

        billingAddress: {
          title: "Adresses de facturation",
          description: "Configurez vos adresses de facturation pour recevoir des factures conformes aux réglementations fiscales de votre pays.",
          importance: {
            title: "Pourquoi c'est important :",
            fiscal: "Conformité fiscale selon votre localisation",
            vat: "Application correcte de la TVA et taxes locales",
            accounting: "Factures valides pour votre comptabilité",
            regulations: "Respect des réglementations internationales"
          },
          management: {
            title: "Gestion des adresses :",
            primary: {
              title: "Adresse principale",
              description: "Votre adresse de facturation par défaut"
            },
            business: {
              title: "Adresses professionnelles",
              description: "Adresses d'entreprise pour facturation institutionnelle"
            },
            edit: {
              title: "Modification",
              description: "Mise à jour en cas de déménagement ou changement"
            },
            button: "Gérer les adresses"
          }
        },

        invoices: {
          title: "Consultation des factures",
          description: "Accédez à toutes vos factures OCF, téléchargez-les et suivez l'historique de vos paiements pour votre comptabilité.",
          features: {
            history: {
              title: "Historique complet",
              description: "Consultez toutes vos factures depuis le début de votre abonnement. Recherchez par date, montant ou statut."
            },
            download: {
              title: "Téléchargement PDF",
              description: "Téléchargez vos factures au format PDF pour votre comptabilité ou vos déclarations fiscales."
            },
            details: {
              title: "Détails transparents",
              description: "Chaque facture détaille clairement les services utilisés, les périodes de facturation et les taxes applicables."
            },
            button: "Consulter mes factures"
          },
          structure: {
            title: "Structure d'une facture OCF :",
            headerLabel: "En-tête :",
            header: "Informations OCF et vos coordonnées",
            periodLabel: "Période :",
            period: "Dates de service et de facturation",
            detailLabel: "Détail :",
            detail: "Services utilisés et tarifs appliqués",
            taxesLabel: "Taxes :",
            taxes: "TVA et taxes locales selon votre pays",
            totalLabel: "Total :",
            total: "Montant final et méthode de paiement"
          }
        },

        paymentIssues: {
          title: "Problèmes de paiement",
          description: "Si vous rencontrez des difficultés avec vos paiements, voici les étapes à suivre pour résoudre rapidement les problèmes.",
          declined: {
            title: "Paiement refusé",
            causes: {
              title: "Causes courantes :",
              insufficient: "Fonds insuffisants sur le compte",
              expired: "Carte expirée ou bloquée",
              limit: "Limite de paiement dépassée",
              incorrect: "Informations incorrectes"
            },
            solutions: {
              title: "Solutions :",
              balance: "Vérifiez le solde de votre compte",
              update: "Mettez à jour les informations de carte",
              bank: "Contactez votre banque si nécessaire",
              alternative: "Utilisez une méthode de paiement alternative"
            }
          },
          retry: {
            title: "Nouvelle tentative",
            description1: "OCF effectue automatiquement plusieurs tentatives de paiement sur quelques jours en cas d'échec initial.",
            description2: "Vous recevez des notifications par email pour vous informer de la situation et vous permettre de corriger le problème."
          },
          suspension: {
            title: "Suspension du service",
            description1: "En cas d'échec répété des paiements, votre service peut être temporairement suspendu pour éviter l'accumulation de frais.",
            description2: "Votre compte et vos données restent saufs pendant la suspension. Le service reprend automatiquement après règlement."
          }
        },

        refunds: {
          title: "Remboursements et crédits",
          description: "Informations sur les conditions de remboursement et le système de crédits OCF.",
          policy: {
            title: "Politique de remboursement :",
            trial: {
              title: "Période d'essai",
              description: "Remboursement intégral possible pendant les 7 premiers jours de votre première souscription (conditions d'utilisation normale)."
            },
            proration: {
              title: "Remboursement au prorata",
              description: "En cas de rétrogradation ou d'annulation, remboursement calculé sur la période non utilisée."
            },
            technical: {
              title: "Problèmes techniques",
              description: "Crédits ou remboursements accordés en cas d'interruption prolongée du service due à des problèmes techniques."
            }
          },
          credits: {
            title: "Système de crédits :",
            description1: "OCF peut attribuer des crédits à votre compte pour compenser des désagréments ou dans le cadre de promotions spéciales.",
            description2: "Les crédits sont automatiquement appliqués à vos prochaines factures et apparaissent clairement dans votre historique de facturation."
          }
        },

        evolution: {
          title: "Évolution du système de facturation",
          notice: "<strong>Le système de facturation OCF continue d'évoluer</strong> pour offrir plus de flexibilité et de transparence dans la gestion de vos paiements et abonnements.",
          upcoming: {
            title: "Améliorations en développement :",
            usage: "Facturation détaillée par usage réel des ressources",
            alternatives: "Options de paiement alternatives (crypto, virements)",
            group: "Facturation groupée pour les organisations",
            alerts: "Alertes avancées de consommation et budget",
            integration: "Intégration avec systèmes comptables d'entreprise",
            currencies: "Devises locales et paiements internationaux optimisés"
          }
        },

        support: {
          title: "Support facturation",
          description: "Notre équipe support est spécialisée dans la résolution rapide des problèmes de facturation et de paiement.",
          email: {
            title: "Email support",
            description: "Réponse sous 24h pour les questions de facturation",
            button: "Contacter le support"
          },
          priority: {
            title: "Support prioritaire",
            description: "Assistance téléphonique pour les problèmes urgents de paiement",
            note: "Disponible pour les plans entreprise"
          },
          tips: {
            title: "Pour un support efficace, incluez :",
            email: "Votre adresse email de compte",
            invoice: "Numéro de facture concernée",
            datetime: "Date et heure du problème",
            screenshot: "Capture d'écran si applicable"
          }
        },

        resources: {
          title: "Ressources utiles",
          subscription: {
            title: "Gestion d'abonnement",
            description: "Comprendre et optimiser votre plan OCF"
          },
          paymentMethods: {
            title: "Méthodes de paiement",
            description: "Ajouter et gérer vos cartes et comptes"
          },
          invoices: {
            title: "Mes factures",
            description: "Consulter et télécharger vos factures"
          },
          addresses: {
            title: "Adresses de facturation",
            description: "Configurer vos informations de facturation"
          }
        }
      },

      rolesAndPermissions: {
        title: "Rôles et Permissions",
        intro: "Comprendre les rôles d'organisation et ce que chaque rôle peut faire.",
        rolesTitle: "Rôles et permissions",
        rolesSubtitle: "Comprendre les rôles utilisateur et le contrôle d'accès dans le système",
        overviewTitle: "Vue d'ensemble",
        overviewDescription: "Le système utilise un modèle de rôles à trois niveaux pour gérer l'accès et les permissions à différents niveaux.",
        platformLevel: "Niveau plateforme",
        platformLevelDesc: "Accès administrateur système avec contrôle total",
        organizationLevel: "Niveau organisation",
        organizationLevelDesc: "Gérer les organisations, membres, facturation et abonnements",
        groupLevel: "Niveau groupe",
        groupLevelDesc: "Gérer les groupes (classes), cours et accès des étudiants",
        orgRolesTitle: "Rôles d'organisation",
        orgRolesDescription: "Ces rôles contrôlent l'accès aux fonctionnalités de gestion d'organisation :",
        permission: "Permission",
        owner: "Propriétaire",
        manager: "Gestionnaire",
        member: "Membre",
        viewOrganization: "Voir l'organisation",
        inviteMembers: "Inviter des membres",
        removeMembers: "Retirer des membres",
        changeRoles: "Changer les rôles des membres",
        promoteToOwner: "Promouvoir des membres en propriétaires",
        manageBilling: "Gérer la facturation",
        manageSubscriptions: "Gérer les abonnements",
        editOrgSettings: "Modifier les paramètres",
        deleteOrganization: "Supprimer l'organisation",
        transferOwnership: "Transférer la propriété",
        allowed: "Autorisé",
        partial: "Partiel (avec restrictions)",
        denied: "Non autorisé",
        cannotPromoteToOwner: "Peut changer les rôles en membre ou gestionnaire, mais pas en propriétaire",
        groupRolesTitle: "Rôles de groupe",
        groupRolesDescription: "Les groupes représentent des classes ou équipes au sein d'une organisation :",
        groupOwner: "Propriétaire",
        groupOwnerDesc: "Le créateur du groupe avec contrôle total.",
        groupOwnerPerm1: "Supprimer le groupe",
        groupOwnerPerm2: "Transférer la propriété",
        groupOwnerPerm3: "Assigner des administrateurs et assistants",
        groupAdmin: "Administrateur",
        groupAdminDesc: "Co-instructeurs avec permissions de gestion.",
        groupAdminPerm1: "Gérer le contenu et les cours du groupe",
        groupAdminPerm2: "Ajouter/retirer des membres",
        groupAdminPerm3: "Voir les analyses du groupe",
        groupAssistant: "Assistant",
        groupAssistantDesc: "Assistants pédagogiques avec accès de gestion limité.",
        groupAssistantPerm1: "Aider à gérer les activités du groupe",
        groupAssistantPerm2: "Voir la progression des membres",
        groupAssistantPerm3: "Assister avec la livraison des cours",
        groupMember: "Membre",
        groupMemberDesc: "Étudiants ou participants du groupe.",
        groupMemberPerm1: "Accéder au contenu du groupe",
        groupMemberPerm2: "Participer aux cours",
        groupMemberPerm3: "Utiliser les ressources assignées",
        platformAdminTitle: "Administrateur plateforme",
        platformAdminNoticeTitle: "Accès système complet",
        platformAdminNoticeDesc: "Les administrateurs plateforme ont un accès illimité à toutes les organisations, groupes et fonctionnalités. Ce rôle est réservé aux opérateurs système et contourne toutes les permissions d'organisation et de groupe.",
        scenariosTitle: "Scénarios courants",
        scenario1Question: "Un gestionnaire peut-il supprimer une organisation ?",
        scenario1Answer: "Non. Seuls les propriétaires d'organisation peuvent supprimer des organisations pour éviter la perte accidentelle de données.",
        scenario2Question: "Un gestionnaire peut-il promouvoir quelqu'un en propriétaire ?",
        scenario2Answer: "Non. Seuls les propriétaires actuels peuvent promouvoir des membres au statut de propriétaire. Les gestionnaires ne peuvent assigner que les rôles de membre ou gestionnaire.",
        scenario3Question: "Que se passe-t-il si le propriétaire d'une organisation part ?",
        scenario3Answer: "Le propriétaire devrait transférer la propriété à un autre membre avant de partir. Sinon, contactez le support pour réassigner la propriété.",
        scenario4Question: "Puis-je avoir plusieurs rôles ?",
        scenario4Answer: "Oui. Vous pouvez être propriétaire d'une organisation, gestionnaire d'une autre, et membre de groupes dans différentes organisations."
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
          admin: {
            title: "Administrateur du Groupe",
            description: "Peut gérer les membres et le contenu mais ne peut pas supprimer le groupe ou modifier les paramètres critiques"
          },
          assistant: {
            title: "Assistant du Groupe",
            description: "Peut aider à gérer le contenu et consulter la progression des membres mais ne peut pas modifier les paramètres du groupe"
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
          example: "email,prenom,nom,role\njean@exemple.com,Jean,Dupont,member\nmarie@exemple.com,Marie,Martin,manager"
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