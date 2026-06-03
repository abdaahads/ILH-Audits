# Branch Protection Setup Guide — ILH Audits

Since this repository is now **public**, it is critical to enable branch protection rules to prevent accidental or unauthorized changes to the production codebase.

## Step-by-Step Instructions

### 1. Navigate to Repository Settings
1. Go to **https://github.com/abdaahads/ILH-Audits**
2. Click **Settings** (gear icon) in the top navigation bar
3. In the left sidebar, click **Rules** → **Rulesets**

### 2. Create a New Ruleset
1. Click **"New ruleset"** → **"New branch ruleset"**
2. **Ruleset Name:** `Protect main branch`
3. **Enforcement status:** Set to **Active**

### 3. Configure Target Branches
1. Under **Target branches**, click **Add target** → **Include by pattern**
2. Enter: `main`
3. Click **Add**

### 4. Enable Branch Rules (Recommended Settings)

| Rule                             | Setting         | Why                                                                 |
|----------------------------------|-----------------|---------------------------------------------------------------------|
| **Restrict deletions**           | ✅ Enabled       | Prevents anyone from deleting the `main` branch                     |
| **Require a pull request**       | ✅ Enabled       | All changes must go through a PR — no direct pushes to main         |
| → Required approvals             | **1**           | At least 1 reviewer must approve before merging                     |
| → Require review from CODEOWNERS | ✅ Enabled       | The CODEOWNERS file designates required reviewers                   |
| → Dismiss stale reviews          | ✅ Enabled       | If new commits are pushed, old approvals are invalidated            |
| **Block force pushes**           | ✅ Enabled       | Prevents rewriting git history on the main branch                   |
| **Require status checks**        | Optional        | Enable once CI/CD is set up (e.g., Vercel build checks)             |
| **Require signed commits**       | Optional        | Adds an extra layer of commit authenticity verification             |

### 5. Save the Ruleset
1. Scroll to the bottom and click **"Create"**
2. Verify the ruleset appears as **Active** in the Rulesets list

## Quick Verification

After setup, try pushing directly to `main`:
```bash
git push origin main
```
You should see an error like:
```
remote: error: GH006: Protected branch update failed
```

This confirms branch protection is working correctly.

## Additional Recommendations

1. **Enable Dependabot alerts** — Settings → Code security → Enable Dependabot alerts
2. **Enable secret scanning** — Settings → Code security → Enable secret scanning (detects accidentally committed API keys)
3. **Add a `.gitignore` audit** — Verify no `.env` files or build artifacts are tracked (already handled in this PR)
