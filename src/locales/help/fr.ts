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

    contact: {
      title: "Besoin d'aide ?",
      text: "Si vous ne trouvez pas ce que vous cherchez, n'hésitez pas à nous contacter à",
      email: "contact@labinux.com"
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
        }
      },

      managingSessions: {
        title: "Gestion de Vos Sessions Terminal",
        intro: "Apprenez à gérer efficacement vos sessions terminal, synchroniser votre travail et accéder à vos environnements depuis n'importe où.",

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
        title: "Dépannage",
        intro: "Solutions aux problèmes courants que vous pourriez rencontrer avec les terminaux.",

        commonProblems: {
          title: "Problèmes Courants",

          connectionLost: {
            title: "Connexion Perdue",
            problem: "Le terminal se déconnecte de façon inattendue ou ne veut pas se connecter",
            solutions: {
              solution1: "Vérifiez votre connexion internet",
              solution2: "Rafraîchissez la page et essayez de vous reconnecter",
              solution3: "Videz le cache et les cookies de votre navigateur",
              solution4: "Essayez un navigateur différent ou le mode incognito",
              solution5: "Contactez le support si le problème persiste"
            }
          },

          slowPerformance: {
            title: "Performance Lente",
            problem: "Le terminal répond lentement ou les commandes prennent du temps à s'exécuter",
            solutions: {
              solution1: "Vérifiez les ressources disponibles dans votre abonnement",
              solution2: "Fermez les programmes inutiles dans le terminal",
              solution3: "Redémarrez la session terminal",
              solution4: "Vérifiez si la latence réseau cause des retards",
              solution5: "Considérez mettre à niveau votre abonnement pour plus de ressources"
            }
          },

          accessDenied: {
            title: "Accès Refusé",
            problem: "Impossible d'accéder à un terminal partagé ou certaines commandes échouent",
            solutions: {
              solution1: "Vérifiez que vous avez les permissions nécessaires",
              solution2: "Vérifiez que votre accès n'a pas expiré",
              solution3: "Contactez le propriétaire du terminal pour vérifier les paramètres de partage",
              solution4: "Assurez-vous d'utiliser la bonne clé SSH si vous vous connectez via SSH",
              solution5: "Vérifiez que votre compte a le niveau d'abonnement requis"
            }
          },

          filesSyncing: {
            title: "Problèmes de Synchronisation des Fichiers",
            problem: "Les fichiers ne se sauvegardent pas ou ne se synchronisent pas correctement",
            solutions: {
              solution1: "Vérifiez l'espace de stockage disponible",
              solution2: "Vérifiez les permissions d'écriture sur les fichiers concernés",
              solution3: "Forcez la sauvegarde avec Ctrl+S ou :w dans les éditeurs",
              solution4: "Vérifiez la connectivité réseau",
              solution5: "Utilisez git ou une sauvegarde externe pour les fichiers importants"
            }
          }
        },

        prevention: {
          title: "Conseils de Prévention",
          tips: {
            tip1: "Sauvegardez régulièrement votre travail avec un contrôle de version",
            tip2: "Sauvegardez les configurations et fichiers importants",
            tip3: "Surveillez votre utilisation des ressources",
            tip4: "Gardez vos sessions organisées et supprimez celles non utilisées",
            tip5: "Utilisez des connexions internet stables pour un travail important"
          }
        },

        support: {
          title: "Obtenir du Support",
          description: "Si vous ne pouvez pas résoudre votre problème avec ces solutions :",
          steps: {
            step1: "Documentez le message d'erreur exact ou le comportement",
            step2: "Notez ce que vous faisiez quand le problème est survenu",
            step3: "Vérifiez la console de votre navigateur pour des messages d'erreur",
            step4: "Contactez notre équipe de support avec ces détails"
          }
        }
      }
    },

    courses: {
      structure: {
        title: "Structure des Cours",
        intro: "Comprendre comment les cours sont organisés et structurés dans la plateforme.",

        hierarchy: {
          title: "Hiérarchie des Cours",
          description: "Les cours suivent une structure à 4 niveaux pour une organisation optimale :",
          levels: {
            course: {
              title: "1. Cours",
              description: "Le conteneur principal qui regroupe tout le contenu d'apprentissage autour d'un sujet spécifique"
            },
            chapter: {
              title: "2. Chapitre",
              description: "Sections principales qui divisent le cours en blocs d'apprentissage logiques"
            },
            section: {
              title: "3. Section",
              description: "Subdivisions détaillées qui se concentrent sur des concepts ou compétences spécifiques"
            },
            page: {
              title: "4. Page",
              description: "Unités de contenu individuelles contenant du texte, des exercices ou des éléments multimédias"
            }
          }
        },

        organization: {
          title: "Conseils d'Organisation",
          tips: {
            tip1: "Planifiez la structure de votre cours avant de créer du contenu",
            tip2: "Utilisez des noms clairs et descriptifs pour chaque niveau",
            tip3: "Maintenez une organisation cohérente dans tous les cours",
            tip4: "Regroupez les concepts liés dans le même chapitre ou section"
          }
        },

        evolution: {
          title: "Évolution du Système",
          notice: "Le système de structure des cours est activement développé. De nouvelles fonctionnalités et outils d'organisation seront ajoutés basés sur les retours utilisateurs et les meilleures pratiques éducatives."
        }
      },

      content: {
        title: "Création de Contenu",
        intro: "Meilleures pratiques pour créer du contenu éducatif engageant et efficace.",

        principles: {
          title: "Principes de Création de Contenu",
          principle1: {
            title: "Clarté",
            description: "Utilisez un langage clair et simple adapté au niveau de votre audience"
          },
          principle2: {
            title: "Progression",
            description: "Structurez le contenu logiquement des concepts simples aux complexes"
          },
          principle3: {
            title: "Interactivité",
            description: "Incluez des exercices pratiques et des activités hands-on"
          },
          principle4: {
            title: "Variété",
            description: "Mélangez différents types de contenu pour maintenir l'engagement"
          }
        },

        writingTips: {
          title: "Conseils de Rédaction",
          tips: {
            tip1: "Commencez chaque section avec des objectifs d'apprentissage clairs",
            tip2: "Utilisez des exemples concrets pour illustrer les concepts abstraits",
            tip3: "Incluez des points de contrôle et des résumés réguliers",
            tip4: "Encouragez la participation active par des questions et exercices",
            tip5: "Fournissez des ressources supplémentaires pour un apprentissage plus approfondi"
          }
        },

        futureFeatures: {
          title: "Bientôt Disponible",
          description: "Le système de création de contenu sera amélioré avec :",
          features: {
            feature1: "Éditeur de texte riche avec support multimédia",
            feature2: "Modèles d'exercices interactifs",
            feature3: "Suivi de progression et analyses",
            feature4: "Outils de création de contenu collaboratifs",
            feature5: "Capacités d'import/export de contenu"
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