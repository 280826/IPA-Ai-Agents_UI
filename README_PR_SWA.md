# SWA Deploy + Auth Token + Agents List (PR payload)

This PR adds:
- GitHub Actions workflow for Azure Static Web Apps (SWA)
- `staticwebapp.config.json` for SPA routing + global headers
- `AuthService` + `AuthInterceptor` to attach Bearer tokens
- `AgentsService` to fetch agents list
- Production environment base URL

## After merge (one-time setup)
1. **Create SWA resource** in Azure Portal and link this repo/branch.
2. **Repo secret**: Add `AZURE_STATIC_WEB_APPS_API_TOKEN` (value from SWA → Manage deployment token).
3. **CORS on API (App Service)**: Allow your SWA domain(s) under API CORS settings.

## Angular integration notes
- Ensure `HttpClientModule` is imported in your root module.
- Register the interceptor in `app.module.ts`:

```ts
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AuthInterceptor } from './app/interceptors/auth.interceptor';

@NgModule({
  imports: [HttpClientModule],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ]
})
export class AppModule {}
```

- Add `src/staticwebapp.config.json` to Angular build **assets** in `angular.json`:

```json
"assets": [
  "src/favicon.ico",
  "src/assets",
  "src/staticwebapp.config.json"
]
```

## Build output
- Workflow uses `dist/IPA-Ai-Agents_UI/browser` as the output path.
