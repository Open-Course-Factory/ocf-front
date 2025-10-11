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
        billing: "Facturation et Paiements"
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
          title: "Comment Partager un Terminal",
          step1: "Créez un nouveau terminal ou sélectionnez un terminal existant",
          step2: "Dans les paramètres du terminal, activez l'option de partage",
          step3: "Ajoutez des utilisateurs par email ou nom d'utilisateur",
          step4: "Configurez les permissions d'accès (lecture seule, lecture-écriture, admin)",
          step5: "Partagez le lien d'accès avec vos collaborateurs"
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

        security: {
          title: "Sécurité et Bonnes Pratiques",
          practices: {
            practice1: "Ne partagez jamais de terminaux contenant des informations sensibles",
            practice2: "Révisez et révoquez régulièrement les accès non nécessaires",
            practice3: "Utilisez l'accès en lecture seule quand c'est possible",
            practice4: "Surveillez l'activité dans les sessions partagées",
            practice5: "Configurez l'expiration automatique des sessions pour les accès temporaires"
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

        dashboard: {
          title: "Tableau de Bord Abonnement",
          description: "Votre tableau de bord d'abonnement fournit une vue d'ensemble complète de :",
          features: {
            currentPlan: "Votre plan actuel et ses avantages",
            usage: "Utilisation des ressources et limites",
            renewalDate: "Date et montant du prochain renouvellement",
            invoiceHistory: "Historique des factures et paiements",
            planComparison: "Plans disponibles et options de mise à niveau"
          }
        },

        planChanges: {
          title: "Changement de Plans",
          upgrade: {
            title: "Mise à Niveau",
            description: "Passez à un plan supérieur à tout moment. Les changements prennent effet immédiatement et vous serez facturé au prorata de la différence."
          },
          downgrade: {
            title: "Rétrogradation",
            description: "Les rétrogradations prennent effet à la prochaine date de renouvellement pour éviter la perte de fonctionnalités payées."
          },
          cancellation: {
            title: "Annulation",
            description: "Annulez à tout moment via le portail de facturation. L'accès continue jusqu'à la fin de votre période de facturation."
          }
        },

        billingPortal: {
          title: "Portail de Facturation",
          description: "Accédez au portail de facturation sécurisé de Stripe pour :",
          actions: {
            action1: "Mettre à jour les méthodes de paiement",
            action2: "Télécharger les factures",
            action3: "Changer l'adresse de facturation",
            action4: "Gérer les paramètres d'abonnement",
            action5: "Voir l'historique des paiements"
          }
        },

        optimization: {
          title: "Optimisation de l'Utilisation",
          tips: {
            tip1: "Surveillez régulièrement votre utilisation des ressources",
            tip2: "Fermez les sessions terminal inutilisées pour économiser les ressources",
            tip3: "Choisissez le plan qui correspond le mieux à votre utilisation réelle",
            tip4: "Profitez des remises éducatives si vous êtes éligible",
            tip5: "Contactez le support pour des solutions d'entreprise personnalisées"
          }
        }
      },

      billing: {
        title: "Facturation et Paiements",
        intro: "Tout ce que vous devez savoir sur la facturation, les paiements et la gestion financière de votre compte.",

        paymentMethods: {
          title: "Méthodes de Paiement",
          description: "Gérez vos méthodes de paiement en toute sécurité :",
          actions: {
            add: "Ajouter de nouvelles cartes de crédit/débit",
            update: "Mettre à jour les dates d'expiration et informations de facturation",
            default: "Définir la méthode de paiement par défaut",
            remove: "Supprimer les méthodes de paiement non utilisées",
            security: "Toutes les données de paiement sont stockées en toute sécurité par Stripe"
          }
        },

        billingAddress: {
          title: "Adresses de Facturation",
          description: "Maintenez des informations de facturation précises :",
          importance: {
            importance1: "Requises pour la génération de factures",
            importance2: "Nécessaires pour les calculs de taxes",
            importance3: "Utilisées pour la vérification des paiements",
            importance4: "Importantes pour la conformité aux réglementations locales"
          }
        },

        invoices: {
          title: "Gestion des Factures",
          description: "Accédez et gérez vos factures :",
          features: {
            view: "Voir toutes les factures passées et actuelles",
            download: "Télécharger les factures au format PDF",
            details: "Voir les détails des frais",
            history: "Historique complet des paiements",
            support: "Support et questions liées aux factures"
          }
        },

        billing: {
          title: "Cycle de Facturation",
          monthly: {
            title: "Facturation Mensuelle",
            description: "Facturé à la même date chaque mois"
          },
          annual: {
            title: "Facturation Annuelle",
            description: "Facturé annuellement avec des économies potentielles"
          },
          proration: {
            title: "Frais au Prorata",
            description: "Les changements de plan sont calculés au prorata basé sur le temps restant dans le cycle de facturation"
          }
        },

        support: {
          title: "Support Facturation",
          description: "Pour les questions ou problèmes de facturation :",
          contact: {
            email: "Contactez notre support facturation",
            portal: "Utilisez le portail de facturation pour le libre-service",
            documentation: "Consultez cette documentation pour les questions courantes",
            response: "Nous répondons aux demandes de facturation sous 24 heures"
          }
        }
      }
    }
  }
};