# features/FREEMIUM.md
> Read when working on: Pro gates, license validation, upgrade modal, account preferences tab, trial logic.

## License state (electron-store)
```javascript
// Stored in Antigone/prefs.json under key 'license'
{
  tier: 'free' | 'pro',
  email: 'user@example.com' | null,
  validUntil: '2027-03-20T00:00:00Z' | null,  // null = never expires (lifetime)
  trialUsed: false,          // set to true when 14-day trial is activated
  trialStartedAt: null,      // ISO date string when trial started
}
```

## proGate() function (prefs.js)
```javascript
export function proGate(featureName) {
  const { tier, validUntil, trialStartedAt, trialUsed } = getPrefs().license;
  // Check active Pro subscription
  if (tier === 'pro') {
    if (!validUntil) return true; // lifetime
    if (new Date(validUntil) > new Date()) return true;
  }
  // Check active trial
  if (trialUsed && trialStartedAt) {
    const trialEnd = new Date(trialStartedAt);
    trialEnd.setDate(trialEnd.getDate() + 14);
    if (trialEnd > new Date()) return true;
  }
  return false; // free tier
}
```
Call `proGate('vim-keybindings')` before enabling any Pro feature. The featureName string is logged for analytics (v1.1).

## Pro features list (reference — do not duplicate in code)
- `vim-keybindings`
- `emacs-keybindings`
- `typeface-pairing-modern` / `typeface-pairing-technical` / `typeface-pairing-minimal` / `typeface-pairing-manuscript`
- `preprocessor`
- `custom-dictionary-unlimited`
- `docx-export`
- `ai-summarize` (v1.6)
- `tag-namespaces-unlimited`
- `tag-graph` (v1.5)
- `writing-analytics` (v1.5)
- `beta-updates`

## Upgrade modal
Triggered whenever `proGate()` returns false and the user attempts a Pro feature.
```javascript
function showUpgradeModal(featureName) {
  // Show modal with:
  // Title: "This is an Antigone Pro feature"
  // Body:  Brief description of the specific feature
  // CTA1:  "Start 14-day free trial" (if !trialUsed)
  // CTA2:  "Upgrade to Pro — $5.99/mo or $49/yr"
  //         → window.antigone.openExternal('https://antigone.app/upgrade')
  // CTA3:  "Maybe later" (dismisses)
}
```
Modal must never feel hostile. The feature description should be positive ("Vim mode gives you...") not punitive ("You can't use this").

## 14-day trial activation
```javascript
function activateTrial() {
  const prefs = getPrefs();
  if (prefs.license.trialUsed) return; // already used
  setPrefs({
    license: {
      ...prefs.license,
      trialUsed: true,
      trialStartedAt: new Date().toISOString(),
    }
  });
  // Now proGate() will return true for 14 days
  showTrialStartedToast('Pro trial active for 14 days');
}
```
Trial prompt shown automatically on first launch (fresh install). Shown once only.

## License validation (v1.0 stub — real API in v1.1)
```javascript
// preload.js exposes: window.antigone.validateLicense(key)
// main.js handler (v1.0 stub):
ipcMain.handle('validate-license', async (event, licenseKey) => {
  // v1.0: accept a hardcoded dev key for testing
  if (licenseKey === process.env.DEV_LICENSE_KEY) {
    return { valid: true, tier: 'pro', validUntil: null, email: 'dev@test.com' };
  }
  // v1.1: replace stub with real HTTP call to Paddle/Stripe webhook
  return { valid: false };
});
```

## Account preferences tab
Shows: tier badge (FREE / PRO), email, valid until date (or 'Active trial — N days remaining').
Buttons: 'Manage subscription' → openExternal(pricing page), 'Restore purchase' → validateLicense(key prompt).
