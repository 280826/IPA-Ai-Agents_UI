# Angular FOSS Remediation Evidence

## Framework remediation

The application dependencies have been upgraded to the latest stable Angular 22 releases available from npm at the time of this change.

| Package group | Version |
| --- | --- |
| Angular framework, CDK, Material, and compiler CLI | 22.1.0 |
| Angular CLI and build tooling | 22.1.2 |
| TypeScript | 6.0.3 |

Angular 22.1.0 is the current stable framework, CDK, and Material release. Angular CLI and build tooling resolve to 22.1.2, and Angular 22.1 requires TypeScript 6.0. The package lockfile records the resolved versions used for reproducible installation.

## Architecture applicability assessment

| Finding area | Status | Evidence and rationale |
| --- | --- | --- |
| SSR / Platform Server | Not applicable | The build configuration has only a browser entry point (`src/main.ts`). There is no `@angular/ssr` or `@angular/platform-server` dependency, server entry point, `main.server.ts`, `server.ts`, or server application configuration. The application runs as a client-side SPA. |
| Hydration / transfer cache | Not applicable | No `provideClientHydration`, `withHttpTransferCacheOptions`, or `TransferState` usage is present. Without SSR or hydration setup, transfer-cache execution paths are unreachable. |
| Service Worker | Not applicable | `angular.json` has no `serviceWorker` option, no `ngsw-config.json` exists, and `@angular/service-worker` is not installed. |
| DOM XSS feature preconditions | Not observed | The source review found no `bypassSecurityTrustHtml`, `bypassSecurityTrustScript`, `bypassSecurityTrustResourceUrl`, or `[innerHTML]` usage. No inline SVG script tags or dynamic template compilation were found. Angular's standard template sanitization remains in effect. |

## Validation commands

Run the following from the repository root after installation and retain the resulting logs for the security review package:

```powershell
npm install
npm audit
npm run build
npm run test
```

## Security response statement
