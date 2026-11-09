---
---

Upgrade rimraf to 6.1.4 and resolve cacache's glob to 14.0.4 so the workspace no longer installs glob 11/13 or minimatch 10 (CVE-2026-118773, CVE-2026-118764). Both are development-only dependencies, so no published package changes.
