# MycoCompass demonstration

This repository contains only a reviewed static demonstration release. It is not the development or research repository. Browser-delivered code and material observations are public. Third-party notices are in site/THIRD_PARTY_NOTICES.txt. No licence to redistribute private research or unpublished manuscripts is granted by this repository.

## Temporary projects

Projects remain in the current tab's memory. Export JSON before refreshing, leaving or ending the session; import the file to continue later. There are no accounts, project uploads, analytics or cloud project storage. The hosting provider may record IP addresses and other access metadata. User-entered project names and notes are not anonymized by export.

MBSC values describe 24 individual tested configurations, one coupon each. They are separate from MBC wall-board generation. Public records omit internal laboratory metadata; neither geometry edits nor wall layouts inherit those specimen measurements. Test conditions, units and evidence limitations remain with each public record.

## Operator checklist

Run `node scripts/verify-release.mjs` before publication. This verifies the complete tracked release file list and SHA-256 values, scans the site and validates the public catalogue; it is not a cryptographic signature or a comprehensive security certification. Verification ignores only Git's own .git metadata after repository creation, never site content.

Create an independent empty public repository only after explicit publication approval. Do not fork or mirror the private development repository. Copy only this package, inspect all staged files and commit identity, then enable Settings → Pages → GitHub Actions. Manually run Publish approved demonstration and select the approval input. There is no push-triggered deployment and no private-repository credential.

After deployment check HTTPS, the repository subpath, creation/design/generation, 3D, MBSC selection, comparison, real JSON download/reimport, End session, refresh and history. Confirm no project-upload requests. The currently tested target is desktop Chromium; other browsers and mobile editing need their own checks.

## Updating and rollback

Replace the repository working tree only with another reviewed package, retaining Git metadata. Review deleted and added files explicitly; never copy the private source tree. Use the assembler's `--previous` option to retain the previous approved site's hashed assets during a release transition so already-open sessions can load their lazy chunks. This increases the public package but does not restore user projects. Build and test each updated package before publishing.

Rollback by restoring a complete previously verified release commit and manually deploying it. This does not withdraw public copies already downloaded. Pages controls response headers and cache behaviour; local-server headers are not a hosting guarantee. HTML includes a restrictive meta CSP, which is not full response-header control. No service worker is installed.
