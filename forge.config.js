const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    name: 'Antigone',
    executableName: 'Antigone',
    appBundleId: 'com.haystackz.antigone',
    extendInfo: {
      CFBundleDocumentTypes: [
        {
          CFBundleTypeName: 'Markdown Document',
          CFBundleTypeRole: 'Editor',
          LSHandlerRank: 'Default',
          CFBundleTypeExtensions: ['md', 'markdown', 'mdown'],
        },
      ],
    },

    // ── macOS code signing ────────────────────────────────────────────────────
    // Requires: APPLE_IDENTITY env var (Developer ID Application certificate)
    // Skipped when not set (local dev builds).
    ...(process.env.APPLE_IDENTITY
      ? {
          osxSign: {
            identity: process.env.APPLE_IDENTITY,
            optionsForFile: () => ({
              entitlements: './entitlements.plist',
              'entitlements-inherit': './entitlements.plist',
              'hardened-runtime': true,
            }),
          },
        }
      : {}),

    // ── macOS notarization ────────────────────────────────────────────────────
    // Requires: APPLE_ID, APPLE_PASSWORD (app-specific), APPLE_TEAM_ID env vars
    // Skipped when any env var is missing (local dev builds).
    ...(process.env.APPLE_ID && process.env.APPLE_PASSWORD && process.env.APPLE_TEAM_ID
      ? {
          osxNotarize: {
            appleId: process.env.APPLE_ID,
            appleIdPassword: process.env.APPLE_PASSWORD,
            teamId: process.env.APPLE_TEAM_ID,
          },
        }
      : {}),
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'Antigone',
        setupExe: 'AntigoneSetup.exe',
        // ── Windows code signing ──────────────────────────────────────────────
        // Requires: WINDOWS_CERT_FILE (.pfx path) and WINDOWS_CERT_PASSWORD
        // EV certificates use signtool.exe directly via certificateFile.
        ...(process.env.WINDOWS_CERT_FILE
          ? {
              certificateFile: process.env.WINDOWS_CERT_FILE,
              certificatePassword: process.env.WINDOWS_CERT_PASSWORD || '',
            }
          : {}),
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],

  // ── GitHub Releases publisher ────────────────────────────────────────────────
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'haystackz12',
          name: 'antigone',
        },
        prerelease: false,
        draft: true,
      },
    },
  ],

  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              html: './src/index.html',
              js: './src/renderer.js',
              name: 'main_window',
              preload: {
                js: './src/preload.js',
              },
            },
          ],
        },
      },
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
