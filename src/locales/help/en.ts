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

    contact: {
      title: "Need help?",
      text: "If you can't find what you're looking for, don't hesitate to contact us at",
      email: "contact@labinux.com"
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
        }
      },

      managingSessions: {
        title: "Managing Your Terminal Sessions",
        intro: "Learn how to effectively manage your terminal sessions, synchronize your work, and access your environments from anywhere.",

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
          title: "How to Share a Terminal",
          step1: "Create a new terminal or select an existing one",
          step2: "In terminal settings, enable sharing option",
          step3: "Add users by email or username",
          step4: "Configure access permissions (read-only, read-write, admin)",
          step5: "Share the access link with your collaborators"
        },

        permissions: {
          title: "Access Permissions",
          readOnly: {
            title: "Read-Only",
            description: "Users can view terminal content but cannot execute commands"
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

        useCases: {
          title: "Use Cases",
          teaching: {
            title: "Teaching & Training",
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
            description: "Use shared terminals for live coding demonstrations"
          }
        },

        security: {
          title: "Security & Best Practices",
          practices: {
            practice1: "Never share terminals containing sensitive information",
            practice2: "Regularly review and revoke unnecessary access",
            practice3: "Use read-only access when possible",
            practice4: "Monitor activity in shared sessions",
            practice5: "Set up automatic session expiration for temporary access"
          }
        }
      },

      troubleshooting: {
        title: "Troubleshooting",
        intro: "Solutions to common problems you might encounter with terminals.",

        commonProblems: {
          title: "Common Problems",

          connectionLost: {
            title: "Connection Lost",
            problem: "Terminal disconnects unexpectedly or won't connect",
            solutions: {
              solution1: "Check your internet connection",
              solution2: "Refresh the page and try to reconnect",
              solution3: "Clear your browser cache and cookies",
              solution4: "Try a different browser or incognito mode",
              solution5: "Contact support if the problem persists"
            }
          },

          slowPerformance: {
            title: "Slow Performance",
            problem: "Terminal responds slowly or commands take time to execute",
            solutions: {
              solution1: "Check available resources in your subscription",
              solution2: "Close unnecessary programs in the terminal",
              solution3: "Restart the terminal session",
              solution4: "Check if network latency is causing delays",
              solution5: "Consider upgrading your subscription for more resources"
            }
          },

          accessDenied: {
            title: "Access Denied",
            problem: "Cannot access a shared terminal or specific commands fail",
            solutions: {
              solution1: "Verify you have necessary permissions",
              solution2: "Check that your access hasn't expired",
              solution3: "Contact the terminal owner to verify sharing settings",
              solution4: "Ensure you're using the correct SSH key if connecting via SSH",
              solution5: "Check if your account has required subscription level"
            }
          },

          filesSyncing: {
            title: "File Synchronization Issues",
            problem: "Files don't save or synchronize properly",
            solutions: {
              solution1: "Check available storage space",
              solution2: "Verify write permissions on affected files",
              solution3: "Force save with Ctrl+S or :w in editors",
              solution4: "Check network connectivity",
              solution5: "Use git or external backup for important files"
            }
          }
        },

        prevention: {
          title: "Prevention Tips",
          tips: {
            tip1: "Save your work regularly using version control",
            tip2: "Backup important configurations and files",
            tip3: "Monitor your resource usage",
            tip4: "Keep your sessions organized and delete unused ones",
            tip5: "Use stable internet connections for important work"
          }
        },

        support: {
          title: "Getting Support",
          description: "If you can't resolve your issue with these solutions:",
          steps: {
            step1: "Document the exact error message or behavior",
            step2: "Note what you were doing when the problem occurred",
            step3: "Check your browser console for error messages",
            step4: "Contact our support team with these details"
          }
        }
      }
    },

    courses: {
      structure: {
        title: "Course Structure",
        intro: "Understanding how courses are organized and structured in the platform.",

        hierarchy: {
          title: "Course Hierarchy",
          description: "Courses follow a 4-level structure for optimal organization:",
          levels: {
            course: {
              title: "1. Course",
              description: "The main container that groups all learning content around a specific topic"
            },
            chapter: {
              title: "2. Chapter",
              description: "Major sections that divide the course into logical learning blocks"
            },
            section: {
              title: "3. Section",
              description: "Detailed subdivisions that focus on specific concepts or skills"
            },
            page: {
              title: "4. Page",
              description: "Individual content units containing text, exercises, or multimedia elements"
            }
          }
        },

        organization: {
          title: "Organization Tips",
          tips: {
            tip1: "Plan your course structure before creating content",
            tip2: "Use clear and descriptive names for each level",
            tip3: "Maintain consistent organization across all courses",
            tip4: "Group related concepts in the same chapter or section"
          }
        },

        evolution: {
          title: "System Evolution",
          notice: "The course structure system is actively being developed. New features and organization tools will be added based on user feedback and educational best practices."
        }
      },

      content: {
        title: "Content Creation",
        intro: "Best practices for creating engaging and effective educational content.",

        principles: {
          title: "Content Creation Principles",
          principle1: {
            title: "Clarity",
            description: "Use clear, simple language adapted to your audience's level"
          },
          principle2: {
            title: "Progression",
            description: "Structure content logically from simple to complex concepts"
          },
          principle3: {
            title: "Interactivity",
            description: "Include practical exercises and hands-on activities"
          },
          principle4: {
            title: "Variety",
            description: "Mix different content types to maintain engagement"
          }
        },

        writingTips: {
          title: "Writing Tips",
          tips: {
            tip1: "Start each section with clear learning objectives",
            tip2: "Use concrete examples to illustrate abstract concepts",
            tip3: "Include regular check-points and summaries",
            tip4: "Encourage active participation through questions and exercises",
            tip5: "Provide additional resources for deeper learning"
          }
        },

        futureFeatures: {
          title: "Coming Soon",
          description: "The content creation system will be enhanced with:",
          features: {
            feature1: "Rich text editor with multimedia support",
            feature2: "Interactive exercise templates",
            feature3: "Progress tracking and analytics",
            feature4: "Collaborative content creation tools",
            feature5: "Content import/export capabilities"
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