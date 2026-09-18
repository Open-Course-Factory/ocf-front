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

export const helpEn = {
  help: {
    title: "Help & Documentation",
    subtitle: "Everything you need to get started and make the most of the platform",
    backToHome: "Back to home",
    backToApp: "Back to application",

    contact: {
      title: "Need help?",
      text: "If you can't find what you're looking for, don't hesitate to contact us at"
    },

    sections: {
      terminals: {
        title: "🖥️ Terminals",
        description: "Learn how to create and manage your terminal sessions",
        gettingStarted: "Getting Started",
        managingSessions: "Managing Sessions",
        troubleshooting: "Troubleshooting",
        sshKeys: "SSH Key Management"
      },
      courses: {
        title: "📚 Courses",
        description: "Master the course creation and management system",
        structure: "Course Structure",
        content: "Content Creation"
      },
      account: {
        title: "👤 Account Management",
        description: "Manage your subscription, billing and account settings",
        subscription: "Subscription & Plans",
        billing: "Billing & Payments",
        rolesAndPermissions: "Roles & Permissions",
        permissionsReference: "API Permissions Reference",
        settings: "Settings & Preferences",
        themes: "Dark Mode & Themes"
      },
      scenarios: {
        title: "🎯 Interactive Scenarios",
        description: "Learn how to use and create step-by-step interactive lab exercises",
        gettingStarted: "Getting Started with Scenarios",
        creation: "Creating Scenarios"
      },
      organizations: {
        title: "🏢 Organizations & Groups",
        description: "Manage organizations, groups, bulk imports and licenses",
        overview: "Organizations Overview",
        groups: "Group Management",
        bulkImport: "Bulk Import",
        bulkLicenses: "Bulk Licenses"
      }
    },

    navigation: {
      backToHelp: "← Back to Help Center",
      nextSteps: "Next Steps"
    },

    terminals: {
      gettingStarted: {
        title: "Getting Started with Terminals",
        intro: "Terminals are virtual development environments that allow you to work on your projects directly from your browser. This guide will help you create your first terminal session.",

        overview: {
          title: "What are Terminals?",
          description: "Terminals provide you with secure and isolated Linux environments accessible via your browser. Each terminal is a complete development environment with pre-installed tools and the ability to install additional software as needed."
        },

        firstSteps: {
          title: "Creating Your First Terminal",
          step1: {
            title: "Access Terminal Creation",
            description: "Go to the \"Terminal Creation\" page from the main menu. This page allows you to configure your new terminal session."
          },
          step2: {
            title: "Compose Your Environment",
            description: "Use the session composer to select your environment in three steps: choose a <strong>distribution</strong> (e.g. Ubuntu, Debian), pick a <strong>size</strong> (S / M / L / XL), and enable optional <strong>features</strong> such as Docker or Kubernetes. A recommended size and the available features are pre-selected for you."
          },
          step3: {
            title: "Set Access Parameters",
            description: "Configure your session: name, duration, and other settings."
          },
          step4: {
            title: "Launch Your Terminal",
            description: "Once configured, launch your terminal. Initial startup may take a few moments to prepare your environment."
          }
        },

        quickAccess: {
          title: "Quick Access",
          mySessions: "View your active sessions on the \"My Sessions\" page",
          keys: "Manage your SSH keys in \"Terminal Keys\""
        },

        steps: {
          accessKeys: {
            title: "Access your keys",
            description: "Navigate to <strong>Practical Work > Terminal Access Keys</strong> in the main menu.",
            button: "View my access keys"
          },
          checkStatus: {
            title: "Check status",
            description: "If you see \"No terminal key found\" or your key is inactive, use the <strong>\"Regenerate key\"</strong> button to create a new one."
          },
          accessCreation: {
            title: "Access session creation",
            description: "Click on <strong>Practical Work > Create a Session</strong> in the menu.",
            button: "Create a session now"
          },
          configure: {
            title: "Compose your environment",
            item1: "<strong>Distribution:</strong> Choose the Linux distribution shown as cards with brand icons (e.g. Ubuntu, Debian). The system recommends the most common one by default.",
            item2: "<strong>Size:</strong> Pick S, M, L, or XL using the size pills. Sizes locked by your plan appear greyed out with a lock icon — upgrade your plan to unlock them.",
            item3: "<strong>Features:</strong> Toggle optional add-ons such as Docker or Kubernetes. Unavailable features are shown as disabled.",
            item4: "<strong>Terms of use:</strong> Accept the terms (required)",
            item5: "<strong>Expiration time:</strong> Choose how long your session will remain active (optional)"
          },
          launch: {
            title: "Launch the session",
            description: "Click on <strong>\"Start a session\"</strong>. Creation may take a few moments while the system prepares your environment."
          },
          locate: {
            title: "Locate your session",
            description: "In <strong>Practical Work > My Sessions</strong>, you will see your new session with \"active\" status.",
            button: "View my sessions"
          },
          connect: {
            title: "Connect to the terminal",
            description: "Click the <strong>\"Open\"</strong> button to access your terminal in a new tab, or use <strong>\"Preview\"</strong> to see it directly in the page."
          }
        },

        multiBackend: {
          title: "Multi-Server Support",
          description: "When multiple terminal servers are available, you can choose which server to use for your session. This allows you to select the infrastructure closest to your location or the one best suited to your workload.",
          selectBackend: {
            title: "Select a server",
            description: "On the session creation page, a <strong>server selector</strong> appears when multiple servers are available. Choose the server that best fits your needs."
          },
          tip: {
            title: "Tip",
            description: "If only one server is configured, the selector is hidden and the default server is used automatically."
          }
        },

        machineSizes: {
          title: "Environment Sizes & Capacity",
          description: "Your plan includes a capacity for running learning environments. You can split that capacity across any combination of machine sizes, as long as you do not exceed your overall plan limit. The session composer always shows how many sessions of each size you can still launch.",
          small: {
            title: "S - Small",
            description: "Lightweight environment for simple tasks, scripting, and basic development."
          },
          medium: {
            title: "M - Medium",
            description: "Balanced environment for standard development work and moderate workloads."
          },
          large: {
            title: "L - Large",
            description: "Powerful environment for resource-intensive tasks, compilation, and multi-service setups."
          },
          xlarge: {
            title: "XL - Extra Large",
            description: "Maximum resources for heavy workloads, large-scale builds, and production-like environments."
          },
          budgetExplain: {
            title: "How capacity is consumed",
            description: "When you start a session, the size you pick is reserved from your capacity. Stopping a non-persistent session releases its capacity immediately. Persistent sessions reserve capacity until you delete them. The composer shows the size-count summary (\"3 L OR 6 M OR 12 S\") so you always know what is still launchable."
          },
          combinationExample: {
            title: "Mix and match",
            description: "Example: a plan with capacity for 2 L sessions can also support 4 M sessions, 8 S sessions, or any mix that fits — like 1 L + 2 M. You decide how to split the capacity between learners or environments."
          },
          planTip: {
            title: "Plan-based availability",
            description: "Your subscription plan determines the overall capacity and which sizes are unlocked. Sizes that are too large for your plan appear greyed out with a lock icon in the session composer. On an org-managed subscription, unavailable sizes are hidden entirely. To increase your capacity, upgrade your plan."
          }
        },

        usageQuota: {
          title: "Usage & Quota Panel",
          description: "Before creating a session, the usage panel displays your current resource consumption at a glance.",
          concurrentSessions: {
            title: "Plan Capacity",
            description: "Your plan includes a CPU + memory budget; spawn any combination of sizes that fits within it. The panel shows how many additional sessions of each size you can still launch."
          },
          maxDuration: {
            title: "Maximum Session Duration",
            description: "Displays the longest duration allowed for a single session under your current subscription plan."
          }
        },

        advancedOptions: {
          title: "Advanced Options",
          description: "When creating a session, you can optionally configure additional parameters for better organization.",
          terminalName: {
            title: "Terminal name",
            description: "Give your session a <strong>custom name</strong> to easily identify it among your active sessions (e.g., \"Lab 3 - Networking\")."
          },
          exerciseRef: {
            title: "Exercise reference",
            description: "Link your session to a specific <strong>exercise or practical work</strong> for tracking and organizational purposes."
          }
        },

        bulkGroupCreation: {
          title: "Bulk Group Creation",
          description: "When the groups feature is enabled, trainers can create terminal sessions for all members of a group in a single operation. This is ideal for classroom setups and training sessions.",
          selectGroup: {
            title: "Select a group",
            description: "Choose a <strong>group</strong> from the dropdown list. All members of that group will receive their own terminal session."
          },
          confirm: {
            title: "Confirm bulk creation",
            description: "Review the number of sessions to be created and click <strong>\"Create sessions\"</strong>. Each group member will receive a dedicated terminal session with the same configuration."
          },
          tip: {
            title: "Availability",
            description: "This feature requires the groups feature flag to be enabled. Contact your administrator if you do not see this option."
          }
        },

        recordingConsent: {
          title: "Recording Consent",
          description: "When session recording is enabled by your organization, a consent modal appears after your terminal session starts.",
          modal: {
            title: "Consent modal",
            description: "After the session is created, a <strong>recording consent dialog</strong> appears asking whether you agree to have your session recorded."
          },
          choices: {
            title: "Your choices",
            description: "You can <strong>accept</strong> recording to allow session capture, or <strong>decline</strong> if you prefer not to be recorded. Your choice is saved for the current session."
          }
        },

        expiryWarnings: {
          title: "Expiry Countdown Warnings",
          description: "As your session approaches its expiration time, the platform displays notification banners to remind you to save your work.",
          tenMin: {
            title: "10 minutes remaining",
            description: "An informational notification appears, gently reminding you that your session will expire soon."
          },
          fiveMin: {
            title: "5 minutes remaining",
            description: "A warning notification urges you to save your work and prepare to end your session."
          },
          oneMin: {
            title: "1 minute remaining",
            description: "A critical alert indicates imminent session termination. Save all work immediately."
          }
        }
      },

      managingSessions: {
        title: "Managing Your Terminal Sessions",
        intro: "Learn how to effectively manage your terminal sessions, synchronize your work, and access your environments from anywhere.",

        quickAccessCard: {
          title: "Quick access",
          description: "Navigate to <strong>Practical Work > My Sessions</strong> to see all your sessions.",
          button: "View my sessions"
        },

        sessionTypes: {
          title: "Types of Sessions",
          personal: {
            title: "Personal Sessions",
            description: "Private sessions that only you can access. Perfect for personal development or testing."
          },
          shared: {
            title: "Shared Sessions",
            description: "Sessions you can share with colleagues or learners. Useful for collaboration or teaching."
          },
          temporary: {
            title: "Temporary Sessions",
            description: "Sessions with limited duration, automatically deleted after a defined period."
          }
        },

        synchronization: {
          title: "Work Synchronization",
          description: "Your work is automatically saved in each session. You can access your files and configurations even after disconnecting and reconnecting.",
          tips: {
            title: "Synchronization Tips",
            tip1: "Use version control systems (git) to save your work externally",
            tip2: "Regularly backup important files to external storage",
            tip3: "Configure your development environment with dotfiles for easy restoration"
          }
        },

        syncMethods: {
          individual: {
            title: "Individual synchronization",
            description: "Click the \"Sync\" button on a session to update its status specifically."
          },
          global: {
            title: "Global synchronization",
            description: "The \"Sync all\" button updates all your sessions at once."
          },
          automatic: {
            title: "Automatic synchronization",
            description: "Sessions synchronize automatically every 30 seconds."
          }
        },

        syncTip: {
          title: "Tip",
          description: "If a session appears inactive but still shows as \"active\", use synchronization to get the most recent status."
        },

        accessMethods: {
          title: "Terminal access",
          description: "Several options are available to access your terminal sessions:",
          newTab: {
            title: "Open in new tab",
            description: "The <strong>\"Open\"</strong> button launches your terminal in an optimized new window, ideal for extended work."
          },
          preview: {
            title: "Integrated preview",
            description: "The <strong>\"Preview\"</strong> displays the terminal directly in the page, convenient for quick checks."
          },
          copyLink: {
            title: "Copy link",
            description: "Copy the terminal URL to access it later or integrate it into your bookmarks."
          }
        },

        iframeIntegration: {
          title: "Iframe integration",
          description: "You can embed your terminals in other websites or learning platforms:",
          step1: {
            title: "Generate iframe code",
            description: "Click the <strong>\"iframe\"</strong> button next to an active session to automatically copy the integration code."
          },
          step2: {
            title: "Customize display",
            description: "The default iframe code uses a size of 100% x 600px. You can modify these dimensions according to your needs."
          },
          codeExample: {
            title: "Iframe code example:"
          }
        },

        stopAndCleanup: {
          title: "Stop and cleanup",
          description: "Proper management of your sessions allows you to optimize resources:",
          stopSession: {
            title: "Stop a session",
            description: "Use the <strong>\"Stop\"</strong> button to properly terminate an active session when you're done working."
          },
          hideSessions: {
            title: "Hide inactive sessions",
            description: "The <strong>\"Hide\"</strong> button on expired or stopped sessions removes them from your list for a cleaner display."
          },
          warning: {
            title: "Important",
            description: "<strong>Always save your work</strong> before stopping a session. Once stopped, you won't be able to recover unsaved files."
          }
        },

        monitoring: {
          title: "Monitoring and optimization",
          description: "Follow these best practices for optimal use:",
          practices: {
            expiration: {
              title: "Monitor expirations",
              description: "Regularly check expiration dates to avoid work loss."
            },
            backup: {
              title: "Backup frequently",
              description: "Download your important files or use Git repositories."
            },
            resources: {
              title: "Manage resources",
              description: "Only use the number of sessions necessary according to your subscription."
            },
            sync: {
              title: "Synchronize regularly",
              description: "Use synchronization if you suspect status issues."
            }
          }
        },

        nextSteps: {
          troubleshooting: {
            title: "Troubleshooting",
            description: "Solutions to common session management problems"
          }
        },

        access: {
          title: "Access Methods",
          browser: {
            title: "Browser Access",
            description: "Direct access via the web interface. No installation required, works on any device with an internet connection."
          },
          ssh: {
            title: "SSH Access",
            description: "Connect using your favorite SSH client. Configure your SSH keys in the \"Terminal Keys\" section."
          },
          iframe: {
            title: "Iframe Integration",
            description: "Embed terminals in your own applications or educational platforms."
          }
        },

        dashboardLayout: {
          title: "Unified Dashboard Layout",
          description: "The sessions dashboard organizes your terminals into two distinct sections for a clear overview of all your environments.",
          activeSessions: {
            title: "Active Sessions",
            description: "Your running sessions are displayed prominently at the top with a count badge showing the total number of active terminals."
          },
          inactiveSessions: {
            title: "Inactive Sessions",
            description: "Stopped and expired sessions are grouped in a collapsible section that you can expand or collapse to keep your dashboard clean."
          }
        },

        inlineRenaming: {
          title: "Inline Session Renaming",
          description: "You can rename your terminal sessions directly from the dashboard without opening any modal or settings page.",
          howTo: {
            title: "Rename a session",
            description: "Click the <strong>pencil icon</strong> next to the session name, type the new name, and press <strong>Enter</strong> to save or <strong>Escape</strong> to cancel."
          }
        },

        commandHistory: {
          title: "Command History",
          description: "Each terminal session maintains a detailed command history that you can browse, search, and export.",
          search: {
            title: "Search & Filter",
            description: "Use the search bar to filter commands by keyword. Results update in real-time as you type."
          },
          sort: {
            title: "Sort by Time",
            description: "Commands are listed chronologically. Toggle between newest-first and oldest-first ordering."
          },
          export: {
            title: "Export History",
            description: "Download your command history in CSV or JSON format for documentation or auditing purposes."
          },
          clickToPaste: {
            title: "Click to Paste",
            description: "Click any command in the history to instantly paste it into the active terminal, ready for execution."
          },
          deleteAll: {
            title: "Delete All History",
            description: "The <strong>\"Delete all\"</strong> button clears the entire command history. A confirmation dialog prevents accidental deletion."
          }
        },

        moreActions: {
          title: "More Actions Dropdown",
          description: "Each session card includes a \"More actions\" dropdown menu with additional operations.",
          copyUrl: {
            title: "Copy URL",
            description: "Copy the direct terminal access URL to your clipboard for quick sharing or bookmarking."
          },
          copyIframe: {
            title: "Copy Iframe Code",
            description: "Generate and copy the iframe embed code for integrating the terminal into external websites or LMS platforms."
          },
          syncSession: {
            title: "Sync Session",
            description: "Manually synchronize the session status with the server to get the most up-to-date information."
          }
        },

        statusIndicators: {
          title: "Status Indicators",
          description: "Each session displays a colored status dot for quick visual identification of its current state.",
          active: {
            title: "Active (green)",
            description: "The session is running and ready to use. You can connect to the terminal immediately."
          },
          stopped: {
            title: "Stopped (gray)",
            description: "The session has been manually stopped. It can no longer be accessed but may still appear in your list."
          },
          expired: {
            title: "Expired (red)",
            description: "The session has reached its expiration time and was automatically terminated."
          }
        },

        lastSyncTime: {
          title: "Last Sync Time",
          description: "A timestamp at the top of the dashboard shows when sessions were last synchronized with the server, helping you know how current the displayed information is.",
          tip: {
            title: "Tip",
            description: "If the sync time seems outdated, click the global sync button to refresh all sessions at once."
          }
        },

        expiryWarnings: {
          title: "Expiry Countdown Warnings",
          description: "While using the terminal viewer, notification banners appear as your session approaches its expiration time to help you save your work in time.",
          tenMin: {
            title: "10 minutes remaining",
            description: "An informational banner appears at the top of the terminal viewer as a gentle reminder."
          },
          fiveMin: {
            title: "5 minutes remaining",
            description: "A warning banner prompts you to save your work and wrap up your current tasks."
          },
          oneMin: {
            title: "1 minute remaining",
            description: "A critical alert signals imminent session termination. Save all work immediately."
          }
        }
      },

      troubleshooting: {
        title: "Terminal Troubleshooting",
        intro: "Solutions to common problems and incident resolution guide",

        quickDiagnosis: {
          title: "Quick Diagnosis",
          description: "Before looking for a specific solution, perform these basic checks:",
          checks: {
            internet: "Stable Internet connection",
            browser: "Up-to-date browser (Chrome, Firefox, Safari, Edge)",
            key: "Active terminal access key",
            session: "Non-expired session",
            blocker: "No ad/script blockers on the domain"
          },
          actionsTitle: "Quick actions:",
          syncButton: "Sync my sessions",
          keyButton: "Check my access key"
        },

        commonProblems: {
          connectionIssues: {
            title: "Connection Problems"
          },
          cannotCreateSession: {
            title: "Cannot create a session",
            causesTitle: "Possible causes:",
            causes: {
              cause1: "Missing or inactive terminal access key",
              cause2: "Simultaneous session limit reached",
              cause3: "Temporary server problem",
              cause4: "Usage quota exceeded"
            },
            solutionsTitle: "Solutions:",
            solutions: {
              step1: {
                title: "Check your access key:",
                description: "Go to \"Terminal Access Keys\" and regenerate your key if necessary"
              },
              step2: {
                title: "Close unused sessions:",
                description: "Stop active sessions you're no longer using"
              },
              step3: {
                title: "Wait and retry:",
                description: "Wait a few minutes then try creating a new session"
              }
            }
          },
          blackScreen: {
            title: "Terminal doesn't display or black screen",
            causesTitle: "Possible causes:",
            causes: {
              cause1: "Active content blocker",
              cause2: "WebSocket blocked by network/firewall",
              cause3: "Expired or stopped session",
              cause4: "Browser problem"
            },
            solutionsTitle: "Solutions:",
            solutions: {
              step1: {
                title: "Disable blockers:",
                description: "Whitelist the OCF domain in your extensions"
              },
              step2: {
                title: "Try another browser:",
                description: "Test with Chrome, Firefox or Edge in private mode"
              },
              step3: {
                title: "Check session status:",
                description: "Sync the session to confirm it's active"
              }
            }
          },
          keyboard: {
            title: "Keyboard not responding or incorrect characters",
            causesTitle: "Possible causes:",
            causes: {
              cause1: "Incorrect keyboard configuration",
              cause2: "Conflict with browser shortcuts",
              cause3: "High network delay",
              cause4: "Lost focus on terminal"
            },
            solutionsTitle: "Solutions:",
            solutions: {
              step1: {
                title: "Click in the terminal:",
                description: "Make sure focus is on the terminal area"
              },
              step2: {
                title: "Configure keyboard:",
                description: "Use <code>sudo dpkg-reconfigure keyboard-configuration</code>"
              },
              step3: {
                title: "Reload the page:",
                description: "Refresh (F5) to restore the connection"
              }
            }
          }
        },

        performanceProblems: {
          title: "Performance problems",
          slowTerminal: {
            title: "Slow or lagging terminal",
            tip1: "Close unnecessary tabs/applications",
            tip2: "Check your Internet connection",
            tip3: "Reduce the number of connected users",
            tip4: "Restart your browser"
          },
          freezing: {
            title: "Freezing session",
            tip1: "Avoid processes consuming a lot of memory",
            tip2: "Kill blocked processes with <code>Ctrl+C</code>",
            tip3: "Restart the session if necessary",
            tip4: "Contact support if the problem persists"
          },
          disconnections: {
            title: "Frequent disconnections",
            tip1: "Check your network stability",
            tip2: "Disable VPN if possible",
            tip3: "Change network (4G/WiFi)",
            tip4: "Use wired connection if available"
          }
        },

        syncProblems: {
          title: "Synchronization problems",
          incorrectStatus: {
            title: "Incorrect session status",
            description: "Use the \"Sync\" button to update the status. If the problem persists, wait a few minutes and retry."
          },
          inconsistentDates: {
            title: "Inconsistent expiration dates",
            description: "Global synchronization (\"Sync all\") usually solves this problem. Also check your system's time zones."
          },
          syncErrors: {
            title: "Synchronization errors",
            description: "These errors are often temporary. Wait a few minutes and restart synchronization. Contact support if they persist."
          }
        },

        support: {
          whenToContact: {
            title: "When to contact support",
            description: "Contact our support team in these situations:",
            critical: {
              title: "Critical - Immediate contact",
              item1: "Loss of important unsaved data",
              item2: "Unauthorized access to your sessions",
              item3: "Incorrect billing or unexpected charges",
              item4: "Suspected security problem"
            },
            high: {
              title: "Important - Contact within 24h",
              item1: "Unable to create sessions for several days",
              item2: "Persistent errors despite attempted solutions",
              item3: "Widespread performance problems",
              item4: "Sharing features not working"
            },
            normal: {
              title: "Normal - General support",
              item1: "Questions about using features",
              item2: "Improvement requests or suggestions",
              item3: "Help optimizing your usage",
              item4: "Training or guidance"
            }
          },
          infoToInclude: {
            title: "Information to include in your request:",
            username: "Your username and email",
            dateTime: "Date and time of the problem",
            detailedDescription: "Detailed description of steps taken",
            browser: "Browser and version used",
            os: "Operating system (Windows, Mac, Linux)",
            screenshots: "Error screenshots (if possible)"
          },
          contactButton: "Contact Support"
        },

        prevention: {
          title: "Prevention tips",
          description: "Adopt these best practices to avoid problems:",
          backup: {
            title: "Backup",
            tip1: "Regularly backup your important files",
            tip2: "Use Git to version your code",
            tip3: "Download critical data locally",
            tip4: "Document your important configurations"
          },
          timeManagement: {
            title: "Time management",
            tip1: "Monitor your session expiration dates",
            tip2: "Extend active sessions before expiration",
            tip3: "Plan your work according to time limits",
            tip4: "Stop unused sessions"
          },
          security: {
            title: "Security",
            tip1: "Never share your access keys",
            tip2: "Revoke shares as soon as they're no longer needed",
            tip3: "Regularly check granted access",
            tip4: "Use strong passwords for your accounts"
          },
          maintenance: {
            title: "Maintenance",
            tip1: "Keep your browser up to date",
            tip2: "Clear cache regularly",
            tip3: "Sync your sessions frequently",
            tip4: "Monitor your resource usage"
          }
        },

        resources: {
          title: "Additional resources",
          gettingStarted: {
            title: "Getting started guide",
            description: "Back to basics for optimal configuration"
          },
          managingSessions: {
            title: "Managing sessions",
            description: "Optimize your terminal session usage"
          }
        }
      },
      sshKeys: {
        title: "SSH Key Management",
        intro: "Manage your terminal access keys to connect to terminal sessions securely.",
        overview: {
          title: "What are Terminal Access Keys?",
          description: "Terminal access keys are credentials that authenticate you when connecting to terminal sessions. Each key is unique to your account and grants access to create and join terminal sessions on the platform.",
          requirement: "You need an active terminal access key to create or connect to any terminal session. Without a key, terminal features will be unavailable."
        },
        regenerate: {
          title: "Creating or Regenerating a Key",
          description: "You can generate a new terminal access key from the Terminal Access Keys page. If you already have a key, regenerating will replace it.",
          step1: {
            title: "Navigate to Terminal Access Keys",
            description: "Go to the Terminal Access Keys page from the settings menu or the main navigation."
          },
          step2: {
            title: "Click Regenerate Key",
            description: "Press the \"Regenerate key\" button. A confirmation dialog will appear to verify your intent."
          },
          step3: {
            title: "Confirm the Action",
            description: "Confirm the regeneration in the modal dialog. Your new key will be generated immediately and become active."
          },
          warning: {
            title: "Important",
            description: "Regenerating your key will immediately invalidate your previous key. Any sessions authenticated with the old key may be affected. Only regenerate when necessary."
          }
        },
        details: {
          title: "Key Details",
          description: "Your terminal access key page displays the following information about your current key.",
          keyId: {
            title: "Key ID",
            description: "A unique identifier for your terminal access key. This is used internally to track and manage your key."
          },
          keyName: {
            title: "Key Name",
            description: "A descriptive name for your key, usually auto-generated based on your account information."
          },
          status: {
            title: "Status",
            description: "Indicates whether your key is active or inactive. An active key (shown with a green badge) allows terminal access. An inactive key (shown with a red badge) must be regenerated."
          }
        },
        security: {
          title: "Security Best Practices",
          description: "Follow these guidelines to keep your terminal access secure.",
          keepSecure: {
            title: "Keep Your Key Secure",
            description: "Your terminal access key grants access to terminal sessions on your behalf. Treat it like a password and do not expose it unnecessarily."
          },
          noShare: {
            title: "Never Share Your Key",
            description: "Do not share your terminal access key with others. Each user should have their own key. Sharing keys can lead to unauthorized access and session conflicts."
          },
          regenerateIfCompromised: {
            title: "Regenerate if Compromised",
            description: "If you suspect your key has been compromised or accessed by someone else, regenerate it immediately to invalidate the old key."
          }
        },
        troubleshooting: {
          title: "Troubleshooting",
          description: "Common issues with terminal access keys and how to resolve them.",
          noKey: {
            title: "No key found (empty state)",
            description: "If the page shows \"No terminal key found\", you need to generate your first key. Click the \"Regenerate key\" button to create one. This is normal for new accounts."
          },
          inactive: {
            title: "Key is inactive",
            description: "An inactive key (red badge) means your key has been deactivated. This can happen due to administrative actions or policy changes. Try regenerating your key. If the issue persists, contact your administrator."
          },
          lost: {
            title: "Lost or forgotten key",
            description: "If you have lost access to your key or cannot remember it, simply regenerate a new one from the Terminal Access Keys page. The old key will be invalidated and a new one will take its place."
          }
        },
        nextSteps: {
          gettingStarted: {
            title: "Getting Started with Terminals",
            description: "Learn how to create and use your first terminal session"
          },
          troubleshooting: {
            title: "Terminal Troubleshooting",
            description: "Solutions to common terminal problems and issues"
          },
          settings: {
            title: "Settings & Preferences",
            description: "Configure your account settings and preferences"
          }
        }
      }
    },

    courses: {
      structure: {
        title: "Course Structure",
        intro: "Understanding the hierarchical organization of educational content in OCF",

        hierarchy: {
          title: "Content Hierarchy",
          description: "OCF uses a four-level hierarchical structure for organizing educational content:",
          levels: {
            course: {
              title: "Course",
              description: "Top level - A complete learning domain",
              example1: "Python Programming",
              example2: "Linux Administration",
              example3: "Database Fundamentals"
            },
            chapter: {
              title: "Chapter",
              description: "Second level - Major thematic division",
              example1: "Variables and Data Types",
              example2: "User and Permission Management",
              example3: "Introduction to SQL"
            },
            section: {
              title: "Section",
              description: "Third level - Specific sub-topic",
              example1: "Lists and Tuples",
              example2: "sudo and sudoers",
              example3: "SELECT and WHERE"
            },
            page: {
              title: "Page",
              description: "Fourth level - Content unit (text, exercises, media)",
              example1: "Practical Exercise: Manipulate Lists",
              example2: "Theoretical Lesson: Group Permissions",
              example3: "Tutorial: Your First Query"
            }
          }
        },

        creation: {
          title: "Creation and Organization",
          description: "Each level can be created and managed independently while maintaining the hierarchy:",
          step1: {
            title: "Create a course",
            description: "Define the general framework of your teaching.",
            button: "Manage Courses"
          },
          step2: {
            title: "Add chapters",
            description: "Structure the course into major thematic blocks.",
            button: "Manage Chapters"
          },
          step3: {
            title: "Divide into sections",
            description: "Refine each chapter with specific sub-topics.",
            button: "Manage Sections"
          },
          step4: {
            title: "Create content pages",
            description: "Add lessons, exercises and practical activities.",
            button: "Manage Pages"
          }
        },

        organization: {
          title: "Best Practices for Organization",
          description: "Follow these recommendations for effective structure:",
          tips: {
            tip1: {
              title: "Clear Objectives",
              description: "Each level should have a well-defined educational objective."
            },
            tip2: {
              title: "Logical Progression",
              description: "Organize content from simple to complex, with natural transitions."
            },
            tip3: {
              title: "Content Balance",
              description: "Avoid chapters or sections that are too long or too short."
            },
            tip4: {
              title: "Consistent Naming",
              description: "Use a uniform naming convention across all courses."
            }
          },
          structuring: {
            title: "Structuring tips:",
            tip1: {
              title: "Appropriate Granularity",
              description: "A page should cover a single concept or exercise. If content becomes too long, consider splitting it into multiple pages."
            },
            tip2: {
              title: "Modularity",
              description: "Design reusable sections that can be referenced or reused in multiple courses."
            },
            tip3: {
              title: "Multiple Paths",
              description: "Consider that learners might not follow a strictly linear path. Create logical links between related topics."
            }
          }
        },

        relationships: {
          title: "Relationships and Dependencies",
          description: "Understanding how different elements interact:",
          strict: {
            title: "Strict Hierarchy",
            description: "A page must belong to a section, which must belong to a chapter, which must belong to a course. This hierarchy cannot be bypassed."
          },
          reuse: {
            title: "Possible Reuse",
            description: "Sections and pages can be reused across different chapters or courses, promoting modular content."
          },
          sharing: {
            title: "Cross-Course Sharing",
            description: "Some resources (images, videos, documents) can be shared across multiple courses to avoid duplication."
          }
        },

        evolution: {
          title: "Structure Evolution",
          notice: "<strong>Important Note:</strong> The structure and functionalities described in this documentation represent an initial vision. The course conception system is under active development.",
          documentation: "This documentation will be updated as new features are implemented."
        },

        nextSteps: {
          content: {
            title: "Content Creation",
            description: "Learn how to write and structure educational content"
          },
          collaboration: {
            title: "Collaboration (Coming Soon)",
            description: "Team collaboration features for courses"
          }
        }
      },

      content: {
        title: "Content Creation",
        intro: "Guide for effectively writing and structuring educational content",

        types: {
          title: "Content Types",
          description: "OCF supports different types of educational content to adapt to your teaching methods and learning needs.",
          theoretical: {
            title: "Theoretical Lessons",
            description: "Explanatory content with text, images, and diagrams. Ideal for presenting fundamental concepts and notions.",
            tag1: "📝 Rich Text",
            tag2: "🖼️ Images",
            tag3: "📊 Diagrams"
          },
          practical: {
            title: "Practical Exercises",
            description: "Hands-on activities with instructions and resources. Allows learners to apply knowledge in practice.",
            tag1: "⚡ Interactive",
            tag2: "🎯 Guided",
            tag3: "💻 Terminal"
          },
          assessments: {
            title: "Assessments",
            description: "Knowledge tests and skills evaluations. Measures progress and validates learning.",
            tag1: "✅ MCQ",
            tag2: "📝 Open Questions",
            tag3: "📊 Scoring"
          },
          resources: {
            title: "Resources",
            description: "Links, documents, and supplementary references. Enriches learning with external content.",
            tag1: "🔗 Links",
            tag2: "📄 Documents",
            tag3: "🎥 Media"
          }
        },

        tools: {
          title: "Creation Tools",
          description: "The platform provides several tools to create rich and engaging content.",
          richEditor: {
            title: "Rich Text Editor",
            description: "WYSIWYG interface for text content formatting. Supports formatting, lists, links, and media insertion.",
            feature1: "Text formatting (bold, italic, colors)",
            feature2: "Bulleted and numbered lists",
            feature3: "Image and link insertion",
            feature4: "Code blocks with syntax highlighting"
          },
          terminalIntegration: {
            title: "Terminal Integration",
            description: "Direct connection with terminal sessions for practical exercises. Allows learners to practice in a real environment.",
            feature1: "Direct access to terminals from pages",
            feature2: "Step-by-step guided exercises",
            feature3: "Automatic command validation",
            feature4: "Preconfigured environments"
          },
          interactiveModules: {
            title: "Interactive Modules",
            description: "Creation of advanced interactive content with widgets, simulations, and gamified elements.",
            badge: "Coming Soon"
          }
        },

        principles: {
          title: "Pedagogical Principles",
          description: "Apply these principles to create pedagogically effective content:",
          clearObjectives: {
            title: "Clear Learning Objectives",
            description: "Explicitly define what the learner will be able to do after completing each page or section.",
            exampleLabel: "Example:",
            exampleText: "\"At the end of this lesson, you will know how to create and manipulate variables in Python.\""
          },
          gradualProgression: {
            title: "Gradual Progression",
            description: "Introduce concepts progressively, building on previously acquired knowledge.",
            exampleLabel: "Example:",
            exampleText: "Variables → Types → Operations → Functions"
          },
          activeLearning: {
            title: "Active Learning",
            description: "Alternate theory and practice. Offer regular exercises to anchor knowledge.",
            exampleLabel: "Recommended Ratio:",
            exampleText: "30% theory, 70% practice"
          },
          immediateFeedback: {
            title: "Immediate Feedback",
            description: "Provide quick feedback on exercises and assessments to maintain engagement.",
            exampleLabel: "Methods:",
            exampleText: "Automatic corrections, detailed explanations"
          }
        },

        writingTips: {
          title: "Writing Tips",
          description: "Optimize the quality and effectiveness of your content with these recommendations:",
          languageStyle: {
            title: "Language and Style",
            tip1: "Use clear and accessible language",
            tip2: "Avoid technical jargon without explanation",
            tip3: "Favor short and direct sentences",
            tip4: "Adopt a kind and encouraging tone"
          },
          visualStructure: {
            title: "Visual Structure",
            tip1: "Use explicit titles and subtitles",
            tip2: "Aerate text with short paragraphs",
            tip3: "Highlight important points",
            tip4: "Add visual elements (images, diagrams)"
          },
          validationExamples: {
            title: "Validation and Examples",
            tip1: "Illustrate each concept with concrete examples",
            tip2: "Offer real use cases",
            tip3: "Include counter-examples to avoid errors",
            tip4: "Test your exercises before publication"
          },
          audienceAdaptation: {
            title: "Audience Adaptation",
            tip1: "Adapt the level of detail to the target audience",
            tip2: "Offer differentiated paths if necessary",
            tip3: "Include clearly defined prerequisites",
            tip4: "Anticipate common difficulties"
          }
        },

        workflow: {
          title: "Creation Workflow",
          description: "Follow this process to create quality content efficiently:",
          step1: {
            title: "Planning",
            description: "Define objectives, target audience, and general structure"
          },
          step2: {
            title: "Writing",
            description: "Create content following pedagogical principles"
          },
          step3: {
            title: "Revision",
            description: "Proofread, correct, and optimize content"
          },
          step4: {
            title: "Testing",
            description: "Test exercises and validate consistency"
          },
          step5: {
            title: "Publication",
            description: "Publish and collect feedback for improvement"
          }
        },

        futureFeatures: {
          title: "Upcoming Features",
          description: "Content creation tools are under active development. Here's an overview of planned features:",
          soon: {
            title: "Coming Soon",
            feature1: "Predefined page templates",
            feature2: "Shared resource library",
            feature3: "Advanced markdown editor"
          },
          future: {
            title: "In Development",
            feature1: "Version system and collaboration",
            feature2: "Analytics and engagement metrics",
            feature3: "Content import/export"
          }
        },

        resources: {
          title: "Useful Resources",
          structure: {
            title: "Course Structure",
            description: "Understanding the hierarchical organization of content"
          },
          pageManagement: {
            title: "Page Management",
            description: "Access the creation and editing interface"
          },
          advancedGuide: {
            title: "Advanced Guide (Coming Soon)",
            description: "Advanced content creation techniques"
          }
        }
      }
    },

    account: {
      subscription: {
        title: "Subscription and plans",
        intro: "What each plan includes, how to subscribe, change plan or cancel, and how to read your subscription dashboard.",

        catalogue: {
          title: "The plans",
          description: "Four plans cover every use, from a first look to a whole school. They differ by terminal capacity (the machine sizes you can run at the same time), maximum session length, data persistence and network access.",
          ttc: "Prices shown in the app and on the Pricing page include VAT. When in doubt, the Pricing page is the reference.",
          discovery: {
            title: "Discovery",
            price: "Free",
            description: "One ephemeral XS machine, one-hour sessions, 7 days of command history, no network access. No credit card required."
          },
          solo: {
            title: "Solo",
            price: "€11.90 / month, VAT included",
            description: "To learn and prepare your material: 1 XL or 1 L or 3 M at once, sessions up to 8 h, Internet access, persistent machines (5 GB), 90 days of command history."
          },
          trainer: {
            title: "Trainer",
            price: "€19.90 / month, VAT included",
            description: "To run training sessions: the same machines as Solo, 20 GB of persistence, 365 days of command history, classes and session supervision. Learner seats are bought separately, per day or per month."
          },
          school: {
            title: "Schools and training organisations",
            price: "On quote",
            description: "Negotiated capacity and pricing, licenses assigned to your learners by an administrator, invoicing on quote. Contact us from the Pricing page."
          },
          screenshot: "The Available plans page, with the active plan marked by the “Current” badge."
        },

        whereToFind: {
          title: "Where to find these pages",
          description: "In the side menu, the Subscription & Licenses section holds:",
          dashboard: "My subscription — your dashboard: active plan, usage, recent invoices.",
          plans: "Available plans — the plan grid, to subscribe or change plan.",
          pricing: "Public pricing — the Pricing page as visitors see it, opened in a new tab.",
          licenses: "Purchase licenses and Manage licenses — learner seats (Trainer plan)."
        },

        subscribe: {
          title: "Subscribing",
          description: "From Available plans, pick the grid view or the comparison table (capacity, session duration, storage, network, supervision, command history), then click the button on the plan you want.",
          free: {
            title: "Discovery plan",
            description: "It activates immediately, with no payment and no card. You land on your dashboard with the plan active."
          },
          paid: {
            title: "Paid plan",
            description: "A dialog sums up the plan and its price including VAT, offers an optional coupon code and asks you to tick the waiver of the 14-day right of withdrawal (the service starts right away). You are then sent to Stripe's secure payment page; when it completes you are back in the app with the subscription active. If you cancel on Stripe, you return to a page that offers to retry."
          },
          emailVerified: "A paid plan requires a verified email address. If yours is not verified yet, the plan button sends you to the verification step.",
          screenshot: "The public Pricing page, with the four plans and the VAT-included notice."
        },

        changePlan: {
          title: "Changing plan",
          description: "The button on each card tells you the direction of the change: Upgrade or Downgrade.",
          upgrade: {
            title: "From one paid plan to another",
            description: "A confirmation states that the difference is charged immediately, prorated for the current period. The new plan applies at once, without going through Stripe again."
          },
          fromFree: {
            title: "From Discovery to a paid plan",
            description: "This is a new subscription: you go through the payment dialog described above, and the free plan is replaced once payment completes."
          },
          toFree: {
            title: "From a paid plan to Discovery",
            description: "After confirmation, the current subscription is cancelled immediately and the Discovery plan is activated. You are no longer billed."
          }
        },

        dashboard: {
          title: "The My subscription dashboard",
          description: "The Your active subscription card shows what is powering your terminals right now:",
          plan: "The plan name and its type: Personal subscription, Assigned license or Organization.",
          source: "The source (who pays) and, for an assigned license, the person who provided it.",
          priority: "The plan priority. If you hold several subscriptions, the one with the highest priority is active; when it expires, the next one takes over automatically.",
          features: "Key features: capacity expressed in machine sizes (for instance “1 XL or 1 L or 3 M”), session duration, storage, network access.",
          billing: "The next billing date, or the end-of-access date when a cancellation is scheduled.",
          actions: "For a paid personal subscription, the Manage subscription (Stripe portal), Change plan, Cancel and Reactivate buttons.",
          screenshot: "The dashboard of a trainer whose plan is provided by her organisation."
        },

        usage: {
          title: "My usage",
          description: "Below the card, the My usage panel expands to show your consumption in real time:",
          plan: "The plan that applies and its source (personal, or provided by your organisation).",
          capacity: "The plan capacity and the remaining capacity, expressed as the machine sizes you can still start (“≈ 1 L or 2 M”).",
          bars: "Two bars, CPU and RAM: what your active sessions take out of the plan budget.",
          sessions: "The list of active sessions: name, size, vCPU and memory, state (running or paused) and elapsed time.",
          refresh: "The panel refreshes every 30 seconds; the refresh button forces an update. When capacity is exhausted, stop a session to start another.",
          orgPanel: "If you manage an organisation, a second panel shows the usage of all its members: the budget is shared between them."
        },

        sources: {
          title: "Personal, organisation or assigned license",
          description: "A subscription can come from three sources. The badge on the card tells you which one is active.",
          personal: {
            title: "Personal subscription",
            description: "You subscribed to it and you manage it: billing, plan changes, cancellation."
          },
          organization: {
            title: "Organisation subscription",
            description: "Your organisation (school, training organisation, team) holds a plan and you inherit it as a member. The plan applied to each role is configured by the platform administrator together with the organisation."
          },
          assigned: {
            title: "Assigned license",
            description: "A seat bought by a trainer or an organisation was assigned to you. You can neither modify nor cancel it; the billing section and the Available plans menu are hidden. In the session composer, only the sizes this plan allows are shown."
          },
          assignedNote: "With an assigned license you cannot downgrade to a lower plan, but you can subscribe to a higher personal plan — or activate Discovery if you never had a personal subscription."
        },

        cancel: {
          title: "Cancelling and reactivating",
          description: "The Cancel button on the dashboard opens a confirmation with two options:",
          atPeriodEnd: "At the end of the paid period — you keep access until the date shown, then the subscription stops. The card shows “Access until”.",
          immediately: "Immediately — the subscription stops right away.",
          reactivate: "Until the end of the period is reached, the Reactivate button undoes the cancellation. After a cancellation, the dashboard also offers to reactivate the last subscription, or to activate the Discovery plan.",
          portal: "The Stripe portal (Manage subscription button) also lets you update your card and review payments; see the Billing page."
        },

        nextSteps: {
          billing: {
            title: "Billing and payments",
            description: "Invoices, billing addresses and payment methods"
          },
          organizations: {
            title: "Organisations",
            description: "How an organisation shares its plan with its members"
          },
          terminals: {
            title: "Terminal sessions",
            description: "Compose a session with the sizes your plan allows"
          }
        }
      },

      billing: {
        title: "Billing and payments",
        intro: "Where to find your invoices, enter a billing address and manage your payment methods.",

        whereToFind: {
          title: "Where to find these pages",
          description: "Click your name at the top right: the Billing & Payment section of the menu holds Payment Methods, Billing Addresses and Invoices. Your My subscription dashboard also shows your three most recent invoices.",
          verified: "The Payment Methods and Billing Addresses pages require a verified email address.",
          assigned: "If your plan is provided by an organisation or an assigned license, you are not billed: these pages stay reachable but empty."
        },

        invoices: {
          title: "Invoices",
          description: "The Invoices page lists every invoice issued for your account, synchronised from Stripe.",
          filter: "Filter by status: all, paid, unpaid, drafts, voided, refunded or partially refunded.",
          refresh: "The Refresh button resynchronises the list with Stripe.",
          details: "Each invoice shows its number, amount, date, due date and payment date; an overdue invoice is flagged.",
          download: "Download opens the invoice PDF; View in Stripe opens the page hosted by Stripe, where you can also pay it if it is pending.",
          screenshot: "The Invoices page of an account that has not bought anything yet."
        },

        addresses: {
          title: "Billing addresses",
          description: "A billing address appears on your invoices. You can store several and mark one as default.",
          fields: "Available fields: company name, SIRET, VAT number, address (two lines), postal code, city, state, country.",
          default: "The default address carries a badge; the Set as default button switches to another one.",
          edit: "Add, edit or delete an address with the buttons in the list."
        },

        paymentMethods: {
          title: "Payment methods",
          description: "The Payment Methods page lists your saved cards: brand, last four digits, expiry date, default card and a warning when the expiry is close.",
          add: "To add or replace a card, the Add a card button opens the Stripe portal; when you come back, the list is resynchronised.",
          default: "The Set as default button picks the card used for the next charges."
        },

        portal: {
          title: "The Stripe portal",
          description: "OCF stores no card data: payments and cards are handled by Stripe. The portal opens from Manage subscription (dashboard) or Add a card (payment methods) and brings you back to the app afterwards. There you can:",
          card: "update your card;",
          history: "review your payment history;",
          invoices: "download your invoices."
        },

        nextSteps: {
          subscription: {
            title: "Subscription and plans",
            description: "Subscribe, change plan, cancel"
          },
          licenses: {
            title: "Learner licenses",
            description: "Buy and assign seats to your learners"
          },
          settings: {
            title: "Settings",
            description: "Language, theme, account security"
          }
        }
      },

      rolesAndPermissions: {
        title: "Roles and permissions",
        intro: "Who can do what: the two platform roles, then the roles inside an organisation and inside a class.",
        overviewTitle: "Overview",
        overviewDescription: "Rights are read at three levels. On the platform everyone is a “member”; what makes the difference is your role in each organisation and each class.",
        platformLevel: "Platform",
        platformLevelDesc: "Only two roles: member and administrator. Every real user — learners, trainers, organisation managers — is a member. The administrator is the platform operator.",
        organizationLevel: "Organisation",
        organizationLevelDesc: "Member, teacher, manager or owner. The role decides who administers the organisation and who may create classes in it.",
        groupLevel: "Class",
        groupLevelDesc: "Member (learner), manager (co-trainer) or owner (the class creator).",
        orgRolesTitle: "Roles in an organisation",
        orgRolesDescription: "The role is changed from the organisation's Members tab; only an owner can name another owner.",
        permission: "Action",
        owner: "Owner",
        manager: "Manager",
        teacher: "Teacher",
        member: "Member",
        viewOrganization: "View the organisation and its members",
        useOrgPlan: "Use the organisation plan in their terminals",
        createClasses: "Create and run classes",
        inviteMembers: "Add or import members",
        removeMembers: "Remove members",
        changeRoles: "Change members' roles",
        promoteToOwner: "Name an owner",
        manageBilling: "Manage the organisation subscription",
        editOrgSettings: "Edit settings",
        deleteOrganization: "Delete the organisation",
        transferOwnership: "Transfer ownership",
        allowed: "Allowed",
        partial: "Partial",
        denied: "Not allowed",
        cannotPromoteToOwner: "Can assign member, teacher or manager, but not owner",
        groupRolesTitle: "Roles in a class",
        groupRolesDescription: "A class is a group of the organisation. The trainer who creates it is its owner and can add co-trainers as managers.",
        groupOwner: "Owner",
        groupOwnerDesc: "The class creator.",
        groupOwnerPerm1: "Everything a manager does",
        groupOwnerPerm2: "Name other owners or managers",
        groupOwnerPerm3: "Archive or delete the class",
        groupManager: "Manager",
        groupManagerDesc: "A co-trainer.",
        groupManagerPerm1: "Assign scenarios and launch sessions for the class",
        groupManagerPerm2: "Follow learners live and step into their terminal",
        groupManagerPerm3: "Add or remove learners, read analytics",
        groupMember: "Member",
        groupMemberDesc: "A learner.",
        groupMemberPerm1: "Launch the scenarios assigned to the class",
        groupMemberPerm2: "Use the license assigned through the class",
        groupMemberPerm3: "See their own progress",
        platformAdminTitle: "Platform administrator",
        platformAdminNoticeTitle: "Reserved for the operator",
        platformAdminNoticeDesc: "The administrator bypasses organisation and class roles and sees all data. It is not a role you can assign: a school or training-organisation manager is a member holding the owner role of their organisation. In the interface, elements visible only thanks to this role carry a badge.",
        scenariosTitle: "Frequent questions",
        scenario1Question: "Can a manager delete the organisation?",
        scenario1Answer: "No. Only an owner can delete the organisation or transfer its ownership.",
        scenario2Question: "Which role should a trainer get?",
        scenario2Answer: "Teacher is enough to create classes, enrol learners and follow them. Manager adds the administration of the organisation: members, subscription, settings.",
        scenario3Question: "What happens if the owner leaves the organisation?",
        scenario3Answer: "They must first transfer ownership to another member. An account cannot be deleted while it owns an organisation or a class.",
        scenario4Question: "Can I hold several roles?",
        scenario4Answer: "Yes. You can own one organisation, teach in another and be a learner in a class of a third. The user menu switches the active organisation.",
        reference: {
          title: "Technical reference",
          description: "For integrators, the permissions reference lists every API endpoint with its platform role and its access rule.",
          button: "Open the permissions reference"
        }
      },

      settings: {
        title: "Settings and preferences",
        intro: "The Settings pages set your landing page, language, appearance, notifications, password and terminal access keys.",
        overview: {
          title: "Reaching the settings",
          description: "Click your name at the top right, then Settings. A dedicated side menu replaces the usual navigation; the arrow at the top of the menu takes you back to the app.",
          autosave: "Each setting is saved as soon as you change it; a notification confirms the save."
        },
        navigation: {
          title: "Navigation",
          description: "Default landing page: the page opened after login and when you click the OCF logo.",
          defaultPage: {
            title: "Available choices",
            description: "Subscription dashboard, Terminal sessions, My classes or Groups (depending on the features enabled on the platform). Without an explicit choice, a trainer who runs classes in their active organisation lands on My classes; everyone else on Terminal sessions."
          }
        },
        localization: {
          title: "Localization",
          description: "Interface language and timezone.",
          language: {
            title: "Preferred language",
            description: "French or English. The change applies immediately to the whole interface, help included. The language selector at the top of the screen does the same."
          },
          timezone: {
            title: "Timezone",
            description: "Automatic (your browser's) or a fixed zone. It is used to display dates and times: sessions, invoices, history."
          },
          screenshot: "The Localization page."
        },
        ui: {
          title: "User interface",
          description: "The look of the application.",
          theme: {
            title: "Theme",
            description: "Light, Dark or Auto (follows your system). See the Dark mode and themes page."
          },
          compact: {
            title: "Compact mode",
            description: "Reduces spacing to fit more content on screen."
          },
          screenshot: "The User interface page."
        },
        notifications: {
          title: "Notifications",
          description: "Two checkboxes: Email notifications and Desktop notifications (browser notifications)."
        },
        security: {
          title: "Security",
          description: "The page shows when the password was last changed and lets you set a new one.",
          password: {
            title: "Change password",
            description: "Enter the current password, then the new one twice. Both entries must match and the password must be strong enough."
          },
          deleteAccount: {
            title: "Delete my account",
            description: "At the bottom of the page, the danger zone permanently deletes your account: terminal sessions, SSH keys, scenario history and memberships are erased; invoices and payment records are anonymised and kept for accounting. You must first transfer ownership of the organisations and classes you own. Deletion asks you to type a confirmation text."
          }
        },
        sshKeys: {
          title: "Terminal access keys",
          description: "The last entry of the menu manages your SSH keys, to connect to sessions from your own terminal.",
          linkText: "The details are in the SSH keys guide of the Terminals section.",
          button: "SSH keys guide"
        },
        version: {
          title: "Application version",
          description: "The version numbers of the interface, the API and the terminal service are in the user menu, About section. Quote them when reporting a problem."
        },
        nextSteps: {
          themes: {
            title: "Dark mode and themes",
            description: "Pick and switch the theme"
          },
          sshKeys: {
            title: "SSH keys",
            description: "Connect to a session from your own terminal"
          },
          roles: {
            title: "Roles and permissions",
            description: "Who can do what in an organisation or a class"
          }
        }
      },
      themes: {
        title: "Dark mode and themes",
        intro: "The application offers a light theme, a dark theme and an automatic mode. The choice is saved with your account and applies everywhere, terminals included.",
        selection: {
          title: "The three modes",
          light: {
            title: "Light",
            description: "Light backgrounds, dark text. The default theme."
          },
          dark: {
            title: "Dark",
            description: "Dark backgrounds, light text: less strain in low light."
          },
          auto: {
            title: "Auto (System)",
            description: "Follows the light/dark setting of your operating system or browser, and switches along with it."
          }
        },
        whereToChange: {
          title: "Where to change the theme",
          description: "User menu (your name at the top right) > Settings > User Interface > Theme. The change is immediate and saved.",
          compact: "The same page offers compact mode, which tightens spacing.",
          button: "See the settings guide",
          screenshot: "The User interface page, where the theme is chosen."
        },
        nextSteps: {
          settings: {
            title: "Settings and preferences",
            description: "Language, landing page, notifications, security"
          },
          gettingStarted: {
            title: "Getting started with terminals",
            description: "Launch your first session"
          },
          subscription: {
            title: "Subscription and plans",
            description: "Your plan and what it allows"
          }
        }
      }
    },

    organizations: {
      overview: {
        title: "Organizations Overview",
        intro: "Organizations are the top-level structure for managing teams, licenses, and content. Learn how to create and configure organizations effectively.",
        whatAre: {
          title: "What are Organizations?",
          description: "An organization is a logical container that groups users, manages subscriptions, and controls access to platform features. Organizations can represent companies, schools, departments, or any team.",
          benefit1: "Centralized user and license management",
          benefit2: "Shared billing and subscription plans",
          benefit3: "Group-based content assignment",
          benefit4: "Role-based access control"
        },
        creating: {
          title: "Creating & Managing Organizations",
          description: "Learn how to set up your organization step by step.",
          step1: {
            title: "Create Your Organization",
            description: "Navigate to the Organizations page and click 'Create Organization'. Provide a name and optional description."
          },
          step2: {
            title: "Configure Settings",
            description: "Set up your organization's preferences including default roles, notification settings, and branding options."
          },
          step3: {
            title: "Invite Members",
            description: "Add members by email or bulk import. Assign roles (Owner, Manager, or Member) based on responsibilities."
          }
        },
        members: {
          title: "Member Management",
          description: "Manage your organization's members and their access levels.",
          addMembers: "Invite new members via email or import from CSV",
          assignRoles: "Assign Owner, Manager, or Member roles",
          manageLicenses: "Allocate licenses to individual members",
          removeMembers: "Remove members or transfer their data"
        },
        settings: {
          title: "Organization Settings",
          description: "Configure your organization to match your workflow.",
          general: "General settings: name, description, and branding",
          notifications: "Notification preferences for organization events",
          security: "Security settings and access policies",
          billing: "Billing information and subscription management"
        },
        bestPractices: {
          title: "Best Practices",
          description: "Follow these recommendations for effective organization management.",
          tip1: {
            title: "Start with Clear Roles",
            description: "Define who should be owners, managers, and members before inviting people. This prevents permission confusion later."
          },
          tip2: {
            title: "Use Groups for Structure",
            description: "Create groups within your organization to manage classes, teams, or departments separately."
          },
          tip3: {
            title: "Regular License Audits",
            description: "Review license assignments periodically to ensure they're allocated to active users."
          }
        },
        detailTabs: {
          title: "Organization Detail Tabs",
          description: "The organization detail page is organized into tabs for easy navigation between different management areas.",
          overview: {
            title: "Overview",
            description: "A summary of your organization including member count, active groups, and subscription status."
          },
          members: {
            title: "Members",
            description: "View, invite, and manage all organization members. Assign roles and monitor activity."
          },
          groups: {
            title: "Groups",
            description: "Create and manage groups within the organization. Assign members and content per group."
          },
          subscription: {
            title: "Subscription",
            description: "View and manage the organization-level subscription, including plan details and usage metrics."
          },
          settings: {
            title: "Settings",
            description: "Configure organization preferences, branding, notification rules, and security policies."
          }
        },
        orgSubscription: {
          title: "Organization-Level Subscription",
          description: "Each organization can have its own subscription, separate from any personal subscriptions held by individual members.",
          separate: {
            title: "Separate from Personal Subscriptions",
            description: "The organization subscription is managed independently on the organization's Subscription tab. It covers all members of the organization and is billed to the organization rather than to individual users."
          }
        },
        subscriptionPreference: {
          title: "Subscription Preference",
          description: "When a user belongs to an organization that has its own subscription, the system determines which subscription takes effect based on plan tier.",
          priority: {
            title: "Higher Tier Takes Priority",
            description: "If the organization subscription offers a higher tier than the user's personal subscription, the organization subscription takes precedence. This ensures that members always benefit from the best available plan without manual switching."
          }
        },
        bulkImportIntegration: {
          title: "Bulk Import Integration",
          description: "You can import members directly from the organization detail page without navigating to a separate tool.",
          accessButton: "A \"Bulk Import\" button is available on the organization detail page, pre-configured to import members into the current organization",
          autoAssign: "Imported users are automatically associated with the organization and can be assigned to groups during import"
        },
        nextSteps: {
          groups: {
            title: "Group Management",
            description: "Learn how to create and manage groups within your organization"
          },
          roles: {
            title: "Roles & Permissions",
            description: "Understand the permission system across organizations and groups"
          }
        }
      }
    },

    groups: {
      management: {
        title: "Group Management",
        intro: "Groups allow you to organize members within an organization into classes, teams, or departments. Learn how to create, configure, and manage groups effectively.",
        overview: {
          title: "Understanding Groups",
          description: "Groups are subsets of an organization that help you manage members and assign content at a finer level.",
          feature1: "Organize members into classes or teams",
          feature2: "Assign courses and terminal access per group",
          feature3: "Manage roles within each group independently",
          feature4: "Support hierarchical group structures"
        },
        creating: {
          title: "Creating Groups",
          description: "Follow these steps to create a new group within your organization.",
          step1: {
            title: "Navigate to Groups",
            description: "Go to the Groups page from the main navigation or from your organization detail page."
          },
          step2: {
            title: "Create a New Group",
            description: "Click 'Create Group', enter a name and description, and select the parent organization."
          },
          step3: {
            title: "Add Members",
            description: "Invite members to the group or add existing organization members. Assign group-specific roles."
          }
        },
        hierarchy: {
          title: "Group Hierarchy",
          description: "Groups can be organized in a hierarchical structure for complex organizations.",
          parentGroups: "Parent groups can contain sub-groups",
          inheritance: "Settings can be inherited from parent to child groups",
          navigation: "Use the hierarchy editor for drag-and-drop organization",
          visualization: "View the complete hierarchy tree from the hierarchy page"
        },
        roles: {
          title: "Group Member Roles",
          description: "Each group member has a role that determines their permissions within that group.",
          owner: {
            title: "Group Owner",
            description: "Full control over the group, including settings, members, and content"
          },
          manager: {
            title: "Group Manager",
            description: "Can manage members and content but cannot delete the group or change critical settings"
          },
          member: {
            title: "Group Member",
            description: "Can access assigned content and participate in group activities"
          }
        },
        content: {
          title: "Content Assignment",
          description: "Assign courses and resources to groups so all members have access.",
          assignCourses: "Assign courses to a group for all members",
          terminalAccess: "Configure terminal access settings per group",
          scheduling: "Set up schedules for content availability",
          tracking: "Track group progress and completion rates"
        },
        settings: {
          title: "Group Settings",
          description: "Configure your group to fit your needs.",
          general: "Name, description, and visibility settings",
          enrollment: "Open or closed enrollment, invitation-only access",
          notifications: "Group-level notification preferences",
          limits: "Member limits and content restrictions"
        },
        nextSteps: {
          organizations: {
            title: "Organizations Overview",
            description: "Learn about the organizational structure that contains your groups"
          },
          roles: {
            title: "Roles & Permissions",
            description: "Deep dive into the permission system for organizations and groups"
          }
        }
      }
    },

    bulkImport: {
      overview: {
        title: "Bulk Import",
        intro: "Import multiple users into your organization at once using CSV files. This guide walks you through the import process, CSV format requirements, and best practices.",
        whatIs: {
          title: "What is Bulk Import?",
          description: "Bulk import allows organization managers to add many users simultaneously by uploading a CSV file. This is ideal for onboarding classes, departments, or entire organizations.",
          benefit1: "Import dozens or hundreds of users at once",
          benefit2: "Automatic account creation and role assignment",
          benefit3: "Validation and error reporting before import",
          benefit4: "Support for group assignment during import"
        },
        csvFormat: {
          title: "CSV File Format",
          description: "Your CSV file must follow a specific format for successful import.",
          requiredFields: "Required fields: email, first_name, last_name",
          optionalFields: "Optional fields: role, group, phone",
          encoding: "File encoding: UTF-8 recommended",
          delimiter: "Delimiter: comma (,) or semicolon (;)",
          nameSplit: "A single name column is split into first_name and last_name before upload. Open the preview of the users file to choose the default order (last name first, as in DUPONT Marie, or first name first) and, for any row, click between two words to move the cut or swap the two sides; a name with a single word becomes the last name.",
          example: "email,first_name,last_name,role\njohn{'@'}example.com,John,Doe,member\njane{'@'}example.com,Jane,Smith,manager"
        },
        wizard: {
          title: "Import Wizard",
          description: "The import wizard guides you through the process step by step.",
          step1: {
            title: "Upload File",
            description: "Select your CSV file and choose the delimiter format. The system will preview the first rows."
          },
          step2: {
            title: "Map Columns",
            description: "Map your CSV columns to the required fields. The system attempts auto-mapping based on column headers."
          },
          step3: {
            title: "Validate Data",
            description: "Review the validation results. Fix any errors in your CSV and re-upload if needed."
          },
          step4: {
            title: "Confirm Import",
            description: "Review the summary and confirm the import. New accounts will be created and invitation emails sent."
          }
        },
        validation: {
          title: "Validation & Error Handling",
          description: "The system validates your data before importing to prevent issues.",
          emailValidation: "Email addresses are checked for format and duplicates",
          roleValidation: "Roles are validated against available options",
          groupValidation: "Group names are matched against existing groups",
          errorReport: "A detailed error report is generated for any issues found"
        },
        tips: {
          title: "Tips & Best Practices",
          description: "Follow these tips for a smooth import experience.",
          tip1: {
            title: "Test with Small Batches",
            description: "Start with a small CSV (5-10 users) to verify your format before importing the full list."
          },
          tip2: {
            title: "Prepare Your Groups First",
            description: "Create all groups before importing so you can assign users to groups during import."
          },
          tip3: {
            title: "Check for Duplicates",
            description: "Remove duplicate email addresses from your CSV. The system will flag duplicates but won't import them."
          }
        },
        csvEncoding: {
          title: "CSV Encoding Auto-Detection",
          description: "The import system automatically detects your file's character encoding, so you do not need to convert files manually.",
          utf8: "UTF-8 files are supported natively and recommended for best compatibility",
          windows: "Windows-1252 encoding (common with Excel exports) is detected and handled automatically",
          bomStripping: "Byte Order Mark (BOM) characters are stripped automatically, preventing hidden character issues in your headers"
        },
        columnAliases: {
          title: "Column Alias Support",
          description: "French column headers are recognized automatically during mapping, so you can use your native language in CSV exports without manual renaming.",
          examplesTitle: "Supported aliases:"
        },
        forcePasswordReset: {
          title: "Force Password Reset",
          description: "You can require imported users to change their password on first login for enhanced security.",
          column: "Add a force_reset column to your CSV with values true or false per user",
          automatic: "When a password is auto-generated (no password column provided), the force reset flag is enabled automatically"
        },
        autoGeneratedPasswords: {
          title: "Auto-Generated Passwords",
          description: "When your CSV does not include a password column, the system generates strong, random passwords for each new user account.",
          secure: "Generated passwords are 16 characters long, combining letters, numbers, and special characters",
          downloadable: "After import, a downloadable credentials table is available containing each user's email and temporary password",
          warning: {
            title: "Security Warning",
            description: "Download and distribute the credentials table promptly. For security reasons, auto-generated passwords cannot be retrieved after you leave the import results page."
          }
        },
        trialPlanAssignment: {
          title: "Trial Plan Assignment",
          description: "Newly created user accounts are automatically assigned the trial plan, giving them immediate access to the platform without any manual subscription setup."
        },
        targetGroupDropdown: {
          title: "Target Group Dropdown",
          description: "A dropdown on the import page lets you select a target group. All users in the current import batch will be automatically added to the selected group, saving you from assigning each one individually after import."
        },
        updateExistingUsers: {
          title: "Update Existing Users",
          description: "Enable the \"Update existing users if found\" toggle to update the profile information of users who already exist on the platform (matched by email address). When disabled, existing users are skipped during import."
        },
        verifyEmails: {
          title: "Verified Email Addresses",
          description: "The \"Mark imported email addresses as verified\" option, on by default, lets imported accounts skip the email confirmation step because the organization vouches for them; untick it to let each learner confirm their own address first."
        },
        validationPreview: {
          title: "Validation Preview",
          description: "Before executing the import, a preview step displays the validation results for every row in your CSV. You can review warnings, errors, and pending actions so you know exactly what will happen before confirming."
        },
        importProgress: {
          title: "Import Progress",
          description: "Once you confirm the import, a real-time progress display shows the outcome for each user as it is processed.",
          created: "Created: new accounts successfully added to the platform",
          updated: "Updated: existing users whose profile was refreshed with new data",
          skipped: "Skipped: rows that were ignored due to errors or duplicate entries"
        },
        nextSteps: {
          organizations: {
            title: "Organizations Overview",
            description: "Learn about organization structure and management"
          },
          groups: {
            title: "Group Management",
            description: "Set up groups before importing users"
          }
        }
      }
    },

    scenarios: {
      gettingStarted: {
        title: "Getting Started with Interactive Scenarios",
        intro: "Interactive scenarios are guided, step-by-step lab exercises that run on real Linux terminals. Follow instructions, execute commands, and get instant feedback on your progress.",

        whatAre: {
          title: "What are Interactive Scenarios?",
          description: "Interactive scenarios are guided exercises that walk you through real-world tasks step by step. Each scenario runs on a real Linux terminal — you follow instructions, execute commands, and the system verifies your work automatically. Scenarios cover topics like installing software, configuring services, writing scripts, and more."
        },

        starting: {
          title: "Starting a Scenario",
          description: "Follow these steps to launch your first interactive scenario.",
          step1: {
            title: "Open the Scenario Launcher",
            description: "Navigate to the <strong>Scenarios</strong> section in the menu. You will see a list of scenarios available to you — the list is filtered to the ones assigned to your organization or group.",
            button: "My Terminal Sessions"
          },
          step2: {
            title: "Browse and Select a Scenario",
            description: "Browse the available scenarios. Each one displays its <strong>title</strong>, <strong>difficulty badge</strong> (beginner, intermediate, or advanced), and <strong>estimated completion time</strong>. Click <strong>\"Start\"</strong> on the scenario you want to work on."
          },
          step3: {
            title: "Environment Provisioning",
            description: "The platform automatically provisions the right environment for that scenario — the correct distribution and size are selected for you. A provisioning overlay is shown while your environment is being prepared. You do not need to compose a session manually."
          },
          step4: {
            title: "The Scenario Panel Opens",
            description: "Once ready, a <strong>panel opens on the right side</strong> of your terminal. This panel contains the instructions for your current step, and the terminal remains fully usable on the left."
          },
          tip: {
            title: "Tip",
            description: "If you already have a running scenario session, you can resume it directly from the scenario launcher — no need to recreate it."
          }
        },

        panel: {
          title: "The Scenario Panel",
          description: "The scenario panel is your guide throughout the exercise. Here is what you will find in it.",
          progress: {
            title: "Step Progress",
            description: "Progress dots at the bottom of the panel show your advancement. Completed steps appear green, the current step pulses blue, and upcoming steps are gray."
          },
          content: {
            title: "Step Content",
            description: "Each step's instructions are rendered in rich markdown format, including headings, code blocks, images, and lists. Read the instructions carefully before executing commands."
          },
          collapse: {
            title: "Collapse / Expand",
            description: "Click the circular toggle button on the left edge of the panel to collapse or expand it. This gives you more terminal space when you need it."
          },
          tip: {
            title: "Tip",
            description: "The panel remembers your collapse preference across sessions, so it will stay the way you left it next time."
          }
        },

        verifying: {
          title: "Verifying Your Work",
          description: "After completing the instructions for a step, you can verify that everything is set up correctly.",
          click: {
            title: "Click Verify",
            description: "Click the <strong>\"Verify\"</strong> button at the bottom of the step instructions. The system will run a verification script on your terminal in the background."
          },
          result: {
            title: "Review the Result",
            description: "After a few seconds, you will see feedback indicating whether the verification <strong>passed</strong> or <strong>failed</strong>, along with any output from the verification script."
          },
          passed: {
            title: "Passed",
            description: "A green success message appears with the script output. The scenario automatically advances to the next step after a short animation."
          },
          failed: {
            title: "Failed",
            description: "A red error message appears explaining what went wrong. Review the output, fix the issue in your terminal, and try verifying again."
          },
          tip: {
            title: "Tip",
            description: "You can verify as many times as you need — there is no penalty for retrying. Take your time to get each step right."
          }
        },

        hints: {
          title: "Using Hints",
          description: "Some steps include hints to help you if you get stuck.",
          show: {
            title: "Show a Hint",
            description: "If a step has a hint available, you will see a <strong>\"Show Hint\"</strong> button. Click it to reveal additional guidance displayed in a highlighted box."
          },
          hide: {
            title: "Hide the Hint",
            description: "Click <strong>\"Hide Hint\"</strong> to close the hint box and return to just the step instructions."
          }
        },

        ctf: {
          title: "CTF Flag Challenges",
          description: "Some scenarios include Capture The Flag (CTF) style challenges that test your skills in a gamified way.",
          find: {
            title: "Find the Flag",
            description: "Instead of a Verify button, CTF steps display a <strong>flag input field</strong>. Complete the exercise and look for a flag in the format <strong>FLAG{'{'} ...{'}'}</strong> somewhere in the system."
          },
          submit: {
            title: "Submit the Flag",
            description: "Type or paste the flag you found into the input field and click <strong>\"Submit Flag\"</strong>. A green message confirms a correct flag, while a red message means it is incorrect — you can try again."
          },
          unique: {
            title: "Unique Per Learner",
            description: "Each learner receives <strong>unique flags</strong> generated specifically for their session. Sharing flags with others will not work, as they are cryptographically bound to each individual learner."
          },
          tip: {
            title: "Tip",
            description: "Flags are generated uniquely for each learner using cryptographic hashing, so you must find your own. Look carefully in the exercise environment — flags can be hidden in files, command outputs, or service configurations."
          }
        },

        codeBlocks: {
          title: "Code Blocks",
          description: "Scenario instructions often contain code blocks. These come with convenient action buttons when you hover over them.",
          copy: {
            title: "Copy to Clipboard",
            description: "Hover over a code block and click the copy button (top-right corner) to copy the code to your clipboard."
          },
          execute: {
            title: "Paste into Terminal",
            description: "For single-line commands, a terminal button appears (bottom-right corner). Click it to paste the command directly into your active terminal."
          }
        },

        abandoning: {
          title: "Abandoning a Scenario",
          description: "If you need to stop working on a scenario before completing it, you can abandon your current attempt.",
          click: {
            title: "Click Abandon",
            description: "At the top of the session page, to the right of the <strong>\"Back to My Sessions\"</strong> link, click the <strong>\"Abandon Scenario\"</strong> button."
          },
          confirm: {
            title: "Confirm Abandonment",
            description: "A confirmation dialog will appear. Confirm your choice to mark the session as <strong>abandoned</strong>."
          },
          warning: {
            title: "Warning",
            description: "You can start a new attempt later, but your current progress will be lost. Make sure you really want to abandon before confirming."
          }
        },

        completing: {
          title: "Completing a Scenario",
          description: "Once you pass all the steps in a scenario, you have completed it.",
          finish: {
            title: "Completion Screen",
            description: "After passing the final step, a <strong>completion screen with a trophy icon</strong> appears, congratulating you on finishing the scenario."
          },
          history: {
            title: "View Your History",
            description: "Click <strong>\"View my scenarios\"</strong> to see your scenario history, including completed, active, and abandoned sessions.",
            button: "My Scenarios"
          }
        },

        nextSteps: {
          description: "Continue learning with these related guides."
        }
      },

      creation: {
        title: "Creating Interactive Scenarios",
        intro: "Learn how to build engaging, step-by-step interactive exercises for your learners with real terminal environments, verification scripts, and CTF challenges.",

        overview: {
          title: "Overview",
          description: "As a trainer, you can create interactive scenarios that guide learners through real-world exercises. Each scenario consists of ordered steps with instructions, verification scripts, and optional hints. Scenarios run on real Linux containers matching a chosen distribution, giving learners a hands-on experience."
        },

        creating: {
          title: "Creating a Scenario",
          description: "Follow these steps to create a new interactive scenario.",
          step1: {
            title: "Navigate to Scenarios",
            description: "Go to <strong>Admin > Scenarios</strong> in the administration panel to access the scenario management page.",
            button: "Go to Scenarios"
          },
          step2: {
            title: "Fill in Scenario Details",
            description: "Click <strong>\"Create\"</strong> and fill in the scenario details: <strong>title</strong>, <strong>description</strong>, <strong>difficulty level</strong> (beginner, intermediate, or advanced), and <strong>estimated completion time</strong> in minutes."
          },
          step3: {
            title: "Choose the Distribution",
            description: "Select the <strong>distribution</strong> (Linux image) that learners' environments will use for this scenario. This determines the operating system and pre-installed tools available during the exercise. Launching the scenario automatically provisions the right environment — learners do not need to pick a size or features themselves."
          },
          tip: {
            title: "Tip",
            description: "Choose a descriptive title — learners see this when picking a scenario from the list. A good title clearly indicates what the exercise covers."
          }
        },

        steps: {
          title: "Adding Steps",
          description: "Each scenario is composed of ordered steps. Create and configure them individually.",
          step1: {
            title: "Navigate to Scenario Steps",
            description: "Go to <strong>Admin > Scenario Steps</strong> in the administration panel.",
            button: "Go to Scenario Steps"
          },
          step2: {
            title: "Create a Step",
            description: "Create a new step linked to your scenario. Each step has the following fields:",
            fieldTitle: "<strong>Title</strong> — displayed in the step header, should be concise and descriptive",
            fieldText: "<strong>Text Content</strong> — markdown instructions shown to the learner (supports headings, code blocks, images, and lists)",
            fieldHint: "<strong>Hint</strong> — optional markdown text revealed when the learner clicks \"Show Hint\"",
            fieldVerify: "<strong>Verify Script</strong> — a shell script that exits with code 0 on success (this is the core of the exercise verification)",
            fieldBackground: "<strong>Background Script</strong> — optional script executed in the background when the step starts",
            fieldForeground: "<strong>Foreground Script</strong> — optional script executed in the foreground when the step starts",
            fieldOrder: "<strong>Order</strong> — a number determining the step sequence (0-based, lower numbers come first)"
          },
          step3: {
            title: "Set the Correct Order",
            description: "Make sure each step has the correct <strong>order value</strong> so that steps are presented to learners in the right sequence. Steps are sorted by their order number (starting from 0)."
          },
          tip: {
            title: "Tip",
            description: "Write verify scripts that check the actual state of the system — for example, whether a package is installed, a file exists, or a service is running. The exit code (0 for success, non-zero for failure) determines whether the step passes or fails."
          }
        },

        verifyScripts: {
          title: "Writing Good Verify Scripts",
          description: "A verify script is a shell command that returns exit code 0 if the learner has completed the step correctly, and a non-zero exit code otherwise. Here are some common examples.",
          checkPackage: {
            title: "Check Package Installed"
          },
          checkFile: {
            title: "Check File Exists"
          },
          checkService: {
            title: "Check Service Running"
          },
          checkContent: {
            title: "Check File Content"
          },
          warning: {
            title: "Important",
            description: "Verify scripts are never shown to learners. They run server-side on the learner's terminal with a 10-second timeout. Make sure your scripts complete quickly and produce clear output on failure."
          }
        },

        ctf: {
          title: "CTF Flag Challenges",
          description: "Add a gamification layer to your scenarios with Capture The Flag challenges.",
          enable: {
            title: "Enable Flags on the Scenario",
            description: "When creating or editing a scenario, enable the <strong>\"Flags Enabled\"</strong> option to activate CTF mode for this scenario."
          },
          markSteps: {
            title: "Mark Steps as Flag Steps",
            description: "For individual steps, enable the <strong>\"Has Flag\"</strong> option. Those steps will display a flag input field instead of a Verify button."
          },
          unique: {
            title: "Unique Flags Per Learner",
            description: "Flags are generated using <strong>HMAC-SHA256</strong> and are unique per learner — it is impossible for learners to share answers. The flag format is <strong>FLAG{'{'} 16-hex-characters {'}'}</strong>."
          },
          tip: {
            title: "Tip",
            description: "CTF flags add a competitive, gamified element to your exercises. Use them for bonus challenges, security-focused exercises, or competitive training sessions."
          }
        },

        challengeMode: {
          title: "Challenge Mode (Crash Traps)",
          description: "Challenge mode enables advanced exam-style scenarios where the entire environment is provisioned at once — with password-gated user accounts, sabotaged configurations, and crash traps that destroy the machine on careless actions.",
          enable: {
            title: "Enable Challenge Mode",
            description: "When creating a scenario, enable the <strong>\"Crash Traps\"</strong> option. This activates challenge mode, which changes how the scenario is provisioned."
          },
          howItWorks: {
            title: "How It Works",
            description: "In challenge mode, the scenario engine works differently from standard step-by-step scenarios:",
            standard: "<strong>Standard mode</strong>: flags are deployed one at a time as the learner advances through steps. Each step's background script sets up only that step.",
            challenge: "<strong>Challenge mode</strong>: ALL flags are bundled into a configuration file and pushed to the container at session start. The first step's background script is a full setup script that provisions the entire environment at once — creating users, installing traps, placing all flags."
          },
          whyNeeded: {
            title: "Why a Separate Mode?",
            description: "Challenge scenarios use <strong>flag-as-password gating</strong>: each level's flag becomes the password for the next Linux account (e.g., finding FLAG_L0 lets you <code>su - level1</code>). This requires ALL flags to exist at container creation time to set all account passwords. Deploying flags one at a time would make it impossible to create the accounts with the right passwords."
          },
          setupScript: {
            title: "The Setup Script",
            description: "In challenge mode, <strong>step 0's background script</strong> serves as the full provisioning script. It reads <code>/etc/challenge/config.json</code> (automatically pushed by the platform with all generated flags) and sets up the entire environment: user accounts, traps, sabotaged configurations, and flag placements."
          },
          crashTraps: {
            title: "Crash Traps",
            description: "Crash traps are mechanisms built into the container that <strong>destroy the machine</strong> when the learner performs a careless action (e.g., running <code>sudo</code> without checking aliases, deleting a system file instead of editing it). The learner loses all progress and must start a new session — this is the rogue-lite mechanic that teaches <strong>\"understand before you act\"</strong>."
          },
          naming: {
            title: "Important: Flag File Naming",
            description: "If your challenge uses LD_PRELOAD or other file-hiding mechanisms, make sure flag filenames do <strong>not</strong> contain the words \"flag\" or \"FLAG\" — hidden files with these patterns become invisible in directory listings. Use neutral names like <code>.the_key</code> or <code>level1_key.txt</code> instead."
          },
          tip: {
            title: "Tip",
            description: "Challenge mode scenarios are complex to build. Start with the setup script (test it manually in a container), then wrap it as step 0's background script and seed the scenario. The platform handles flag generation, config injection, and terminal user switching automatically."
          }
        },

        killercoda: {
          title: "KillerCoda Compatibility",
          description: "OCF supports the KillerCoda index.json format for scenario import, making it easy to migrate existing content.",
          layout: "The standard KillerCoda directory layout is supported: index.json for metadata, intro.md and finish.md for introduction and conclusion text, and step directories (step1/, step2/, etc.) containing text.md for instructions and verify.sh for verification scripts.",
          info: {
            title: "Note",
            description: "Git-based import is planned for a future release. For now, you can import scenarios via the admin panel or the CLI seed script."
          }
        },

        uploadAdmin: {
          title: "Importing via Admin Panel",
          description: "The easiest way to import a KillerCoda-compatible scenario is through the admin panel.",
          step1: {
            title: "Prepare your archive",
            description: "Package your scenario directory as a <strong>.zip</strong> or <strong>.tar.gz</strong> file. The archive must contain an <strong>index.json</strong> file at the root (or one level deep)."
          },
          step2: {
            title: "Open the import modal",
            description: "Navigate to <strong>Admin > Scenarios</strong> and click the <strong>\"Import KillerCoda\"</strong> button at the top of the page.",
            button: "Go to Scenarios"
          },
          step3: {
            title: "Upload the archive",
            description: "Drag and drop your archive file onto the upload area, or click to select it. The file must be under <strong>10 MB</strong>. Click <strong>\"Import\"</strong> to start the upload."
          },
          upsert: {
            title: "Update behavior",
            description: "If a scenario with the same name already exists, it will be updated with the new content. Active sessions and flag secrets are preserved."
          }
        },

        seeding: {
          title: "Seeding & Updating Scenarios (CLI)",
          description: "Use the seed-scenario.sh script to import or update a scenario from a KillerCoda-compatible directory. This is the fastest way to bulk-load scenario content.",
          usage: {
            title: "Usage",
            description: "Run the script from the <strong>challenges/</strong> directory:",
            command: "./seed-scenario.sh &lt;scenario-dir&gt; [api-url] [auth-token]",
            example: "./seed-scenario.sh ./gameshell-basics http://localhost:8080 \"eyJhbGci...\""
          },
          token: {
            title: "Getting an Auth Token",
            description: "You need a valid JWT token. Get one by logging in via the API:",
            command: "curl -s -X POST http://localhost:8080/api/v1/auth/login -H 'Content-Type: application/json' -d '{'{'}\"email\":\"your{'@'}email.com\",\"password\":\"yourpassword\"{'}'}' | python3 -c \"import json,sys; print(json.load(sys.stdin)['access_token'])\"",
            altDescription: "Or copy it from your browser DevTools (Network tab, any API request, Authorization header)."
          },
          upsert: {
            title: "Create or Update",
            description: "The seed endpoint uses upsert logic: if a scenario with the same name already exists, it updates the content (steps, scripts, text) while preserving the flag secret so active sessions remain valid. If it doesn't exist, a new scenario is created."
          },
          envVar: {
            title: "Tip",
            description: "Set the <strong>OCF_AUTH_TOKEN</strong> environment variable to avoid passing the token every time: <code>export OCF_AUTH_TOKEN=\"eyJhbGci...\"</code>"
          }
        },

        monitoring: {
          title: "Monitoring Learner Progress",
          description: "Track how your learners are progressing through your scenarios.",
          navigate: {
            title: "View Scenario Sessions",
            description: "Navigate to <strong>Admin > Scenario Sessions</strong> to see all learner sessions across your scenarios.",
            button: "Go to Scenario Sessions"
          },
          track: {
            title: "Track Progress Details",
            description: "For each session, you can see the <strong>scenario name</strong>, the <strong>current step</strong>, the <strong>status</strong> (active, completed, or abandoned), and <strong>timestamps</strong> for when the session started and completed. Step-level details show the number of verification attempts and time spent per step."
          }
        },

        archiving: {
          title: "Retiring a scenario",
          description: "When a scenario is no longer worth running — superseded by a new edition, or simply out of date — archive it rather than deleting it. Deleting removes its assignments and leaves past results without the scenario they were earned on; archiving keeps every session, grade and flag intact.",
          effect: {
            title: "What archiving changes",
            offered: "The scenario disappears from the learner catalogue and from the assignment picker.",
            assign: "It can no longer be assigned to a group or an organization, nor started for a whole class.",
            launch: "It can no longer be launched, previewed, or resumed on a new terminal.",
            keeps: "Existing assignments stay in place, and every past session keeps its grade, its step progress and its scenario name in the class results."
          },
          running: {
            title: "Sessions already running",
            description: "A learner working through the scenario at the moment you archive it is left alone and finishes normally. Archiving stops new runs; it never interrupts one in progress."
          },
          where: {
            title: "Where to do it",
            library: "Organization scenarios: the scenario library tab, next to the export actions.",
            editor: "Your own scenarios: the scenario editor, in the ⋯ menu beside Reset.",
            restore: "Archived scenarios stay in those lists behind a \"show archived\" toggle, and Restore puts one back in service at any time."
          },
          newEdition: {
            title: "Publishing a new edition",
            description: "Duplicate the scenario, edit the copy, then archive the original. Learners get the new edition while the results earned on the old one keep pointing at it."
          }
        },

        bestPractices: {
          title: "Best Practices",
          description: "Follow these guidelines to create effective and engaging scenarios.",
          tips: {
            title: "Recommendations",
            tip1: "Start with a simple first step to build learner confidence before moving to more complex tasks.",
            tip2: "Use clear, actionable instructions — tell learners exactly what commands to run and what results to expect.",
            tip3: "Provide hints for challenging steps so learners can get unstuck without external help.",
            tip4: "Write verify scripts that check the result, not the method — there are often multiple valid approaches to a task.",
            tip5: "Set realistic estimated times based on the difficulty level and the number of steps in the scenario.",
            tip6: "Use introduction text to set context and conclusion text to summarize what was learned in the exercise."
          }
        },

        nextSteps: {
          description: "Explore more resources to get the most out of the platform."
        }
      }
    },

    bulkLicenses: {
      overview: {
        title: "Bulk License Management",
        intro: "Purchase and manage licenses in bulk for your organization. Learn about batch purchasing, license assignment, and pricing tiers.",
        whatIs: {
          title: "What are Bulk Licenses?",
          description: "Bulk licenses allow organizations to purchase multiple subscription licenses at a discounted rate and distribute them to members.",
          benefit1: "Volume discounts on license purchases",
          benefit2: "Centralized license management dashboard",
          benefit3: "Flexible assignment and reassignment",
          benefit4: "Detailed usage tracking and reporting"
        },
        purchasing: {
          title: "Purchasing Licenses",
          description: "Follow these steps to purchase licenses in bulk for your organization.",
          step1: {
            title: "Choose a Plan",
            description: "Select the subscription plan you want to purchase licenses for. Different plans offer different features."
          },
          step2: {
            title: "Select Quantity",
            description: "Choose the number of licenses you need. Volume discounts apply automatically at certain thresholds."
          },
          step3: {
            title: "Complete Payment",
            description: "Review the pricing breakdown and complete the purchase. Licenses are available immediately after payment."
          }
        },
        batchManagement: {
          title: "Batch Management",
          description: "Manage your license batches from the License Management dashboard.",
          viewBatches: "View all active and expired license batches",
          trackUsage: "Monitor how many licenses are assigned vs available",
          renewBatches: "Renew expiring batches before they expire",
          exportReports: "Export usage reports for accounting purposes"
        },
        assignment: {
          title: "License Assignment",
          description: "Assign licenses to organization members.",
          individual: "Assign licenses to individual users from the batch detail page",
          group: "Assign licenses to all members of a group at once",
          automatic: "Set up automatic assignment for new group members",
          revoke: "Revoke and reassign licenses when members leave"
        },
        pricing: {
          title: "Pricing & Tiers",
          description: "Volume pricing is available for bulk license purchases.",
          tier1: "1-10 licenses: standard pricing",
          tier2: "11-50 licenses: 10% discount",
          tier3: "51-100 licenses: 15% discount",
          tier4: "100+ licenses: contact us for custom pricing",
          note: "Pricing may vary by subscription plan. Contact sales for enterprise quotes."
        },
        nextSteps: {
          organizations: {
            title: "Organizations Overview",
            description: "Learn about organization management features"
          },
          billing: {
            title: "Billing & Payments",
            description: "Understand the billing system and payment options"
          }
        }
      }
    }
  }
};