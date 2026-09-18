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
      backToHelp: "Back to Help Center",
      nextSteps: "Next Steps"
    },

    terminals: {
      gettingStarted: {
        title: "Getting started with terminals",
        intro: "A terminal session is a real Linux machine that runs in your browser. Nothing to install: pick an environment, a size, click Create, and you are at a shell prompt about thirty seconds later.",
        what: {
          title: "What you get",
          description: "Each session is an isolated container with its own disk, its own root account and, if your plan allows it, its own internet access. It lives for a fixed duration shown as a countdown in the session header, then it is stopped and its resources are freed."
        },
        open: {
          title: "Open the session composer",
          description: "In the left menu, open Terminals and click Create a session. Everything happens on this one page: the environment, the size, the options and the Create button.",
          button: "Create a session",
          shot: "The session composer: environment cards, remaining resources, size pills, then Advanced options, My usage and the Create button."
        },
        environment: {
          title: "1. Choose an environment",
          description: "The cards at the top are the distributions available to you: Alpine, Debian, Ubuntu, GameShell, and any image your organisation provides. Click one to select it. The description under the name says what is inside.",
          dedicated: "A small server badge in the corner of a card marks an environment that only exists on one server; it behaves exactly like the others."
        },
        size: {
          title: "2. Choose a size",
          description: "The Resources strip lists the sizes, from XS to XL. Hover a pill to see its vCPU and RAM. A star marks the size recommended for the environment you picked; it is selected for you when you can launch it, otherwise the largest size you can launch is.",
          budget: "Above the pills, two lines tell you what you can still launch: your remaining vCPU and RAM, and the same figure expressed in sessions, for example \"1 XL or 1 L or 2 M\". The ×n badge on each pill is how many sessions of that size you could start right now. Your plan gives you a shared budget of CPU and RAM, not a fixed number of sessions: a big session uses the budget of several small ones.",
          locked: "A padlock on a pill means the size is not included in your plan; hover it for the reason. On a personal plan you can still click it to read its specs, and the Unlock more power link takes you to the plans page.",
          seat: "If you use a seat assigned by your organisation or your class, the sizes your plan does not cover are simply not shown.",
          useCases: {
            title: "What each size is for",
            xs: "XS — light practice, basic command line",
            s: "S — standard exercises",
            m: "M — a development environment",
            l: "L — several services, Docker",
            xl: "XL — heavy workloads, clusters"
          }
        },
        features: {
          title: "3. Additional options",
          description: "Some environments offer extra features once a size is selected, shown as chips under the sizes (for example Docker). Tick the ones you need. A padlocked chip is not available in your plan or needs a bigger size; hover it to know which."
        },
        advanced: {
          title: "4. Advanced options (optional)",
          description: "The Advanced options block is folded by default. You can create a session without ever opening it. Inside:",
          name: "Terminal name — how the session appears in your list. Left empty, it becomes environment-size-date, for example debian-m-260918.",
          hostname: "Hostname — the name shown in the prompt (root{'@'}hostname). Lowercase letters, digits and hyphens.",
          exerciseRef: "Exercise reference — a free tag such as \"Lab 3 - Docker basics\", kept with the session and visible in your command history exports.",
          packages: "Startup packages — a comma-separated list installed when the terminal starts, on top of what the image already has. It needs internet access to be on.",
          network: "Internet access — On or Off. It is On by default when your plan includes it; without it the terminal cannot download packages or clone repositories. When your plan does not include it the choice is locked on Off.",
          persistence: "Save my work between sessions — shown only if your plan allows persistent sessions. Discard when done: the container is removed shortly after it stops. Keep my work: the disk is preserved so you can resume the session later."
        },
        create: {
          title: "5. Create the session",
          description: "The badge at the top right of the panel reads Ready to launch once an environment and a size are selected. Click Create a session. A progress bar shows the request, then the session view opens.",
          recording: "The very first time you create a session, a Command recording dialog explains that the commands you type are recorded, that trainers and administrators can read them, and that you can export or delete this history at any time. Do not type passwords or tokens in a terminal. Click I understand: the dialog does not come back."
        },
        session: {
          title: "The session view",
          description: "This is where you work. The terminal takes the whole width; click in it and type.",
          shot: "A running session: the recording banner, the header with the connection status, the internet indicator, the remaining time and the Destroy button, then the command history panel.",
          header: "The header shows the session name, the connection status (Connected, Connecting, Disconnected), a globe when internet access is on, a Ports chip on sessions with internet access (see the Public URL for a port page), and the time left.",
          banner: "The blue banner reminds you that commands are recorded; Learn more opens the privacy policy. Got it hides it for good.",
          stop: "Stop — only on sessions created with Keep my work. It stops the container and keeps its disk; you resume it later from My sessions.",
          destroy: "Destroy — ends the session for good. The container, its disk and its command history are deleted after a confirmation.",
          history: "Command history — the panel under the terminal lists what you typed, as it is recorded. It stays readable after the session ends."
        },
        expiry: {
          title: "When time runs out",
          description: "The countdown in the header turns from blue to orange to red, and a notification warns you three times:",
          tenMin: "10 minutes left — informational.",
          fiveMin: "5 minutes left — save your work.",
          oneMin: "Less than a minute left.",
          ended: "When the session has expired, the terminal is replaced by a message and the command history stays available below it. Start a new session from Terminals › Create a session."
        },
        nextSteps: {
          managing: "See your sessions, resume, stop and destroy them, and read your usage.",
          troubleshooting: "What to do when a session will not start or the terminal stays black.",
          scenarios: "Guided, step-by-step exercises on top of a terminal."
        }
      },

      managingSessions: {
        title: "Managing your sessions",
        intro: "The My sessions page lists every terminal you own, running or not, and is where you resume, stop, destroy or share one. The My usage panel tells you how much of your plan is in use.",
        list: {
          title: "The My sessions page",
          description: "Open Terminals › My sessions. Running sessions come first under Active sessions; stopped and expired ones are folded under Inactive sessions.",
          shot: "My sessions: one active session with its name, environment, size, internet indicator, creation date and action buttons; inactive sessions are folded below.",
          sync: "Sync all asks the terminal server for the real state of every session and updates the list. Use it when a card looks wrong.",
          newSession: "New session opens the session composer.",
          hide: "Hide all inactive removes ended sessions from the page; Show hidden brings them back. Hiding is cosmetic: nothing is deleted.",
          classView: "If you manage a class, the My sessions selector lets you view your learners' sessions. That view is read-only; supervision happens from the class page."
        },
        card: {
          title: "What a session card shows",
          description: "Each card is one session. From left to right:",
          name: "The name, with a pencil to rename it in place.",
          meta: "The environment, the size (XS…XL), a globe or a crossed circle for internet access on or off, and the expiry date for a running session.",
          state: "A state badge: Running, Stopped or Deleted. A stopped persistent session also shows Auto-deletes in … : how long its disk is kept before it is removed for good.",
          actions: {
            title: "Action buttons",
            open: "Screen icon — open the session in the page, with the command history. Available for running and stopped sessions.",
            popup: "External-link icon — open the terminal alone in a new tab. Running sessions only.",
            resume: "Play — resume a stopped session, disk and history intact.",
            stop: "Stop — stop a running session and keep its disk. The button is greyed on an ephemeral session, with a tooltip saying why: there is no disk to keep, use Destroy.",
            destroy: "Trash — destroy the session after a confirmation. The disk and the command history are lost.",
            more: "The ⋮ menu of a running session offers Copy link, Copy iframe code (to embed the terminal in a page of yours) and Sync."
          }
        },
        lifecycle: {
          title: "Ephemeral or persistent",
          description: "The choice is made when you create the session, in Advanced options › Save my work between sessions, and it decides what Stop means.",
          ephemeral: "Ephemeral (Discard when done) — the default. The container is removed shortly after the session ends, whether you destroyed it or it expired. Nothing is kept except the command history.",
          persistent: "Persistent (Keep my work) — needs a plan that allows it. Stop keeps the disk; the card shows Stopped with a countdown, and Resume brings the same machine back with your files. When the countdown reaches zero the session is deleted like any other.",
          expired: "Both modes have a time limit, with warnings at 10, 5 and 1 minutes. When it is reached, an ephemeral session expires and only its command history remains; a persistent session is auto-stopped, its disk kept, and the card's date reads Auto-stops on rather than Expires on."
        },
        usage: {
          title: "The My usage panel",
          description: "On the Create a session page, the My usage block (folded, with a badge counting your running sessions) shows what your plan gives you and what is left. The refresh icon reloads it.",
          plan: "Plan — the name of the plan in effect and where it comes from: personal, or provided by your organisation.",
          capacity: "Capacity — the total CPU and RAM of the plan, and the maximum duration of a session.",
          remaining: "Remaining capacity — the same budget expressed in sessions, for example \"≈ 1 XL or 2 L or 4 M\". Every running session, whatever its size, is taken from this one shared budget. If it reads No capacity left, stop or destroy a session to free some.",
          bars: "CPU and RAM bars — used versus total, and the list of the sessions that count, with their size and state (running or paused).",
          composer: "The same information appears in short form in the composer itself: the remaining vCPU and RAM line, the \"You can spawn …\" line and the ×n badges on the size pills. If capacity cannot be computed right now, the panel says so rather than showing a wrong number; you can still start a session."
        },
        history: {
          title: "Command history",
          description: "Everything you type in a terminal is recorded: for security, and so a trainer can follow your work. The Command history panel, under the terminal in the session view, is your copy of it.",
          filter: "Filter the list, sort newest or oldest first, click a command to paste it back into a running terminal, or copy it to the clipboard.",
          export: "Export as CSV or Export as JSON downloads the history of the session; the exercise reference you gave in Advanced options is included.",
          delete: "Delete all removes the recorded commands of the session after a confirmation. This cannot be undone."
        },
        nextSteps: {
          gettingStarted: "Create a session: environment, size, options.",
          troubleshooting: "A session that will not start, a black terminal, a greyed button.",
          scenarios: "Launch a guided exercise on top of a terminal."
        }
      },

      troubleshooting: {
        title: "Terminal troubleshooting",
        intro: "The most common problems, what they mean, and what to do. Each item names the exact message or state you see on screen.",
        cannotCreate: {
          title: "The session will not start",
          budget: {
            title: "\"You've reached your plan's session limit\"",
            description: "Your running sessions already use the whole CPU and RAM budget of your plan. The message tells you what you can still launch, if anything. Stop or destroy a session from My sessions, or pick a smaller size. Remember that a persistent session in the Stopped state does not count."
          },
          locked: {
            title: "A size or an option shows a padlock",
            description: "It is not included in your plan, or the environment needs a bigger size. Hover the pill or the chip for the reason. On a personal plan, Unlock more power leads to the plans page; on a seat provided by an organisation, ask the person who manages your class or organisation."
          },
          capacity: {
            title: "\"Server at capacity\" or \"Tight capacity — launch not guaranteed\"",
            description: "The terminal server itself is short of resources; it is not about your plan. The capacity badge at the top right of the composer turns orange or red. Try again in a few minutes or choose a smaller size."
          },
          offline: {
            title: "\"Server … is offline\" or \"No environments available\"",
            description: "The server hosting the environments does not answer. Click Retry in the composer; if the list stays empty, contact your administrator."
          },
          persistence: {
            title: "\"Persistent sessions are not available on your current plan\"",
            description: "Choose Discard when done in Advanced options, or move to a plan that allows persistent sessions."
          }
        },
        blackScreen: {
          title: "The terminal stays black or says Disconnected",
          description: "The session exists but the browser cannot keep its connection to it.",
          steps: {
            reconnect: "Click Reconnect in the terminal header; if the status goes back to Connected, you are done.",
            blockers: "Disable ad blockers or privacy extensions for this site: they can cut the WebSocket the terminal relies on.",
            reload: "Reload the page. Your session is unchanged: it lives on the server, not in the tab.",
            expired: "Check the countdown. A session past its time shows \"This session has expired\" instead of a prompt; start a new one."
          }
        },
        keyboard: {
          title: "Typing does nothing or produces the wrong characters",
          description: "Click inside the black area first: the terminal only receives keys when it has the focus. If it still ignores you, check that the header reads Connected, and reload the page if it does not."
        },
        shell: {
          title: "\"The terminal shell could not start\"",
          description: "The container image lacks the shell the platform expects, or it is not executable. This is an image problem, not yours: report it to your administrator with the environment name."
        },
        stopGreyed: {
          title: "The Stop button is greyed",
          description: "The session is ephemeral: there is no disk to keep, so Stop makes no sense. Use Destroy (the trash icon) to end it. To be able to stop and resume, create your next session with Keep my work in Advanced options."
        },
        packages: {
          title: "Startup packages are ignored or the field is locked",
          description: "Installing packages needs internet access. Set Internet access to Allow internet in Advanced options; if that choice is locked, your plan does not include it."
        },
        wrongState: {
          title: "A card shows the wrong state",
          description: "The list is a cached view. Click Sync all on My sessions, or Sync in the ⋮ menu of the card, to fetch the real state from the terminal server."
        },
        support: {
          title: "Asking for help",
          description: "If none of this works, use the Feedback button at the bottom right of every page, or contact your trainer or administrator. Give them:",
          items: {
            session: "the session ID shown under the terminal (Session: …),",
            when: "what you did and the exact message on screen,",
            browser: "your browser and operating system."
          }
        },
        nextSteps: {
          gettingStarted: "How a session is created, step by step.",
          managing: "The My sessions page and the My usage panel."
        }
      },

      sshKeys: {
        title: "SSH keys and terminal access key",
        intro: "Terminal sessions need no key from you: they open in the browser and your access key is created with your account. This page explains the two key-related settings you may still meet.",
        terminalKey: {
          title: "Your terminal access key",
          description: "The platform identifies you to the terminal server with an access key. It is generated automatically when your account is created (and again, if it is missing, when a trainer launches a scenario for your class). You never have to type it.",
          page: "Settings › Terminal access keys shows the key's name, status and creation date. Regenerate key replaces it after a confirmation; only do it if an administrator asks you to, or if the page says No terminal key found."
        },
        sshKeys: {
          title: "SSH keys",
          description: "Settings › SSH keys stores private SSH keys under a name. They are not used to open terminal sessions on the platform. The page only exists when your administrator has enabled the feature.",
          shot: "The SSH keys settings page, empty, with the Add an SSH key button.",
          add: "Add an SSH key — give it a name and paste the private key (the text starting with -----BEGIN OPENSSH PRIVATE KEY-----). It is encrypted before being stored; the platform never shows it again.",
          edit: "The pencil renames a key; you cannot change its content, add a new one instead.",
          delete: "The trash deletes a key after a confirmation."
        },
        nextSteps: {
          gettingStarted: "Create your first session, no key required.",
          settings: "The other settings pages: navigation, language, interface, notifications, security."
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
        groupMemberPerm2: "Use the organisation plan or the license assigned to them",
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
        title: "Organizations",
        intro: "An organization is where a trainer, a school or a training organization gathers its people: members and their roles, classes, a scenario library, and one plan everyone works under. Your personal space is one too — the one you got with your account.",
        types: {
          title: "Personal or team",
          description: "Every account has a personal organization; teaching needs a team one.",
          personal: {
            title: "Personal organization",
            description: "Created with your account, for you alone. It carries your own plan (Découverte, Solo, Formateur) and your own terminals and scenarios. It never holds a class."
          },
          team: {
            title: "Team organization",
            description: "Members with roles, classes, bulk import, a scenario library, and every member's terminal sessions in one place. Sized at creation: a maximum number of groups and of members."
          },
          caption: "The Organizations page: the personal organization on the left, a team organization with its plan and its Import / Manage / View buttons on the right.",
          compare: "\"Show comparison\" on the Organizations page lays the two side by side."
        },
        switcher: {
          title: "Working in one organization at a time",
          description: "The whole application follows the organization you are in: \"My classes\" lists its classes, the scenario catalogue shows what is assigned or shared there, and the terminal sizes offered come from its plan.",
          how: "To change: open the menu under your name, top right. The Organization section shows the current one and, when you belong to several, \"Switch organization\"."
        },
        creating: {
          title: "Creating a team organization",
          description: "Creating an organization takes a plan that covers teaching — Formateur, or a School / training-organization plan. On another plan, the form is refused with a message pointing to the Formateur plan.",
          step1: {
            title: "Click \"Create an organization\"",
            description: "On the Organizations page — top right, or in the \"Run a classroom\" banner. \"My classes\" offers the same button while you are in your personal space."
          },
          step2: {
            title: "Fill in the form",
            description: "A name (the identifier: lowercase letters, digits and hyphens), a display name, a description, and the limits: maximum groups and maximum members."
          },
          step3: {
            title: "Open it and bring people in",
            description: "\"Manage\" on its card opens the organization page. Add members one by one, or import a whole cohort by CSV (guide below)."
          },
          button: "Open Organizations"
        },
        page: {
          title: "The organization page",
          description: "\"Manage\" on a card opens the organization on seven tabs:",
          caption: "An organization's page: its members and groups in the header, and the tabs from Overview to Settings.",
          overview: "<strong>Overview</strong> — identity (name, display name, type, status) and the limits: maximum and current groups and members.",
          members: "<strong>Members</strong> — who is in the organization and with which role (below).",
          groups: "<strong>Groups</strong> — the classes of the organization.",
          scenarios: "<strong>Scenarios</strong> — the organization's library: scenarios created or imported here, available to every class.",
          sessions: "<strong>Learner sessions</strong> — every member's terminal sessions: learner, name, status, created and expiry dates. Searchable, filterable by status.",
          subscription: "<strong>Subscription</strong> — the plan the organization runs under (below).",
          settings: "<strong>Settings</strong> — converting a personal organization to a team one, the data retention delay, and deletion (owner only)."
        },
        members: {
          title: "Members and roles",
          description: "\"Add member\" on the Members tab finds an existing account by name or email and gives it a role. The roles, from least to most:",
          member: "<strong>Member</strong> — a learner. Works in the organization, follows assigned scenarios, sees no administration.",
          teacher: "<strong>Trainer</strong> — may create and run classes: assign scenarios, follow learners live, read results.",
          manager: "<strong>Manager</strong> — a trainer who also administers the organization: members and their roles, bulk imports, password regeneration.",
          owner: "<strong>Owner</strong> — everything, plus the retention delay and deleting the organization.",
          offboarding: "A member marked as left when a class was archived shows as \"Offboarded\" with the date their account will be erased. \"Reinstate\" cancels it; \"Erase now\" does not wait for the date. Adding them again by email reinstates them too."
        },
        plans: {
          title: "Which plan an organization runs under",
          inherited: "<strong>By default, a team organization holds no plan of its own</strong>: it uses the plan of whoever is working in it. A trainer subscribes to Formateur personally, and the organizations they own follow — the card reads \"Inherited\". Nothing is bought for the organization itself.",
          dedicated: "<strong>Schools and training organizations get a dedicated plan</strong>, set up by the platform team on a quote — the card reads \"Own plan\". Members then work under that plan whatever they hold personally.",
          roles: "Within an organization with its own plan, the platform team can map a role to a plan: learners (members) then run on a learner seat plan while trainers keep the full plan.",
          seats: "Learner seats can also be bought as packs and assigned one by one — see Bulk licenses."
        },
        nextSteps: {
          classes: {
            title: "What a class is",
            description: "Teaching inside the organization"
          },
          bulkImport: {
            title: "Bulk import",
            description: "Accounts, groups and memberships from CSV files"
          },
          roles: {
            title: "Roles & permissions",
            description: "What each role can do, in detail"
          }
        }
      },

      groups: {
        title: "Groups and hierarchy",
        intro: "A class is a group: same object, same pages. The Groups menu is the organization-wide view of them, next to \"My classes\", which is the console of the ones you teach.",
        classes: {
          title: "For teaching, use \"My classes\"",
          description: "Creating a class, adding learners, assigning scenarios, following the class live, reading results and archiving are all done from \"My classes\" and the five pages of a class. Those guides are in the Classes section.",
          button: "The Classes section"
        },
        list: {
          title: "The Groups page",
          description: "Groups in the menu lists every group of the current organization — including the ones you do not teach — as cards:",
          card: "A card shows the state (active, archived, expired or full), the member count, the organization and the parent group. For a class you teach, it also shows how many learners are connected.",
          open: "Clicking a card opens the class on its Live page.",
          scope: "The list follows the organization you are in; switch organization to see another one's groups.",
          access: "The page is available to the Trainer, Manager and Owner roles, on a plan that covers teaching."
        },
        hierarchy: {
          title: "The group hierarchy",
          description: "\"Group hierarchy\" in the same menu draws the tree: organization, groups, sub-groups.",
          tree: "Expand or collapse everything, search a group by name, and tick \"Show archived\" to include closed classes.",
          counts: "Each group shows its direct members and its total including sub-groups.",
          move: "Drag a group onto another to move it under that parent. Organizations themselves cannot be moved.",
          details: "\"View details\" opens the group's pages."
        },
        subgroups: {
          title: "Sub-groups",
          description: "A sub-group is created from the Settings page of a class (\"Add sub-group\") or by picking a parent group in the class form. It is a class in its own right, and its members are also listed in the parent class, badged with its name."
        },
        nextSteps: {
          overview: {
            title: "What a class is",
            description: "The console and the five pages of a class"
          },
          settings: {
            title: "Settings and archiving",
            description: "Sub-groups, limits, closing a class"
          }
        }
      },

      bulkImport: {
        title: "Bulk import",
        intro: "Create the accounts, the classes and the memberships of a whole cohort from CSV files. Nothing is written before you have seen what the import will do.",
        where: {
          title: "Where and who",
          description: "From the organization page, \"Bulk import\" — or \"Import\" on the organization's card. The import is for managers and owners of the organization.",
          caption: "The bulk import page: three drop zones, then the options."
        },
        files: {
          title: "The three files",
          description: "\"Download examples\" gives you a template of each. Comma, semicolon and tab separators are all detected.",
          users: {
            title: "Users CSV (required)",
            description: "One line per person. Required: <code>email</code> and <code>name</code> — or <code>first_name</code> and <code>last_name</code>. Optional: <code>password</code> (generated when missing — the person must change it at first login), <code>role</code> (leave it empty), <code>external_id</code> (your own identifier, e.g. a student number)."
          },
          groups: {
            title: "Groups CSV (optional)",
            description: "One line per class to create: <code>group_name</code> (identifier), <code>display_name</code>, <code>description</code>, <code>parent_group</code> (for a sub-group), <code>max_members</code>, <code>expires_at</code>, <code>external_id</code>."
          },
          memberships: {
            title: "Memberships CSV (optional)",
            description: "Who goes where: <code>user_email</code>, <code>group_name</code>, <code>role</code> — <code>member</code> for a learner, <code>teacher</code>, <code>manager</code> or <code>owner</code> for staff."
          },
          nameSplit: "A single <code>name</code> column is split into first and last name. Open the preview of the users file (the eye on the drop zone) to check and adjust the cut for each line."
        },
        options: {
          title: "The options",
          update: "<strong>Update existing users if found</strong> — an email already known is updated instead of skipped.",
          verified: "<strong>Mark imported email addresses as verified</strong> — ticked by default: the organization vouches for the addresses, learners log in at once. Untick to make each learner confirm their address by email first.",
          target: "<strong>Target group</strong> — every imported user is added to this class, on top of the memberships file. The simplest way to fill one class."
        },
        run: {
          title: "Validate, then import",
          step1: {
            title: "\"Validate & Import\"",
            description: "The files are parsed and the whole import is simulated. Nothing is written yet."
          },
          step2: {
            title: "Read the summary",
            description: "How many users will be created, updated or skipped, how many groups and memberships, then the warnings and the errors with their row and field. On errors, \"Back\", fix the file, and validate again."
          },
          step3: {
            title: "\"Proceed with import\"",
            description: "The import runs; do not close the window. The result screen gives the counts and, if some rows failed, the errors."
          },
          step4: {
            title: "Download the credentials",
            description: "When passwords were generated, the result screen offers a CSV of them. It is the only time they are shown: download it before closing. Later, passwords can be regenerated for selected learners from the Learners page of a class — by a manager or owner of the organization."
          }
        },
        nextSteps: {
          classes: {
            title: "Adding learners",
            description: "The class-side view of the same steps"
          },
          overview: {
            title: "Organizations",
            description: "Members, roles and plans"
          }
        }
      },

      bulkLicenses: {
        title: "Bulk licenses",
        intro: "Learner seats bought in packs, then assigned one by one to the people who need them. For trainers whose learners are not covered by an organization plan.",
        what: {
          title: "What a seat is",
          description: "A seat gives one learner a plan of their own for a period — a number of days, or a month — so they can run terminals and scenarios within that plan's limits. Seats are bought in a batch; a batch is then assigned, added to, or cancelled.",
          eligibility: "Buying seats requires a plan that allows it (Formateur). On another plan the page says \"Your plan does not allow buying seats for learners\"."
        },
        purchase: {
          title: "Buying a batch",
          description: "\"Purchase licenses\" in the Subscription menu, or \"Purchase more licenses\" from the license management page.",
          step1: {
            title: "Describe your class",
            description: "How many learners, and for how long: 1 to 10 days, or one month."
          },
          step2: {
            title: "Compare what it costs",
            description: "Every seat product that fits is quoted — total, quantity in seat-months or learner-days, and price per learner. When several apply, the cheapest is marked. Pick one."
          },
          step3: {
            title: "Options, then confirm",
            description: "Optionally link the batch to a class and enter a coupon code. The summary recaps plan, quantity and class; \"Complete purchase\" goes to payment. Your email address must be verified to buy."
          },
          after: "After payment you land on license management while the seats are provisioned — a few seconds. If they take longer, the page says so; no action is needed."
        },
        manage: {
          title: "Managing a batch",
          description: "\"Manage licenses\" in the Subscription menu lists your batches: plan, total, assigned, available, utilization, renewal date, status.",
          batch: "<strong>View details</strong> opens the batch: its seats, filterable (all, assigned only, available only) and searchable.",
          assign: "<strong>Assign license</strong> — search a user by name or email and give them a seat. It takes effect at once.",
          revoke: "<strong>Revoke</strong> — takes a seat back: the learner loses access immediately and the seat becomes available again. Several can be revoked at once.",
          add: "<strong>Add more</strong> — grows the batch.",
          delete: "<strong>Delete</strong> — removes available seats from the batch (revoke assigned ones first); a prorated credit may follow. A cancelled batch can be deleted permanently from the list."
        },
        nextSteps: {
          organizations: {
            title: "Organizations",
            description: "When an organization plan covers learners instead"
          },
          subscription: {
            title: "Subscription & plans",
            description: "Your own plan and what it allows"
          }
        }
      }
    },

    scenarios: {
      gettingStarted: {
        title: "Getting started with scenarios",
        intro: "A scenario is a guided exercise: a real Linux machine on one side, instructions on the other, and a Verify button that checks your work step after step. This page follows a scenario from the catalogue to your history.",
        catalogue: {
          title: "The Scenarios catalogue",
          description: "Open Scenarios › Scenarios. Each card is a scenario you can run: the ones assigned to you by your class or organisation, and public ones. The search box filters by title.",
          shot: "The catalogue: three scenario cards with their difficulty, duration, image and size badges, and a Launch button on each.",
          card: "A card shows the difficulty (Beginner, Intermediate, Advanced), the estimated duration, the image it runs on and the machine size it needs. Hover a badge for details.",
          language: "A scenario offered in several languages shows a Language selector above its button. Choose before launching: the machine is built in that language and cannot be rebuilt afterwards.",
          unavailable: "A greyed card with an Unavailable notice cannot be launched right now, and says why: the size it needs is not in your plan, your running sessions use all your capacity, the server is offline, or no compatible image exists. The notice's second line tells you what would unblock it."
        },
        launch: {
          title: "Launching",
          description: "Click Launch. A full-screen overlay follows the three preparation phases: creating your terminal, installing packages and configuring the environment, running the scenario's setup scripts. It usually takes under a minute; Cancel is available if you change your mind.",
          budget: "A scenario session is a terminal session: it counts against the same CPU and RAM budget as the sessions you create by hand, and appears in My sessions like any other.",
          existing: "If you already have a run of this scenario in progress, the card says Scenario in progress and its button becomes Resume. A finished run turns the button into Relaunch, next to Review."
        },
        player: {
          title: "The player",
          description: "Once ready, you land on the session view in scenario mode: the terminal on the left, the step panel on the right, and a resizable divider between them.",
          shot: "The player: the briefing at the top, the terminal on the left with its Stop and Destroy buttons, the step panel on the right with Verify and Reset step, and the progress dots at the bottom.",
          briefing: "The Scenario briefing card at the top is the scenario's introduction. Close it with the button under it; the Scenario briefing toggle in the top bar brings it back.",
          terminal: "The terminal behaves exactly like a standalone session: recording notice, connection status, remaining time, Stop (persistent sessions only) and Destroy. Under it, Command history, and Flags found when the scenario uses flags.",
          panel: "The step panel shows the current step's title and instructions. Some commands in the instructions are clickable: a click pastes the command into the terminal. At the bottom, Step n / total and one dot per step show where you are; earlier steps can be reopened to reread them, then Back to current step.",
          abandon: "Abandon scenario, top right, ends the run for good after a confirmation. The session is kept in your history as Abandoned; you can start a fresh run from the catalogue."
        },
        stepTypes: {
          title: "The four kinds of step",
          terminal: "Terminal — do something in the machine, then click Verify. A script checks the result; if it is not right yet, the panel says so and you try again.",
          info: "Reading — text only, no exercise. Click I've read this, next to move on.",
          flag: "Flag — the step asks for an answer: a token hidden somewhere in the machine, or a word you work out. Type it in the field and Submit. Validated flags appear in the Flags found panel under the terminal.",
          quiz: "Quiz — one or more questions: multiple choice, multi-answer, true/false or free text. Answer them all, then Submit answers. Depending on the scenario you see either just your score, or the correct answers with an explanation. You may retake the quiz, then Next step or Finish scenario."
        },
        help: {
          title: "When you are stuck",
          hints: "Hints, when the step has some, are revealed one level at a time with Show Hint 1, Show Hint 2… The counter reads Hints: used/total. Your trainer can see how many hints you used.",
          reset: "Reset step rebuilds the machine for the current step only, keeping what earlier steps did. Use it when you have made the step impossible to finish (a deleted file, a broken service). It asks for a confirmation.",
          preparing: "Between two steps the panel may show Preparing the next step… while it installs what the step needs. If it fails, the panel says so plainly: it is not part of the exercise. Click Restart preparation; if it keeps failing, tell your trainer.",
          crashTraps: "Some challenge scenarios arm crash traps: a crashed container ends the run and resets your progress, and the session is always ephemeral. The scenario's briefing says so."
        },
        endings: {
          title: "How a run ends",
          completed: "Completed — after the last step, the panel shows Scenario completed with your results: steps done and time spent. The terminal stays open until it expires or you destroy it.",
          abandoned: "Abandoned — you clicked Abandon scenario, in the player or in your history.",
          expired: "Expired — the terminal reached its time limit before the last step. Launch the scenario again to start over."
        },
        history: {
          title: "Your scenario history",
          description: "Scenarios › Scenario history lists every run, grouped by scenario, with tabs All, Active, Completed and Abandoned. A card shows the progress (steps validated / total), the start date and, when the scenario grades, your grade.",
          shot: "Scenario history: two runs of the same scenario, one Active with Resume and Abandon, one Abandoned with Review.",
          resume: "Resume reopens the player of an active run.",
          review: "Review opens a finished run read-only: the terminal is gone, but the steps and your command history are still there.",
          abandon: "Abandon ends an active run without opening it. This cannot be undone."
        },
        nextSteps: {
          terminals: "How the terminal under a scenario works.",
          managing: "Where a scenario session appears among your other sessions.",
          creation: "For trainers: build your own scenarios."
        }
      },

      creation: {
        title: "Creating scenarios",
        intro: "As a trainer you build scenarios in the Scenario Editor: a scenario node, steps chained one after the other, and for each step the text the learner reads and the scripts that prepare and check it. This page walks the editor and the import, archive and health tools around it.",
        access: {
          title: "Who can open the editor",
          description: "Scenarios › Scenario Editor is available to managers and owners of an organisation or a class, and to platform administrators. A learner who follows the link is sent back to their sessions.",
          shot: "The catalogue as a trainer sees it: the scenarios of the organisation, ready to launch, with the language selector on the multilingual one."
        },
        layout: {
          title: "The editor at a glance",
          description: "The page has three areas. Left, the Nodes library: drag a node type onto the canvas, or click it to add one at the centre. Centre, the canvas: nodes and the links between them. Right, a foldable list of every scenario and its steps, from which you can drag steps of other scenarios into yours as templates.",
          header: "The top bar holds the scenario selector, Create New, the language selector when the scenario is multilingual, a node and link counter, Play as learner, Reset layout, Save changes and a ⋮ menu with the export, copy, archive and import actions.",
          readOnly: "A scenario you may not edit (a platform scenario, or one from another organisation) opens read-only, with a banner. Copy to organization in the ⋮ menu makes an editable copy of it in one of yours."
        },
        scenario: {
          title: "Create a scenario",
          description: "Click Create New. The scenario dialog has tabs:",
          general: "General — name, title, difficulty, estimated time, description, and Where to create: an organisation, one of your classes (the scenario is then assigned to that class automatically), or the platform for administrators.",
          content: "Content — Markdown texts: the introduction shown before the first step (the briefing), the completion text, the objectives and the prerequisites.",
          setup: "Setup — the global setup script, run once when the learner's terminal is created, before step 1. Use it to install packages and lay out files.",
          options: "Options — the machine size the scenario runs at, the container hostname, the OS type, and three switches: Enable CTF flags, Enable crash traps (challenge mode: every flag is deployed at start and a crash resets progress), and Public, which offers the scenario to every user.",
          languages: "Languages — the language the scenario is written in, and the other languages you offer it in. Ticking a second language turns on the translation editor: a language selector appears in the top bar and in each dialog, with a coverage indicator, and you translate titles and texts language by language. Scripts are shared by all languages.",
          vocabulary: "Vocabulary — available once the scenario is saved. It names the objects a script refers to (a file, a directory, a service) so that one script works in every language: translate the names here, not the scripts."
        },
        steps: {
          title: "Add steps",
          description: "Drag a step type from the library onto the canvas, or hover a link and click its + to insert a step between two others. Four types exist; the type decides which tabs the step dialog shows.",
          terminal: "Terminal — the learner works in the machine and clicks Verify. Tabs: Content, Hints, Verify, Background, Foreground, Effects.",
          info: "Info — text to read, nothing to do. Tabs: Content, Effects.",
          flag: "Flag — the learner submits an answer. Tabs: Content, Hints, Background, Effects, plus the flag path and level.",
          quiz: "Quiz — questions. Tabs: Content, Hints, Questions, Effects."
        },
        stepDialog: {
          title: "Fill in a step",
          content: "Content — the title and the instructions, in Markdown. A command tagged with the KillerCoda exec marker — the command in backticks, immediately followed by the word exec in double braces — becomes click-to-paste in the player.",
          hints: "Hints — the progressive hints, revealed level by level. Separate levels with ### Hint 1, ### Hint 2 headings (or ### Indice 1 in French); a hint text with no heading is a single level.",
          verify: "Verify — a shell script run in the container when the learner clicks Verify. Exit code 0 validates the step; anything else keeps the learner on it. Print what you check: the output helps them.",
          background: "Background — a script run in the container when the learner reaches the step, in the background: start a service, plant a file, break something on purpose.",
          foreground: "Foreground — commands typed into the learner's live shell when they reach the step, as if they had typed them. Keep it short; they see it happen.",
          flag: "Flag steps — tick Has flag and give a Flag path: when the learner reaches the step, a FLAG token unique to their session, is written to that file in the container, and the step is validated when they submit it. Flag level is a free number kept with the step.",
          questions: "Questions — for a quiz: add questions, pick a type (multiple choice, multi-answer, true/false, free text), mark the correct options, optionally give points and an explanation. Show feedback after submission switches the quiz from exam mode (score only) to learning mode (answers and explanations shown).",
          effects: "Effects — an intro effect drawn in the terminal when the learner arrives on the step, and an outro effect once they validate it, each with a short text. Purely visual."
        },
        chaining: {
          title: "Chain the steps and save",
          description: "Steps run in one direction, from the scenario node to the last step. Draw a link from a step's output to the next step's input; a step can lead to only one next step and the chain cannot loop. Steps left unconnected are appended at the end when you save, with a warning naming them. Save changes writes the order; Reset layout only rearranges the canvas.",
          reorder: "To move a step, delete its links and draw new ones, or drop it on a link: the editor rewires the chain around it."
        },
        preview: {
          title: "Play it as a learner",
          description: "Play as learner provisions a real terminal (it counts against your own session limit) and opens the player exactly as a learner sees it. Walk through the steps, then destroy the session. Edits made while a run is in progress do not change that run: start a new preview."
        },
        importExport: {
          title: "Import and export",
          description: "Importing happens from the Scenarios tab of an organisation or of a class, not from the editor. Two formats:",
          killercoda: "Import KillerCoda — a .zip or .tar.gz archive (10 MB max) laid out like a KillerCoda scenario: an index.json, one directory per step with its text and scripts, assets. Hints written with ### Hint n headings become hint levels; an optional extensions.json per step declares the step type and quiz questions.",
          json: "Import JSON — a .json file (5 MB max) exported from OCF with Export JSON. It must contain a title and steps. Importing a scenario that already exists in the organisation updates it.",
          export: "Export as JSON and Export as KillerCoda archive, in the editor's ⋮ menu and on the organisation's Scenarios tab, download the scenario in either format: to back it up, move it to another organisation, or edit it in a text editor."
        },
        archive: {
          title: "Archive a scenario",
          description: "Archive, in the editor's ⋮ menu or on the Scenarios tab, withdraws a scenario without deleting it: it is no longer offered to learners, assignable or launchable, but past results keep it in their history and runs in progress finish normally. Restore brings it back at any time. Delete, on the Scenarios tab, removes it for good."
        },
        health: {
          title: "Scenario health",
          description: "Platform administrators have an Administration › Scenario health page that lists what a scenario promises and cannot keep: a language declared but not offered, a step with no way to pass it. Nothing there is reported to learners; if a scenario of yours behaves oddly, ask your administrator to check it."
        },
        nextSteps: {
          gettingStarted: "What the learner sees: catalogue, player, history.",
          classes: "Assign scenarios to a class and follow learners live."
        }
      }
    }
  }
};
