# Scenarios Admin Guide

User-facing administration guide for the OCF interactive scenario system.

## Prerequisites

- Admin access to the OCF platform (Admin role in Casbin RBAC)
- The `scenarios` feature flag must be enabled (enabled by default)
- At least one Incus instance type configured in tt-backend

## How to Create a Scenario

### Via Admin UI

1. Navigate to the **Scenarios** admin page
2. Click the **Create** button
3. Fill in the required fields:

| Field | Required | Description |
|---|---|---|
| Name | Yes | URL-friendly slug (e.g. `install-nginx`). Must be unique. |
| Title | Yes | Display title (e.g. "Install and Configure Nginx") |
| Instance Type | Yes | Incus image ID from tt-backend (e.g. `ubuntu-22.04`, `debian-12`) |
| Description | No | Brief description shown in scenario picker |
| Difficulty | No | `beginner`, `intermediate`, or `advanced` |
| Estimated Time | No | Duration string (e.g. "30m", "1h", "2h") |
| Source Type | No | How the scenario was created: `git`, `upload`, `builtin`, or `seed` |
| Git Repository | No | Git repo URL (for git source type) |
| Git Branch | No | Branch to use (defaults to "main") |
| Flags Enabled | No | Enable CTF-style flag challenges for this scenario |
| GSH Enabled | No | Enable GameShell integration |
| Crash Traps | No | Enable crash trap challenges |
| Introduction Text | No | Markdown text shown before step 1 |
| Finish Text | No | Markdown text shown after all steps are completed |

4. Click **Save**

### Via Seed Endpoint (Recommended for Bulk Creation)

The seed endpoint creates a scenario with all its steps in a single API call. This is the most efficient way to create scenarios programmatically.

```bash
curl -X POST "https://api.example.com/api/v1/scenarios/seed" \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Install and Configure Nginx",
    "description": "Learn to install, configure, and verify Nginx web server",
    "difficulty": "beginner",
    "estimated_time": "30m",
    "instance_type": "ubuntu-22.04",
    "flags_enabled": false,
    "gsh_enabled": false,
    "crash_traps": false,
    "intro_text": "# Welcome\n\nIn this scenario, you will learn to install and configure Nginx on Ubuntu.",
    "finish_text": "# Congratulations!\n\nYou have successfully installed and configured Nginx.",
    "steps": [
      {
        "title": "Update package lists",
        "text_content": "First, update the package lists:\n\n```bash\napt update\n```",
        "hint_content": "Run the `apt update` command as root.",
        "verify_script": "apt-get check 2>/dev/null && test $(find /var/lib/apt/lists -maxdepth 1 -type f | wc -l) -gt 5",
        "background_script": "",
        "foreground_script": "",
        "has_flag": false
      },
      {
        "title": "Install Nginx",
        "text_content": "Install the Nginx package:\n\n```bash\napt install -y nginx\n```",
        "hint_content": "Use `apt install` with the `-y` flag to skip confirmation.",
        "verify_script": "dpkg -l nginx 2>/dev/null | grep -q \"^ii\"",
        "background_script": "",
        "foreground_script": "",
        "has_flag": false
      },
      {
        "title": "Start Nginx",
        "text_content": "Start the Nginx service and verify it is running:\n\n```bash\nsystemctl start nginx\nsystemctl status nginx\n```",
        "hint_content": "Check if port 80 is listening with `ss -tlnp | grep :80`.",
        "verify_script": "systemctl is-active nginx | grep -q \"^active$\"",
        "background_script": "",
        "foreground_script": "",
        "has_flag": false
      },
      {
        "title": "Test the web server",
        "text_content": "Verify Nginx serves the default page:\n\n```bash\ncurl -s http://localhost/\n```\n\nYou should see the Nginx welcome page HTML.",
        "hint_content": "The response should contain \"Welcome to nginx\".",
        "verify_script": "curl -s http://localhost/ | grep -qi \"welcome to nginx\"",
        "background_script": "",
        "foreground_script": "",
        "has_flag": false
      }
    ]
  }'
```

The `name` field is auto-generated as a URL slug from the title (e.g. "Install and Configure Nginx" becomes `install-and-configure-nginx`). Steps are ordered by their position in the array (0-indexed).

When `flags_enabled` is `true`, a cryptographic secret is auto-generated for HMAC-based flag generation.

## How to Add Steps to a Scenario

### Via Admin UI

1. Navigate to the **Scenario Steps** admin page
2. Click **Create**
3. Select the parent **Scenario** from the dropdown
4. Fill in:

| Field | Required | Description |
|---|---|---|
| Scenario | Yes | Parent scenario (dropdown) |
| Order | Yes | Step number (0-based). Steps are displayed in ascending order. |
| Title | Yes | Step title shown to students |
| Text Content | No | Markdown instructions shown to students |
| Hint Content | No | Markdown hint (students toggle visibility) |
| Verify Script | No (hidden in table) | Shell script to verify step completion (exit 0 = pass) |
| Background Script | No (hidden in table) | Script run in background when step starts |
| Foreground Script | No (hidden in table) | Script run in foreground when step starts |
| Has Flag | No | Whether this step includes a CTF flag challenge |
| Flag Level | No | Difficulty level of the flag (integer) |

5. Click **Save**

### Verify Script Examples

Verify scripts are executed as `/bin/sh -c "<script>"` inside the student's container. Exit code 0 means the step passes; any other exit code means failure. Stdout is returned to the student as feedback.

**Check if a file exists:**
```bash
test -f /etc/nginx/nginx.conf && echo "Config file found"
```

**Check if a package is installed:**
```bash
dpkg -l nginx 2>/dev/null | grep -q "^ii" && echo "nginx is installed"
```

**Check if a service is running:**
```bash
systemctl is-active nginx | grep -q "^active$" && echo "nginx is running"
```

**Check command output:**
```bash
curl -s http://localhost/ | grep -qi "welcome to nginx" && echo "Nginx is serving pages"
```

**Check file content:**
```bash
grep -q "server_name example.com" /etc/nginx/sites-enabled/default && echo "Server name configured"
```

**Check if a user exists:**
```bash
id webuser >/dev/null 2>&1 && echo "User webuser exists"
```

**Check directory permissions:**
```bash
test "$(stat -c '%a' /var/www/html)" = "755" && echo "Permissions correct"
```

**Multiple checks in sequence:**
```bash
test -f /etc/nginx/sites-enabled/mysite && \
  grep -q "server_name" /etc/nginx/sites-enabled/mysite && \
  systemctl is-active nginx | grep -q "^active$" && \
  echo "Site configured and running"
```

## How to Monitor Active Sessions

### Via Admin UI

1. Navigate to the **Scenario Sessions** admin page
2. Sessions display: scenario (linked), user ID, terminal session ID, current step, status, start time, completion time
3. Use the built-in filters/search to find specific sessions

### Session Status Values

| Status | Meaning |
|---|---|
| **active** | Student is currently working through the scenario |
| **completed** | Student successfully finished all steps |
| **abandoned** | Student abandoned the session (all progress lost) |

### Updating Session Status

Admins can change a session's status via the edit modal. This is useful for:
- Marking a stuck session as `abandoned`
- Manually marking a session as `completed`

## How to Abandon/Clean Up Stuck Sessions

### Student Self-Service

Students can abandon their own sessions via the "Abandon Scenario" button in the scenario panel. This requires confirmation.

### Admin Cleanup

1. Go to **Scenario Sessions** admin page
2. Find the stuck session
3. Click **Edit**
4. Change status to `abandoned`
5. Save

Alternatively, use the API:
```bash
curl -X PATCH "https://api.example.com/api/v1/scenario-sessions/<session-id>" \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "abandoned"}'
```

## How to Use Flags (CTF-Style Challenges)

### Enable Flags on a Scenario

1. Edit the scenario (or create one with the seed endpoint)
2. Set **Flags Enabled** to `true`
3. Save

When flags are enabled, a cryptographic secret is generated automatically. This secret is used to create unique, per-student flags using HMAC-SHA256.

### Set Flag Levels on Steps

1. Edit a scenario step
2. Set **Has Flag** to `true`
3. Optionally set **Flag Level** to indicate difficulty (integer, higher = harder)
4. Save

### How Flags Work

When a student starts a scenario with flags enabled:

1. The system generates unique flags for each flag-enabled step using:
   - The scenario's secret key
   - The session ID
   - The step order
   - The user ID
2. Each flag has the format: `FLAG{<16-hex-characters>}` (e.g. `FLAG{a1b2c3d4e5f6a7b8}`)
3. Flags are different for every student and every session (no sharing)
4. Students submit flags via the input field shown on flag-enabled steps
5. Validation uses constant-time comparison to prevent timing attacks

### Displaying Flags to Students

Flags are typically embedded in the lab environment itself. For example:
- Written to a file by a background script
- Displayed as output of a command
- Hidden in a configuration file

The verify script checks the task, while the flag provides proof that the student actually completed it (not just guessed).

## How to Import from KillerCoda Format

### Directory Structure

Create a directory with this layout:

```
my-scenario/
  index.json          # Scenario metadata and step definitions
  intro.md            # Introduction markdown (optional)
  finish.md           # Completion markdown (optional)
  step1/
    text.md           # Step instructions (markdown)
    verify.sh         # Verification script
    background.sh     # Background script (optional)
    foreground.sh     # Foreground script (optional)
    hint.md           # Hint content (optional, OCF extension)
  step2/
    text.md
    verify.sh
    ...
```

### index.json Structure

```json
{
  "title": "My Scenario",
  "description": "Learn something useful",
  "difficulty": "beginner",
  "time": "30m",
  "details": {
    "intro": {
      "text": "intro.md"
    },
    "steps": [
      {
        "title": "Step 1: Do Something",
        "text": "step1/text.md",
        "verify": "step1/verify.sh",
        "background": "step1/background.sh",
        "foreground": "step1/foreground.sh",
        "hint": "step1/hint.md"
      },
      {
        "title": "Step 2: Check Something",
        "text": "step2/text.md",
        "verify": "step2/verify.sh"
      }
    ],
    "finish": {
      "text": "finish.md"
    },
    "assets": {
      "host01": [
        {
          "file": "config.txt",
          "target": "/root/",
          "chmod": "0644"
        }
      ]
    }
  },
  "backend": {
    "imageid": "ubuntu-22.04"
  },
  "extensions": {
    "ocf": {
      "flags": false,
      "crash_traps": false,
      "gsh_enabled": false
    }
  }
}
```

### OCF Extensions

The `extensions.ocf` section is optional and specific to OCF:

| Field | Type | Default | Description |
|---|---|---|---|
| flags | bool | false | Enable CTF-style flag challenges |
| crash_traps | bool | false | Enable crash trap challenges |
| gsh_enabled | bool | false | Enable GameShell integration |

### Import via API

The git-based import endpoint (`POST /scenarios/import`) is not yet implemented (returns 501). Currently, directory-based import is available server-side via `ScenarioImporterService.ImportFromDirectory()`.

To import programmatically, use the seed endpoint with the content read from your files.

## Troubleshooting

### Scenario won't start

**Symptoms:** Error when clicking "Start a Scenario" or selecting a scenario.

**Causes:**
- Scenario has no steps. At least 1 step is required.
- Terminal session ID is invalid or the terminal is not connected.
- User does not have Member role (needs at least GET access to scenarios).

**Fix:**
- Add at least one step to the scenario
- Ensure the terminal is active before starting a scenario
- Check user permissions in Casbin

### Verification always fails

**Symptoms:** "Verify" always returns failure, even when the task is done correctly.

**Causes:**
- Verify script has a bug (e.g. missing quotes, wrong path)
- Verify script expects a specific shell (bash vs sh)
- tt-backend is unreachable from ocf-core
- Terminal session is expired or container was destroyed

**Debugging:**
1. Check the verify script by running it manually in a container
2. Verify scripts execute as `/bin/sh -c "<script>"` -- ensure sh compatibility
3. Check ocf-core logs for "verification failed" errors
4. Check that `TERMINAL_TRAINER_URL` and `TERMINAL_TRAINER_ADMIN_KEY` environment variables are set correctly in ocf-core
5. Test tt-backend exec endpoint directly:
   ```bash
   curl -X POST "http://tt-backend:8089/1.0/exec" \
     -H "X-API-Key: <admin-key>" \
     -H "Content-Type: application/json" \
     -d '{
       "session_id": "<terminal-session-uuid>",
       "command": ["/bin/sh", "-c", "echo hello"],
       "timeout": 10
     }'
   ```

### Session stuck in "active" status

**Symptoms:** Session shows as active but the student cannot interact with it.

**Causes:**
- Terminal session expired but scenario session was not updated
- Browser lost connection and did not send abandon request

**Fix:**
- Admin: Change session status to `abandoned` via the admin UI or API
- The student can start a new session

### Flags not generating

**Symptoms:** Flag-enabled steps don't show the flag input, or flags are not created.

**Causes:**
- `flags_enabled` is false on the scenario
- Steps don't have `has_flag` set to true
- Flag secret was not generated (should happen automatically)

**Fix:**
- Edit the scenario: ensure `flags_enabled` is true
- Edit each flag step: ensure `has_flag` is true
- If creating via seed, ensure `flags_enabled: true` in the request body

### Student sees "No active scenario"

**Symptoms:** ScenarioPanel shows "No active scenario" even though a session was started.

**Causes:**
- The session was linked to a different terminal session ID
- The session was abandoned or completed
- `getSessionByTerminal()` returned null (404)

**Fix:**
- Verify the terminal session ID matches between the scenario session and the terminal
- Start a new scenario session on the current terminal

### Steps show in wrong order

**Symptoms:** Steps display out of order or skip numbers.

**Causes:**
- Step `order` values are not sequential starting from 0
- Duplicate order values

**Fix:**
- Edit steps to have sequential order values: 0, 1, 2, 3, ...
- Ensure no two steps share the same order value

### Markdown not rendering

**Symptoms:** Raw markdown is displayed instead of formatted HTML.

**Causes:**
- `marked` or `dompurify` package is missing from node_modules
- Content is not valid markdown

**Fix:**
- Run `npm install` in ocf-front
- Check that text_content uses valid markdown syntax
