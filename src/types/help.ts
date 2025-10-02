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

export interface HelpTranslations {
  help: {
    title: string;
    subtitle: string;
    contact: {
      title: string;
      text: string;
    };
    sections: {
      terminals: {
        title: string;
        description: string;
        gettingStarted: string;
        managingSessions: string;
        sharing: string;
        troubleshooting: string;
      };
      courses: {
        title: string;
        description: string;
        structure: string;
        content: string;
      };
      account: {
        title: string;
        description: string;
        subscription: string;
        billing: string;
      };
    };
    navigation: {
      backToHelp: string;
      nextSteps: string;
    };
    terminals: {
      gettingStarted: {
        title: string;
        intro: string;
        overview: {
          title: string;
          description: string;
        };
        firstSteps: {
          title: string;
          step1: {
            title: string;
            description: string;
          };
          step2: {
            title: string;
            description: string;
          };
          step3: {
            title: string;
            description: string;
          };
          step4: {
            title: string;
            description: string;
          };
        };
        quickAccess: {
          title: string;
          mySessions: string;
          sharedSessions: string;
          keys: string;
        };
      };
      managingSessions: {
        title: string;
        intro: string;
        sessionTypes: {
          title: string;
          personal: {
            title: string;
            description: string;
          };
          shared: {
            title: string;
            description: string;
          };
          temporary: {
            title: string;
            description: string;
          };
        };
        synchronization: {
          title: string;
          description: string;
          tips: {
            title: string;
            tip1: string;
            tip2: string;
            tip3: string;
          };
        };
        access: {
          title: string;
          browser: {
            title: string;
            description: string;
          };
          ssh: {
            title: string;
            description: string;
          };
          iframe: {
            title: string;
            description: string;
          };
        };
      };
      sharing: {
        title: string;
        intro: string;
        howToShare: {
          title: string;
          step1: string;
          step2: string;
          step3: string;
          step4: string;
          step5: string;
        };
        permissions: {
          title: string;
          readOnly: {
            title: string;
            description: string;
          };
          readWrite: {
            title: string;
            description: string;
          };
          admin: {
            title: string;
            description: string;
          };
        };
        useCases: {
          title: string;
          teaching: {
            title: string;
            description: string;
          };
          collaboration: {
            title: string;
            description: string;
          };
          support: {
            title: string;
            description: string;
          };
          presentation: {
            title: string;
            description: string;
          };
        };
        security: {
          title: string;
          practices: {
            practice1: string;
            practice2: string;
            practice3: string;
            practice4: string;
            practice5: string;
          };
        };
      };
      troubleshooting: {
        title: string;
        intro: string;
        commonProblems: {
          title: string;
          connectionLost: {
            title: string;
            problem: string;
            solutions: {
              solution1: string;
              solution2: string;
              solution3: string;
              solution4: string;
              solution5: string;
            };
          };
          slowPerformance: {
            title: string;
            problem: string;
            solutions: {
              solution1: string;
              solution2: string;
              solution3: string;
              solution4: string;
              solution5: string;
            };
          };
          accessDenied: {
            title: string;
            problem: string;
            solutions: {
              solution1: string;
              solution2: string;
              solution3: string;
              solution4: string;
              solution5: string;
            };
          };
          filesSyncing: {
            title: string;
            problem: string;
            solutions: {
              solution1: string;
              solution2: string;
              solution3: string;
              solution4: string;
              solution5: string;
            };
          };
        };
        prevention: {
          title: string;
          tips: {
            tip1: string;
            tip2: string;
            tip3: string;
            tip4: string;
            tip5: string;
          };
        };
        support: {
          title: string;
          description: string;
          steps: {
            step1: string;
            step2: string;
            step3: string;
            step4: string;
          };
        };
      };
    };
    courses: {
      structure: {
        title: string;
        intro: string;
        hierarchy: {
          title: string;
          description: string;
          levels: {
            course: {
              title: string;
              description: string;
            };
            chapter: {
              title: string;
              description: string;
            };
            section: {
              title: string;
              description: string;
            };
            page: {
              title: string;
              description: string;
            };
          };
        };
        organization: {
          title: string;
          tips: {
            tip1: string;
            tip2: string;
            tip3: string;
            tip4: string;
          };
        };
        evolution: {
          title: string;
          notice: string;
        };
      };
      content: {
        title: string;
        intro: string;
        principles: {
          title: string;
          principle1: {
            title: string;
            description: string;
          };
          principle2: {
            title: string;
            description: string;
          };
          principle3: {
            title: string;
            description: string;
          };
          principle4: {
            title: string;
            description: string;
          };
        };
        writingTips: {
          title: string;
          tips: {
            tip1: string;
            tip2: string;
            tip3: string;
            tip4: string;
            tip5: string;
          };
        };
        futureFeatures: {
          title: string;
          description: string;
          features: {
            feature1: string;
            feature2: string;
            feature3: string;
            feature4: string;
            feature5: string;
          };
        };
      };
    };
    account: {
      subscription: {
        title: string;
        intro: string;
        dashboard: {
          title: string;
          description: string;
          features: {
            currentPlan: string;
            usage: string;
            renewalDate: string;
            invoiceHistory: string;
            planComparison: string;
          };
        };
        planChanges: {
          title: string;
          upgrade: {
            title: string;
            description: string;
          };
          downgrade: {
            title: string;
            description: string;
          };
          cancellation: {
            title: string;
            description: string;
          };
        };
        billingPortal: {
          title: string;
          description: string;
          actions: {
            action1: string;
            action2: string;
            action3: string;
            action4: string;
            action5: string;
          };
        };
        optimization: {
          title: string;
          tips: {
            tip1: string;
            tip2: string;
            tip3: string;
            tip4: string;
            tip5: string;
          };
        };
      };
      billing: {
        title: string;
        intro: string;
        paymentMethods: {
          title: string;
          description: string;
          actions: {
            add: string;
            update: string;
            default: string;
            remove: string;
            security: string;
          };
        };
        billingAddress: {
          title: string;
          description: string;
          importance: {
            importance1: string;
            importance2: string;
            importance3: string;
            importance4: string;
          };
        };
        invoices: {
          title: string;
          description: string;
          features: {
            view: string;
            download: string;
            details: string;
            history: string;
            support: string;
          };
        };
        billing: {
          title: string;
          monthly: {
            title: string;
            description: string;
          };
          annual: {
            title: string;
            description: string;
          };
          proration: {
            title: string;
            description: string;
          };
        };
        support: {
          title: string;
          description: string;
          contact: {
            email: string;
            portal: string;
            documentation: string;
            response: string;
          };
        };
      };
    };
  };
}