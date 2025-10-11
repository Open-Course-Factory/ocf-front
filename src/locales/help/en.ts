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
        billing: "Billing & Payments"
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

        sharingSteps: {
          title: "Share a Terminal",
          description: "To share one of your active sessions with another user:",
          step1: {
            title: "Access the session list",
            description: "Go to <strong>Practical Work > My Sessions</strong> to see your active sessions.",
            button: "View my sessions"
          },
          step2: {
            title: "Configure sharing",
            description: "For the session you want to share, several options are available:",
            item1: "<strong>Read access:</strong> The user can view but not interact with the terminal",
            item2: "<strong>Write access:</strong> The user can execute commands and modify files",
            item3: "<strong>Administrator access:</strong> Full control of the session, including sharing management",
            item4: "<strong>Access duration:</strong> You can limit sharing to a specific period"
          },
          step3: {
            title: "Share the link",
            description: "Once configured, send the sharing link to the authorized user. They will be able to access the terminal according to the permissions you have defined."
          }
        },

        accessManagement: {
          title: "Access Management",
          description: "You have complete control over who accesses your terminals and what they can do.",
          readOnly: {
            title: "Read-Only Access",
            description: "This type of access is ideal for:",
            tag1: "Code demonstrations",
            tag2: "Teaching sessions",
            tag3: "Progress monitoring"
          },
          readWrite: {
            title: "Read-Write Access",
            description: "This access allows full interaction and is recommended for:",
            tag1: "Active collaboration",
            tag2: "Technical support",
            tag3: "Practical work"
          },
          actionsTitle: "Access Management Actions",
          actions: {
            manage: "Manage active shares",
            revoke: "Instantly revoke access if needed",
            modify: "Modify permissions without revoking access"
          }
        },

        accessingShared: {
          title: "Access Shared Terminals",
          description: "When someone shares a terminal with you:",
          step1: {
            title: "Access the shared section",
            description: "Navigate to <strong>Practical Work > Shared with Me</strong> to see all sessions shared with you.",
            button: "View shared sessions"
          },
          step2: {
            title: "Check your permissions",
            description: "Before accessing a shared terminal, check:",
            item1: "<strong>Your access level:</strong> Do you have read or read-write permissions?",
            item2: "<strong>Expiration:</strong> How long will you have access to this terminal?",
            item3: "<strong>Session owner:</strong> Who shared this terminal with you?",
            item4: "<strong>Session status:</strong> Is the terminal active and functional?"
          },
          step3: {
            title: "Respect permissions",
            description: "Use the terminal according to permissions granted to you. Don't try to execute actions not authorized by your access level."
          }
        },

        commonUseCases: {
          title: "Common Use Cases",
          description: "Sharing is particularly useful for:",
          teaching: {
            title: "Teaching",
            description: "Share terminals with students for practical exercises, live demonstrations, or guided labs."
          },
          support: {
            title: "Technical Support",
            description: "Facilitate problem solving by giving temporary access to a support team member."
          },
          collaboration: {
            title: "Pair Programming",
            description: "Work collaboratively on the same code with colleagues in real-time."
          },
          mentoring: {
            title: "Mentoring",
            description: "Observe a learner's progress by accessing their environment with appropriate permission."
          }
        },

        securityPractices: {
          title: "Security Best Practices",
          description: "For secure and optimal use of terminal sharing:",
          verifyIdentity: {
            title: "Verify Identity",
            description: "Always ensure you're sharing with the right person before granting access."
          },
          limitDuration: {
            title: "Limit Duration",
            description: "Set time limits on shares to minimize security risks."
          },
          monitorActivity: {
            title: "Monitor Activity",
            description: "Regularly check actions taken in your shared terminals."
          },
          backupFirst: {
            title: "Backup Your Data",
            description: "Before sharing a session with write access, ensure you have recent backups of your work."
          },
          revokeQuickly: {
            title: "Revoke When Done",
            description: "Remove access as soon as the collaboration or support is complete."
          },
          respectData: {
            title: "Respect Shared Data",
            description: "When you have access to someone's terminal, respect their files and configurations."
          }
        },

        limitations: {
          title: "Limitations and Considerations",
          description: "Some aspects to consider when using sharing:",
          users: {
            title: "Number of Users",
            description: "Depending on your subscription, the number of simultaneous shares may be limited."
          },
          network: {
            title: "Network Performance",
            description: "Multiple users on the same session can affect responsiveness depending on available bandwidth."
          },
          sync: {
            title: "Synchronization",
            description: "Commands and changes may take a few moments to synchronize between different users."
          },
          history: {
            title: "Command History",
            description: "The command history is shared between all users of the same session, which can be useful for tracking work but requires additional caution."
          }
        },

        nextSteps: {
          managingSessions: "Managing Sessions",
          troubleshooting: "Troubleshooting"
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

        dashboard: {
          title: "Subscription Dashboard",
          description: "Your subscription dashboard provides a complete overview of:",
          features: {
            currentPlan: "Your current plan and its benefits",
            usage: "Resource usage and limits",
            renewalDate: "Next renewal date and amount",
            invoiceHistory: "Invoice and payment history",
            planComparison: "Available plans and upgrade options"
          }
        },

        planChanges: {
          title: "Changing Plans",
          upgrade: {
            title: "Upgrading",
            description: "Upgrade to a higher plan at any time. Changes take effect immediately and you'll be charged the prorated difference."
          },
          downgrade: {
            title: "Downgrading",
            description: "Downgrades take effect at the next renewal date to avoid loss of paid features."
          },
          cancellation: {
            title: "Cancellation",
            description: "Cancel anytime through the billing portal. Access continues until the end of your billing period."
          }
        },

        billingPortal: {
          title: "Billing Portal",
          description: "Access Stripe's secure billing portal to:",
          actions: {
            action1: "Update payment methods",
            action2: "Download invoices",
            action3: "Change billing address",
            action4: "Manage subscription settings",
            action5: "View payment history"
          }
        },

        optimization: {
          title: "Usage Optimization",
          tips: {
            tip1: "Monitor your resource usage regularly",
            tip2: "Close unused terminal sessions to save resources",
            tip3: "Choose the plan that best fits your actual usage",
            tip4: "Take advantage of educational discounts if eligible",
            tip5: "Contact support for custom enterprise solutions"
          }
        }
      },

      billing: {
        title: "Billing & Payments",
        intro: "Everything you need to know about billing, payments, and financial management of your account.",

        paymentMethods: {
          title: "Payment Methods",
          description: "Manage your payment methods securely:",
          actions: {
            add: "Add new credit/debit cards",
            update: "Update expiration dates and billing information",
            default: "Set default payment method",
            remove: "Remove unused payment methods",
            security: "All payment data is securely stored by Stripe"
          }
        },

        billingAddress: {
          title: "Billing Addresses",
          description: "Maintain accurate billing information:",
          importance: {
            importance1: "Required for invoice generation",
            importance2: "Needed for tax calculations",
            importance3: "Used for payment verification",
            importance4: "Important for compliance with local regulations"
          }
        },

        invoices: {
          title: "Invoice Management",
          description: "Access and manage your invoices:",
          features: {
            view: "View all past and current invoices",
            download: "Download invoices in PDF format",
            details: "See detailed breakdowns of charges",
            history: "Complete payment history",
            support: "Invoice-related support and questions"
          }
        },

        billing: {
          title: "Billing Cycle",
          monthly: {
            title: "Monthly Billing",
            description: "Charged on the same date each month"
          },
          annual: {
            title: "Annual Billing",
            description: "Charged yearly with potential savings"
          },
          proration: {
            title: "Prorated Charges",
            description: "Plan changes are prorated based on remaining time in billing cycle"
          }
        },

        support: {
          title: "Billing Support",
          description: "For billing questions or issues:",
          contact: {
            email: "Contact our billing support",
            portal: "Use the billing portal for self-service",
            documentation: "Consult this documentation for common questions",
            response: "We respond to billing inquiries within 24 hours"
          }
        }
      }
    }
  }
};