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
        description: "Learn how to create, manage and share your terminal sessions",
        gettingStarted: "Getting Started",
        managingSessions: "Managing Sessions",
        sharing: "Sharing & Collaboration",
        troubleshooting: "Troubleshooting"
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
        rolesAndPermissions: "Roles & Permissions"
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
            title: "Choose Your Configuration",
            description: "Select the type of environment you need (development, production, specific language, etc.). Each configuration comes with pre-installed tools adapted to your needs."
          },
          step3: {
            title: "Set Access Parameters",
            description: "Configure access settings: session name, sharing options, and duration. You can create private sessions or sessions shared with your team."
          },
          step4: {
            title: "Launch Your Terminal",
            description: "Once configured, launch your terminal. Initial startup may take a few moments to prepare your environment."
          }
        },

        quickAccess: {
          title: "Quick Access",
          mySessions: "View your active sessions on the \"My Sessions\" page",
          sharedSessions: "Access sessions shared with you via \"Shared with Me\"",
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
            title: "Configure your session",
            item1: "<strong>Terms of use:</strong> Accept the terms (required)",
            item2: "<strong>Expiration time:</strong> Choose how long your session will remain active (optional)"
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
            description: "Sessions you can share with colleagues or students. Useful for collaboration or teaching."
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
          sharing: {
            title: "Sharing & Collaboration",
            description: "Learn how to share your terminals with other users"
          },
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
        }
      },

      sharing: {
        title: "Sharing & Collaboration",
        intro: "Terminals can be shared with other users to facilitate collaboration, teaching, or technical support.",

        howToShare: {
          title: "How to Share a Terminal"
        },

        sharingSteps: {
          description: "Sharing terminals is done in a few simple steps:",
          step1: {
            title: "Access your sessions",
            description: "Go to <strong>Practical Work > My Sessions</strong> to see the list of your active terminal sessions.",
            button: "View my sessions"
          },
          step2: {
            title: "Configure sharing",
            description: "For each session, you can configure sharing options:",
            item1: "<strong>Enable sharing</strong> to make the session accessible",
            item2: "<strong>Add users</strong> by email or username",
            item3: "<strong>Set permissions</strong> (read-only or read-write)",
            item4: "<strong>Set access duration</strong> if necessary"
          },
          step3: {
            title: "Share the link",
            description: "Copy the <strong>sharing link</strong> and send it to authorized users. They will be able to access the terminal directly from their account."
          }
        },

        accessManagement: {
          title: "Access Management",
          description: "Precisely control who can access your terminals and what they can do.",
          readOnly: {
            description: "The user can see the terminal content and observe executed commands, but cannot interact or modify anything.",
            tag1: "👁️ Observation",
            tag2: "📋 Copy allowed",
            tag3: "🚫 No modification"
          },
          readWrite: {
            description: "The user can execute commands, modify files, and fully interact with the terminal.",
            tag1: "⌨️ Commands",
            tag2: "✏️ Modifications",
            tag3: "💾 Save"
          },
          actionsTitle: "Management actions:",
          actions: {
            manage: {
              title: "Manage users",
              description: "Add or remove users with access to your terminal"
            },
            revoke: {
              title: "Revoke access",
              description: "Immediately remove access for a specific user"
            },
            modify: {
              title: "Modify permissions",
              description: "Change access levels or sharing durations"
            }
          }
        },

        permissions: {
          title: "Access Permissions",
          readOnly: {
            title: "Read-Only",
            description: "Users can view the terminal content but cannot execute commands"
          },
          readWrite: {
            title: "Read-Write",
            description: "Users can execute commands and modify files"
          },
          admin: {
            title: "Administrator",
            description: "Full access including terminal settings and user management"
          }
        },

        accessingShared: {
          title: "Accessing Shared Terminals",
          description: "When someone shares a terminal with you, here's how to access it:",
          step1: {
            title: "Check your shares",
            description: "Go to <strong>Practical Work > Shared with Me</strong> to see all terminals you have access to.",
            button: "View shared terminals"
          },
          step2: {
            title: "Share information",
            description: "For each shared terminal, you will see:",
            item1: "<strong>The owner</strong> who shared the terminal",
            item2: "<strong>Your permissions</strong> (read-only or read-write)",
            item3: "<strong>The expiration date</strong> of access if applicable",
            item4: "<strong>The status</strong> of the session (active, stopped, expired)"
          },
          step3: {
            title: "Connect",
            description: "Click on <strong>\"Open\"</strong> to access the shared terminal in a new window."
          }
        },

        useCases: {
          title: "Use Cases",
          teaching: {
            title: "Teaching and Training",
            description: "Share terminals with students for practical exercises or live demonstrations"
          },
          collaboration: {
            title: "Team Collaboration",
            description: "Work together on the same codebase in real-time"
          },
          support: {
            title: "Technical Support",
            description: "Allow support team to access your environment to solve problems"
          },
          presentation: {
            title: "Presentations",
            description: "Use shared terminals for live programming demonstrations"
          }
        },

        commonUseCases: {
          title: "Common Use Cases",
          description: "Terminal sharing adapts to many usage scenarios:",
          teaching: {
            description: "Create <strong>guided learning environments</strong> where students can practice under supervision. Share prepared terminals with exercises and observe their progress in real-time."
          },
          support: {
            description: "Facilitate <strong>troubleshooting and technical assistance</strong> by giving temporary access to your environment. The support team can diagnose and solve problems directly."
          },
          collaboration: {
            title: "Collaborative Development",
            description: "Work as a team on the same code, in real-time, with integrated screen sharing and instant synchronization."
          },
          mentoring: {
            title: "Mentoring and Guidance",
            description: "Guide junior developers by directly showing them best practices and development techniques."
          }
        },

        securityPractices: {
          verifyIdentity: {
            title: "Verify identity",
            description: "Make sure to only share your terminals with trusted people and verify email addresses"
          },
          limitDuration: {
            title: "Limit duration",
            description: "Configure limited access durations for temporary shares"
          },
          monitorActivity: {
            title: "Monitor activity",
            description: "Keep an eye on what's happening in shared terminals with write access"
          },
          backupFirst: {
            title: "Backup first",
            description: "Make a backup copy of your important work before sharing in write mode"
          },
          revokeQuickly: {
            title: "Revoke quickly",
            description: "Remove access as soon as it's no longer needed"
          },
          respectData: {
            title: "Respect data",
            description: "Never share terminals containing sensitive or confidential information"
          }
        },

        security: {
          title: "Security and Best Practices",
          practices: {
            practice1: "Never share terminals containing sensitive information",
            practice2: "Regularly review and revoke unnecessary access",
            practice3: "Use read-only access when possible",
            practice4: "Monitor activity in shared sessions",
            practice5: "Configure automatic session expiration for temporary access"
          }
        },

        limitations: {
          title: "Limitations and Considerations",
          description: "Keep these aspects in mind when sharing terminals:",
          users: {
            title: "Number of users",
            description: "The number of users who can access a terminal simultaneously may be limited according to your subscription plan"
          },
          network: {
            title: "Network performance",
            description: "Latency may increase with multiple connected users. Favor stable connections"
          },
          sync: {
            title: "Synchronization",
            description: "Changes are synchronized in real-time but may have a slight delay depending on connection"
          },
          history: {
            title: "Command history",
            description: "All commands executed by all users are recorded in the terminal history"
          }
        },

        nextSteps: {
          managingSessions: {
            title: "Managing Sessions",
            description: "Learn to effectively manage your terminal sessions"
          },
          troubleshooting: {
            title: "Troubleshooting",
            description: "Solve common sharing and access problems"
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

        sharingProblems: {
          title: "Sharing problems",
          cannotShare: {
            title: "Cannot share a terminal",
            checksTitle: "Checks:",
            checks: {
              check1: "Is the session active?",
              check2: "Does the recipient user exist?",
              check3: "Do you have sharing permissions?"
            },
            solutionTitle: "Solution:",
            solution: "First sync your session, then retry sharing with a valid email."
          },
          cannotAccess: {
            title: "User cannot access shared terminal",
            checksTitle: "Points to check:",
            checks: {
              check1: "The share hasn't expired",
              check2: "The user is logged into their account",
              check3: "Permissions are correct",
              check4: "The source session is still active"
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
          },
          sharing: {
            title: "Sharing and collaboration",
            description: "Master sharing features"
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
        title: "Subscription & Plans",
        intro: "Manage your subscription, understand plan features, and optimize your usage.",

        overview: {
          title: "Subscription Overview",
          description: "OCF offers different subscription plans tailored to your learning and teaching needs. Each plan provides access to specific features and usage quotas.",
          individual: {
            title: "Individual Plans",
            description: "Perfect for personal learning and individual projects. Access to terminals, content creation, and basic resources."
          },
          educational: {
            title: "Educational Plans",
            description: "Designed for teachers and trainers. Advanced collaboration features and class management."
          },
          enterprise: {
            title: "Enterprise Plans",
            description: "Solutions for organizations and institutions. Priority support, customization, and advanced integrations."
          }
        },

        dashboard: {
          title: "Subscription Dashboard",
          description: "The dashboard gives you a complete view of your current subscription and usage.",
          usage: {
            title: "Usage Tracking",
            description: "Monitor your resource consumption: active terminal sessions, storage used, bandwidth, and other important metrics.",
            button: "View Dashboard"
          },
          info: {
            title: "Subscription Information",
            description: "Check details of your current plan: renewal date, included features, limits, and available quotas."
          },
          alerts: {
            title: "Alerts and Notifications",
            description: "Receive alerts when you approach your usage limits or when your subscription requires attention."
          }
        },

        planChange: {
          title: "Plan Changes",
          description: "You can modify your subscription at any time as your needs evolve.",
          step1: {
            title: "Evaluate Your Needs",
            description: "Analyze your current usage and identify the features you need to optimize your plan choice."
          },
          step2: {
            title: "Compare Plans",
            description: "Explore different available options and their benefits. Compare features, quotas, and pricing.",
            button: "View Available Plans"
          },
          step3: {
            title: "Make the Change",
            description: "Select your new plan and follow the upgrade or downgrade process according to your needs."
          },
          tips: {
            title: "Important Points to Remember:",
            upgrade: {
              title: "Upgrade",
              description: "Upgrades take effect immediately. Billing is adjusted pro-rata for the current period."
            },
            downgrade: {
              title: "Downgrade",
              description: "Changes to a lower plan generally take effect at the next billing cycle to avoid data loss."
            },
            dataProtection: {
              title: "Data Protection",
              description: "Your data and configurations are preserved during plan changes. Only quotas and available features are modified."
            }
          }
        },

        optimization: {
          title: "Usage Optimization",
          description: "Maximize the value of your subscription by adopting these best practices:",
          sessions: {
            title: "Session Management",
            description: "Close unused terminal sessions to save your quotas. Use appropriate expiration times for your sessions."
          },
          storage: {
            title: "Efficient Storage",
            description: "Regularly clean up temporary files and old projects. Use external Git repositories for large projects."
          },
          sharing: {
            title: "Smart Sharing",
            description: "Share resources with your collaborators to avoid duplication and optimize collective usage."
          },
          planning: {
            title: "Usage Planning",
            description: "Schedule intensive activities during off-peak hours and monitor your usage peaks."
          }
        },

        suspension: {
          title: "Suspension and Cancellation",
          description: "You have full control over your subscription, including the ability to temporarily suspend it or cancel it permanently.",
          pause: {
            title: "Temporary Suspension",
            description: "Put your subscription on pause for a set period. Ideal for vacations or planned periods of inactivity.",
            feature1: "Preservation of all your data",
            feature2: "Billing stopped during pause",
            feature3: "Easy resumption when you want",
            feature4: "Maximum duration according to terms"
          },
          cancel: {
            title: "Permanent Cancellation",
            description: "Cancel your subscription permanently. All data will be deleted after the grace period.",
            feature1: "Access maintained until end of paid cycle",
            feature2: "Grace period to recover data",
            feature3: "Permanent deletion after expiration",
            feature4: "Possibility of reactivation with new account"
          },
          warning: {
            title: "Important",
            description: "<strong>Back up your important data</strong> before any suspension or cancellation. Although we keep your data during a grace period, it is recommended to make local backups of your critical projects."
          }
        },

        evolution: {
          title: "Subscription System Evolution",
          notice: "<strong>The OCF subscription system is under active development.</strong> New plan options, billing features, and management tools will be regularly added to better meet your needs.",
          upcoming: {
            title: "Planned Improvements:",
            feature1: "Customizable plans with à la carte options",
            feature2: "Billing based on actual usage",
            feature3: "Team management and centralized billing",
            feature4: "Integrations with existing management systems",
            feature5: "Advanced usage analytics"
          },
          documentation: "This documentation will be updated to reflect new features as they are deployed."
        },

        support: {
          title: "Support and Assistance",
          description: "Our support team is here to help you with all your subscription questions:",
          email: {
            title: "Email Support",
            description: "For general questions about your subscription",
            button: "Contact Support"
          },
          billing: {
            title: "Billing Questions",
            description: "For payment and billing issues",
            button: "Billing Support"
          },
          optimization: {
            title: "Optimization Advice",
            description: "To optimize your usage and choose the right plan",
            button: "Request Advice"
          }
        },

        nextSteps: {
          billing: {
            title: "Billing",
            description: "Manage your payment methods and view your invoices"
          },
          dashboard: {
            title: "Dashboard",
            description: "View your current usage and plan details"
          },
          plans: {
            title: "Available Plans",
            description: "Explore and compare all subscription plans"
          }
        }
      },

      billing: {
        title: "Billing & Payments",
        intro: "Everything you need to know about billing, payments, and financial management of your account.",

        system: {
          title: "Billing System",
          description: "OCF uses an automated billing system integrated with Stripe to ensure secure payments and transparent management of your subscription.",
          recurring: {
            title: "Recurring Billing",
            description: "Subscriptions are automatically billed according to your chosen cycle (monthly or annual). You receive an invoice before each charge."
          },
          secure: {
            title: "Secure Payments",
            description: "All payments are processed via Stripe, the global leader in online payment security. Your data is protected."
          },
          transparent: {
            title: "Transparent Billing",
            description: "All charges are clearly detailed in your invoices. No hidden fees, only what you use and subscribe to."
          }
        },

        paymentMethods: {
          title: "Payment Methods",
          description: "Manage your credit cards and other payment methods to ensure continuity of your OCF service.",
          types: {
            title: "Accepted payment types:",
            visa: "Visa",
            mastercard: "Mastercard",
            amex: "American Express",
            sepa: "SEPA Transfer"
          },
          management: {
            title: "Managing your methods:",
            add: {
              title: "Add a Method",
              description: "Add a new card or backup payment method",
              button: "Manage Payments"
            },
            default: {
              title: "Default Method",
              description: "Set which method to use as priority for your invoices"
            },
            update: {
              title: "Update",
              description: "Modify information of an expired or changed card"
            }
          },
          security: {
            title: "Security Tips:",
            tip1: "Only use secure connections (HTTPS)",
            tip2: "Regularly check your bank statements",
            tip3: "Enable payment notifications",
            tip4: "Remove unused payment methods"
          }
        },

        billingAddress: {
          title: "Billing Addresses",
          description: "Configure your billing addresses to receive invoices compliant with your country's tax regulations.",
          importance: {
            title: "Why it's important:",
            fiscal: "Tax compliance according to your location",
            vat: "Correct application of VAT and local taxes",
            accounting: "Valid invoices for your accounting",
            regulations: "Compliance with international regulations"
          },
          management: {
            title: "Address Management:",
            primary: {
              title: "Primary Address",
              description: "Your default billing address"
            },
            business: {
              title: "Business Addresses",
              description: "Corporate addresses for institutional billing"
            },
            edit: {
              title: "Modification",
              description: "Update in case of relocation or change"
            },
            button: "Manage Addresses"
          }
        },

        invoices: {
          title: "Invoice Consultation",
          description: "Access all your OCF invoices, download them, and track your payment history for accounting.",
          features: {
            history: {
              title: "Complete History",
              description: "View all your invoices since the beginning of your subscription. Search by date, amount, or status."
            },
            download: {
              title: "PDF Download",
              description: "Download your invoices in PDF format for your accounting or tax returns."
            },
            details: {
              title: "Transparent Details",
              description: "Each invoice clearly details services used, billing periods, and applicable taxes."
            },
            button: "View My Invoices"
          },
          structure: {
            title: "Structure of an OCF Invoice:",
            header: "OCF information and your details",
            period: "Service and billing dates",
            detail: "Services used and rates applied",
            taxes: "VAT and local taxes according to your country",
            total: "Final amount and payment method"
          }
        },

        paymentIssues: {
          title: "Payment Issues",
          description: "If you encounter difficulties with your payments, here are the steps to quickly resolve problems.",
          declined: {
            title: "Payment Declined",
            causes: {
              title: "Common Causes:",
              insufficient: "Insufficient funds in account",
              expired: "Expired or blocked card",
              limit: "Payment limit exceeded",
              incorrect: "Incorrect information"
            },
            solutions: {
              title: "Solutions:",
              balance: "Check your account balance",
              update: "Update card information",
              bank: "Contact your bank if necessary",
              alternative: "Use an alternative payment method"
            }
          },
          retry: {
            title: "Retry",
            description1: "OCF automatically makes several payment attempts over a few days in case of initial failure.",
            description2: "You receive email notifications to inform you of the situation and allow you to correct the problem."
          },
          suspension: {
            title: "Service Suspension",
            description1: "In case of repeated payment failures, your service may be temporarily suspended to avoid accumulation of charges.",
            description2: "Your account and data remain safe during suspension. Service resumes automatically after payment."
          }
        },

        refunds: {
          title: "Refunds and Credits",
          description: "Information on refund conditions and the OCF credit system.",
          policy: {
            title: "Refund Policy:",
            trial: {
              title: "Trial Period",
              description: "Full refund possible during the first 7 days of your first subscription (normal usage conditions)."
            },
            proration: {
              title: "Pro-rata Refund",
              description: "In case of downgrade or cancellation, refund calculated on unused period."
            },
            technical: {
              title: "Technical Problems",
              description: "Credits or refunds granted in case of prolonged service interruption due to technical problems."
            }
          },
          credits: {
            title: "Credit System:",
            description1: "OCF may award credits to your account to compensate for inconveniences or as part of special promotions.",
            description2: "Credits are automatically applied to your next invoices and appear clearly in your billing history."
          }
        },

        evolution: {
          title: "Billing System Evolution",
          notice: "<strong>The OCF billing system continues to evolve</strong> to offer more flexibility and transparency in managing your payments and subscriptions.",
          upcoming: {
            title: "Improvements in Development:",
            usage: "Detailed billing by actual resource usage",
            alternatives: "Alternative payment options (crypto, transfers)",
            group: "Group billing for organizations",
            alerts: "Advanced consumption and budget alerts",
            integration: "Integration with enterprise accounting systems",
            currencies: "Local currencies and optimized international payments"
          }
        },

        support: {
          title: "Billing Support",
          description: "Our support team specializes in quickly resolving billing and payment issues.",
          email: {
            title: "Email Support",
            description: "Response within 24 hours for billing questions",
            button: "Contact Support"
          },
          priority: {
            title: "Priority Support",
            description: "Phone assistance for urgent payment issues",
            note: "Available for enterprise plans"
          },
          tips: {
            title: "For effective support, include:",
            email: "Your account email address",
            invoice: "Invoice number concerned",
            datetime: "Date and time of problem",
            screenshot: "Screenshot if applicable"
          }
        },

        resources: {
          title: "Useful Resources",
          subscription: {
            title: "Subscription Management",
            description: "Understand and optimize your OCF plan"
          },
          paymentMethods: {
            title: "Payment Methods",
            description: "Add and manage your cards and accounts"
          },
          invoices: {
            title: "My Invoices",
            description: "View and download your invoices"
          },
          addresses: {
            title: "Billing Addresses",
            description: "Configure your billing information"
          }
        }
      },

      rolesAndPermissions: {
        title: "Roles & Permissions",
        intro: "Understand organization roles and what each role can do."
      }
    }
  }
};