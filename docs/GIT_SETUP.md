# GIT_SETUP.md
> One-time setup. Run these steps in order. Do not skip any step.
> When finished, delete this file from the repo — it is a setup guide, not a project doc.

---

## Prerequisites

Before starting, confirm these are installed:

```bash
# Check Node.js (must be 18 or higher)
node --version

# Check npm
npm --version

# Check git
git --version

# Check git identity is set
git config --global user.name
git config --global user.email
```

If git identity is not set:
```bash
git config --global user.name "Mike Hastings"
git config --global user.email "michaelhastings771@gmail.com"
```

---

## Part 1 — Create the GitHub repository

### Option A — GitHub web interface (recommended for first time)

1. Go to https://github.com/new
2. Fill in:
   - **Repository name:** `antigone`
   - **Description:** `Cross-platform Markdown and plain text editor — Electron + CodeMirror 6`
   - **Visibility:** Private (change to Public when ready for v1.0 release)
   - **Initialize this repository with:** LEAVE ALL UNCHECKED (no README, no .gitignore, no license)
     - We will add these manually so nothing conflicts with our scaffold
3. Click **Create repository**
4. GitHub will show you a page with setup instructions — keep it open, you'll need the repo URL

Your repo URL will be:
```
https://github.com/haystackz12/antigone.git
```

### Option B — GitHub CLI (if gh is installed)

```bash
gh repo create haystackz12/antigone \
  --private \
  --description "Cross-platform Markdown and plain text editor — Electron + CodeMirror 6"
```

---

## Part 2 — Create the local Projects folder

```bash
# Create the Projects directory if it doesn't exist
mkdir -p ~/Projects

# Confirm it exists
ls ~/Projects
```

---

## Part 3 — Scaffold the Electron app

```bash
# Move into Projects
cd ~/Projects

# Scaffold using Electron Forge with webpack template
npx create-electron-app@latest antigone --template=webpack

# This will take 1-2 minutes. When done:
cd antigone

# Confirm the scaffold worked
ls
# Should show: node_modules/ src/ package.json webpack.*.js forge.config.js
```

---

## Part 4 — Set up the docs/ folder

```bash
# Create the docs directory structure
mkdir -p ~/Projects/antigone/docs/features

# Copy the documentation files from wherever you downloaded the zip
# If you downloaded antigone-docs.zip to ~/Downloads:
cd ~/Downloads
unzip antigone-docs.zip

# Copy all files into the project
cp antigone-docs/CLAUDE.md           ~/Projects/antigone/docs/
cp antigone-docs/SESSION_STATE.md    ~/Projects/antigone/docs/
cp antigone-docs/SPRINT.md           ~/Projects/antigone/docs/
cp antigone-docs/BUGS.md             ~/Projects/antigone/docs/
cp antigone-docs/ARCHITECTURE.md     ~/Projects/antigone/docs/
cp antigone-docs/DECISIONS.md        ~/Projects/antigone/docs/
cp antigone-docs/ROADMAP.md          ~/Projects/antigone/docs/
cp antigone-docs/TESTING.md          ~/Projects/antigone/docs/
cp antigone-docs/closing_instructions.md ~/Projects/antigone/docs/
cp antigone-docs/features/EDITOR.md      ~/Projects/antigone/docs/features/
cp antigone-docs/features/AUTOSAVE.md    ~/Projects/antigone/docs/features/
cp antigone-docs/features/PREVIEW.md     ~/Projects/antigone/docs/features/
cp antigone-docs/features/TAGS.md        ~/Projects/antigone/docs/features/
cp antigone-docs/features/FREEMIUM.md    ~/Projects/antigone/docs/features/
cp antigone-docs/features/EXPORT.md      ~/Projects/antigone/docs/features/
cp antigone-docs/features/SPELLCHECK.md  ~/Projects/antigone/docs/features/
cp antigone-docs/features/TYPOGRAPHY.md  ~/Projects/antigone/docs/features/

# Verify
ls ~/Projects/antigone/docs/
ls ~/Projects/antigone/docs/features/
```

---

## Part 5 — Create the .gitignore

```bash
cd ~/Projects/antigone
cat > .gitignore << 'EOF'
# Dependencies
node_modules/

# Electron Forge build outputs
dist/
out/
.webpack/

# OS files
.DS_Store
Thumbs.db
desktop.ini

# Editor artifacts
*.tmp
*.swp
*.swo
*~

# Antigone app data — never commit these
*.antigone-recovery-*
.antigone-dict

# Environment
.env
.env.local

# Logs
*.log
npm-debug.log*

# Coverage
coverage/

# IDE
.vscode/settings.json
.idea/
*.iml
EOF
```

---

## Part 6 — Create the README.md

```bash
cat > ~/Projects/antigone/README.md << 'EOF'
# Antigone

Cross-platform Markdown and plain text editor. Electron + CodeMirror 6.

**Platforms:** macOS · Windows · Linux  
**Status:** In development — Sprint 1

## Development

```bash
# Install dependencies
npm install

# Run in development
npx electron .

# Build for current platform
npm run make
```

## Documentation

All project documentation is in `docs/`. Start with `docs/CLAUDE.md`.

## License

MIT
EOF
```

---

## Part 7 — Initialize git and make the first commit

```bash
cd ~/Projects/antigone

# Initialize git (Electron Forge may have already done this — check)
git init

# Set the default branch to main
git checkout -b main

# Add the remote (use YOUR actual repo URL)
git remote add origin https://github.com/haystackz12/antigone.git

# Verify the remote was added
git remote -v
# Should show:
# origin  https://github.com/haystackz12/antigone.git (fetch)
# origin  https://github.com/haystackz12/antigone.git (push)

# Stage everything
git add -A

# Check what's being committed — review this list carefully
git status

# Make the initial commit
git commit -m "chore: initial Electron Forge scaffold with docs hierarchy"

# Push to GitHub
git push -u origin main
```

If the push asks for authentication:
- Use your GitHub username: `haystackz12`
- Use a **Personal Access Token** (not your password) — see Part 8 below

---

## Part 8 — GitHub authentication (Personal Access Token)

GitHub no longer accepts passwords over HTTPS. You need a Personal Access Token (PAT).

### Create a PAT:
1. Go to https://github.com/settings/tokens
2. Click **Generate new token (classic)**
3. Note: `Antigone development`
4. Expiration: 90 days (or No expiration for a dev machine)
5. Scopes: check **repo** (all repo permissions)
6. Click **Generate token**
7. **Copy the token immediately** — you cannot see it again

### Use the PAT:
When git prompts for a password during `git push`, paste the token (not your GitHub password).

### Save credentials so you're not prompted every time:
```bash
# macOS — store in keychain
git config --global credential.helper osxkeychain

# Windows — store in credential manager
git config --global credential.helper manager

# Linux — store in memory for 1 hour
git config --global credential.helper cache
```

---

## Part 9 — Verify everything on GitHub

1. Go to https://github.com/haystackz12/antigone
2. Confirm you can see:
   - The scaffolded Electron app files
   - `docs/` folder with all documentation
   - `README.md`
   - `.gitignore`
3. Click on `docs/CLAUDE.md` — confirm it renders correctly in GitHub

---

## Part 10 — Set up branch protection (recommended)

In GitHub repo Settings → Branches → Add rule:
- Branch name pattern: `main`
- Check: **Require a pull request before merging** (optional for solo dev)
- Check: **Do not allow bypassing the above settings** (optional)

For a solo project, you can skip this. It becomes important if others contribute.

---

## Part 11 — Configure the npm package name

Electron Forge names the package from `package.json`. Confirm it matches our convention:

```bash
cd ~/Projects/antigone
# Open package.json and verify:
# "name": "antigone"          ← lowercase, no spaces
# "productName": "Antigone"   ← capital A, this is the .app name
```

Edit if needed:
```bash
# On macOS
nano package.json
# Or
open -a "TextEdit" package.json
```

---

## Part 12 — Run the app to confirm scaffold works

```bash
cd ~/Projects/antigone
npx electron .
```

A window should appear (probably a blank white screen or Electron default page).
No errors in terminal = scaffold is working.

Close the window and proceed to Sprint 1 Day 1.

---

## You're done. Next step:

Open a new Claude chat and use this opening message:

```
We are working on the Antigone project — a cross-platform Markdown and plain text
editor built on Electron + CodeMirror 6, targeting macOS, Windows, and Linux.
Repo: haystackz12/antigone  |  Local path: ~/Projects/antigone

Please read the following files before we begin:
1. docs/CLAUDE.md
2. docs/SESSION_STATE.md
3. docs/SPRINT.md
4. docs/BUGS.md

Today is Sprint 1, Day 1 — Scaffold & Architecture.

We just completed git setup and the Electron Forge scaffold is running.
The docs/ folder is in place. No application code has been written yet.

Today's goal: lock the architecture (contextIsolation, nodeIntegration, bridge.js),
create the three-panel layout shell, and wire up the basic IPC channels for
readFile, writeFile, openDialog, and saveDialog.

Please start by reading docs/CLAUDE.md and docs/features/EDITOR.md,
then let's begin with main.js and preload.js.
```
