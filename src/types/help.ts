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
      troubleshooting: {
        title: string;
        intro: string;
        commonProblems: {
          connectionIssues: {
            title: string;
          };
          cannotCreateSession: {
            title: string;
            causesTitle: string;
            causes: {
              cause1: string;
              cause2: string;
              cause3: string;
              cause4: string;
            };
            solutionsTitle: string;
            solutions: {
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
            };
          };
          blackScreen: {
            title: string;
            causesTitle: string;
            causes: {
              cause1: string;
              cause2: string;
              cause3: string;
              cause4: string;
            };
            solutionsTitle: string;
            solutions: {
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
            };
          };
          keyboard: {
            title: string;
            causesTitle: string;
            causes: {
              cause1: string;
              cause2: string;
              cause3: string;
              cause4: string;
            };
            solutionsTitle: string;
            solutions: {
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
            };
          };
        };
        prevention: {
          title: string;
          description: string;
          backup: {
            title: string;
            tip1: string;
            tip2: string;
            tip3: string;
            tip4: string;
          };
          timeManagement: {
            title: string;
            tip1: string;
            tip2: string;
            tip3: string;
            tip4: string;
          };
          security: {
            title: string;
            tip1: string;
            tip2: string;
            tip3: string;
            tip4: string;
          };
          maintenance: {
            title: string;
            tip1: string;
            tip2: string;
            tip3: string;
            tip4: string;
          };
        };
        resources: {
          title: string;
          gettingStarted: {
            title: string;
            description: string;
          };
          managingSessions: {
            title: string;
            description: string;
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
          description: string;
          tips: {
            tip1: {
              title: string;
              description: string;
            };
            tip2: {
              title: string;
              description: string;
            };
            tip3: {
              title: string;
              description: string;
            };
            tip4: {
              title: string;
              description: string;
            };
          };
          structuring: {
            title: string;
            tip1: {
              title: string;
              description: string;
            };
            tip2: {
              title: string;
              description: string;
            };
            tip3: {
              title: string;
              description: string;
            };
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
        types: {
          title: string;
          description: string;
          theoretical: {
            title: string;
            description: string;
            tag1: string;
            tag2: string;
            tag3: string;
          };
          practical: {
            title: string;
            description: string;
            tag1: string;
            tag2: string;
            tag3: string;
          };
          assessments: {
            title: string;
            description: string;
            tag1: string;
            tag2: string;
            tag3: string;
          };
          resources: {
            title: string;
            description: string;
            tag1: string;
            tag2: string;
            tag3: string;
          };
        };
        tools: {
          title: string;
          description: string;
          richEditor: {
            title: string;
            description: string;
            feature1: string;
            feature2: string;
            feature3: string;
            feature4: string;
          };
          terminalIntegration: {
            title: string;
            description: string;
            feature1: string;
            feature2: string;
            feature3: string;
            feature4: string;
          };
          interactiveModules: {
            title: string;
            description: string;
            badge: string;
          };
        };
        principles: {
          title: string;
          description: string;
          clearObjectives: {
            title: string;
            description: string;
            exampleLabel: string;
            exampleText: string;
          };
          gradualProgression: {
            title: string;
            description: string;
            exampleLabel: string;
            exampleText: string;
          };
          activeLearning: {
            title: string;
            description: string;
            exampleLabel: string;
            exampleText: string;
          };
          immediateFeedback: {
            title: string;
            description: string;
            exampleLabel: string;
            exampleText: string;
          };
        };
        writingTips: {
          title: string;
          description: string;
          languageStyle: {
            title: string;
            tip1: string;
            tip2: string;
            tip3: string;
            tip4: string;
          };
          visualStructure: {
            title: string;
            tip1: string;
            tip2: string;
            tip3: string;
            tip4: string;
          };
          validationExamples: {
            title: string;
            tip1: string;
            tip2: string;
            tip3: string;
            tip4: string;
          };
        };
        futureFeatures: {
          title: string;
          description: string;
          soon: {
            title: string;
            feature1: string;
            feature2: string;
            feature3: string;
          };
          future: {
            title: string;
            feature1: string;
            feature2: string;
            feature3: string;
          };
        };
      };
    };
    account: {
      subscription: {
        title: string;
        intro: string;
        catalogue: {
          title: string;
          description: string;
          ttc: string;
          discovery: TitlePriceDescription;
          solo: TitlePriceDescription;
          trainer: TitlePriceDescription;
          school: TitlePriceDescription;
          screenshot: string;
        };
        whereToFind: {
          title: string;
          description: string;
          dashboard: string;
          plans: string;
          pricing: string;
          licenses: string;
        };
        subscribe: {
          title: string;
          description: string;
          free: TitleDescription;
          paid: TitleDescription;
          emailVerified: string;
          screenshot: string;
        };
        changePlan: {
          title: string;
          description: string;
          upgrade: TitleDescription;
          fromFree: TitleDescription;
          toFree: TitleDescription;
        };
        dashboard: {
          title: string;
          description: string;
          plan: string;
          source: string;
          priority: string;
          features: string;
          billing: string;
          actions: string;
          screenshot: string;
        };
        usage: {
          title: string;
          description: string;
          plan: string;
          capacity: string;
          bars: string;
          sessions: string;
          refresh: string;
          orgPanel: string;
        };
        sources: {
          title: string;
          description: string;
          personal: TitleDescription;
          organization: TitleDescription;
          assigned: TitleDescription;
          assignedNote: string;
        };
        cancel: {
          title: string;
          description: string;
          atPeriodEnd: string;
          immediately: string;
          reactivate: string;
          portal: string;
        };
        nextSteps: {
          billing: TitleDescription;
          organizations: TitleDescription;
          terminals: TitleDescription;
        };
      };
      billing: {
        title: string;
        intro: string;
        whereToFind: {
          title: string;
          description: string;
          verified: string;
          assigned: string;
        };
        invoices: {
          title: string;
          description: string;
          filter: string;
          refresh: string;
          details: string;
          download: string;
          screenshot: string;
        };
        addresses: {
          title: string;
          description: string;
          fields: string;
          default: string;
          edit: string;
        };
        paymentMethods: {
          title: string;
          description: string;
          add: string;
          default: string;
        };
        portal: {
          title: string;
          description: string;
          card: string;
          history: string;
          invoices: string;
        };
        nextSteps: {
          subscription: TitleDescription;
          licenses: TitleDescription;
          settings: TitleDescription;
        };
      };
      rolesAndPermissions: {
        title: string;
        intro: string;
        overviewTitle: string;
        overviewDescription: string;
        platformLevel: string;
        platformLevelDesc: string;
        organizationLevel: string;
        organizationLevelDesc: string;
        groupLevel: string;
        groupLevelDesc: string;
        orgRolesTitle: string;
        orgRolesDescription: string;
        permission: string;
        owner: string;
        manager: string;
        teacher: string;
        member: string;
        viewOrganization: string;
        useOrgPlan: string;
        createClasses: string;
        inviteMembers: string;
        removeMembers: string;
        changeRoles: string;
        promoteToOwner: string;
        manageBilling: string;
        editOrgSettings: string;
        deleteOrganization: string;
        transferOwnership: string;
        allowed: string;
        partial: string;
        denied: string;
        cannotPromoteToOwner: string;
        groupRolesTitle: string;
        groupRolesDescription: string;
        groupOwner: string;
        groupOwnerDesc: string;
        groupOwnerPerm1: string;
        groupOwnerPerm2: string;
        groupOwnerPerm3: string;
        groupManager: string;
        groupManagerDesc: string;
        groupManagerPerm1: string;
        groupManagerPerm2: string;
        groupManagerPerm3: string;
        groupMember: string;
        groupMemberDesc: string;
        groupMemberPerm1: string;
        groupMemberPerm2: string;
        groupMemberPerm3: string;
        platformAdminTitle: string;
        platformAdminNoticeTitle: string;
        platformAdminNoticeDesc: string;
        scenariosTitle: string;
        scenario1Question: string;
        scenario1Answer: string;
        scenario2Question: string;
        scenario2Answer: string;
        scenario3Question: string;
        scenario3Answer: string;
        scenario4Question: string;
        scenario4Answer: string;
        reference: {
          title: string;
          description: string;
          button: string;
        };
      };
      settings: {
        title: string;
        intro: string;
        overview: {
          title: string;
          description: string;
          autosave: string;
        };
        navigation: {
          title: string;
          description: string;
          defaultPage: TitleDescription;
        };
        localization: {
          title: string;
          description: string;
          language: TitleDescription;
          timezone: TitleDescription;
          screenshot: string;
        };
        ui: {
          title: string;
          description: string;
          theme: TitleDescription;
          compact: TitleDescription;
          screenshot: string;
        };
        notifications: TitleDescription;
        security: {
          title: string;
          description: string;
          password: TitleDescription;
          deleteAccount: TitleDescription;
        };
        sshKeys: {
          title: string;
          description: string;
          linkText: string;
          button: string;
        };
        version: TitleDescription;
        nextSteps: {
          themes: TitleDescription;
          sshKeys: TitleDescription;
          roles: TitleDescription;
        };
      };
      themes: {
        title: string;
        intro: string;
        selection: {
          title: string;
          light: TitleDescription;
          dark: TitleDescription;
          auto: TitleDescription;
        };
        whereToChange: {
          title: string;
          description: string;
          compact: string;
          button: string;
          screenshot: string;
        };
        nextSteps: {
          settings: TitleDescription;
          gettingStarted: TitleDescription;
          subscription: TitleDescription;
        };
      };
    };
  };
}

interface TitleDescription {
  title: string;
  description: string;
}

interface TitlePriceDescription extends TitleDescription {
  price: string;
}