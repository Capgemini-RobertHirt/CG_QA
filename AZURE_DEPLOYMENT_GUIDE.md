# Azure Static Web Apps Deployment Guide

## Quick Start - Deploy to Azure Static Web Apps

### Step 1: Prerequisites
- GitHub account with repository access
- Azure subscription with owner or contributor role
- GitHub repository containing this code

### Step 2: Create Azure Static Web Apps Resource

1. **Via Azure Portal**:
   - Navigate to Azure Portal → Create Resource
   - Search for "Static Web App"
   - Click Create
   - Fill in:
     - **Resource Group**: Create new or select existing
     - **Name**: `cg-qa-app` (or your preferred name)
     - **Plan Type**: Free
     - **Region**: Sweden Central (or Switzerland North, based on parameters)
     - **Source**: GitHub
     - **Organization**: Your GitHub username
     - **Repository**: `Capgemini-RobertHirt/CG_QA`
     - **Branch**: `main` (or your branch)

2. **Build Configuration**:
   - **App location**: `src/app`
   - **API location**: `src/api`
   - **Output location**: `dist`

### Step 3: GitHub Actions Workflow

Azure will create a GitHub Actions workflow at `.github/workflows/azure-static-web-apps-*.yml`

**Verify the workflow contains**:
```yaml
- name: Build And Deploy
  id: builddeploy
  uses: Azure/static-web-apps-deploy@v1
  with:
    azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_TOKEN }}
    repo_token: ${{ secrets.GITHUB_TOKEN }}
    action: "upload"
    app_location: "src/app"
    api_location: "src/api"
    output_location: "dist"
```

### Step 4: Deploy

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy to Azure Static Web Apps"
   git push origin main
   ```

2. **Automatic Deployment**:
   - GitHub Actions workflow triggers automatically
   - View progress in GitHub → Actions tab
   - Deployment typically takes 2-5 minutes

3. **Verify Deployment**:
   - Check GitHub Actions status
   - Azure Portal shows deployment URL
   - Visit deployment URL to access application

### Step 5: Configure Custom Domain

1. **In Azure Portal**:
   - Navigate to your Static Web App resource
   - Custom domains → Add
   - Enter your domain name
   - Add DNS records as instructed
   - Verify and assign

### Step 6: Configure Environment Variables

1. **In Azure Portal**:
   - Configuration → Application settings
   - Add production environment variables:
     ```
     VITE_API_URL: https://api.your-domain.com
     VITE_APP_ENVIRONMENT: production
     ```

2. **Or in `staticwebapp.config.json`**:
   ```json
   {
     "env": "production",
     "apiUrl": "https://api.your-domain.com"
   }
   ```

### Step 7: Configure Routing

The `staticwebapp.config.json` file (already in repository) contains:
```json
{
  "navigationFallback": {
    "rewrite": "/index.html"
  },
  "auth": {
    "identityProviders": {
      "azureActiveDirectory": {
        "registration": {
          "clientId": "YOUR_CLIENT_ID",
          "clientSecret": "YOUR_CLIENT_SECRET"
        }
      }
    }
  }
}
```

**To use Azure AD authentication**:
1. Register application in Azure AD
2. Update `clientId` and `clientSecret`
3. Commit and push (automatic redeploy)

### Step 8: Monitor Deployment

1. **Azure Portal**:
   - View deployment history
   - Check error logs
   - Monitor performance

2. **GitHub Actions**:
   - View workflow logs
   - Check build output
   - Monitor build time

---

## Deployment Checklist

Before deploying to production:

- [ ] All tests pass locally: `npm run build`
- [ ] No console errors in dev build
- [ ] Feature testing completed
- [ ] Environment variables configured
- [ ] API endpoint URLs verified
- [ ] Custom domain configured
- [ ] SSL certificate installed
- [ ] CORS settings configured
- [ ] Backend API accessible from deployed URL
- [ ] Monitoring and logging configured

---

## Troubleshooting

### Build Fails in GitHub Actions

**Error**: "Command failed with exit code 1"
- Check `npm ci` succeeds locally
- Verify `node_modules` correct versions
- Check `npm run build` output for errors

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Application Blank After Deploy

**Error**: White screen, no content
- Check browser console (F12)
- Verify `staticwebapp.config.json` navigation fallback
- Check API URLs in `.env`

**Solution**:
1. Clear browser cache (Ctrl+Shift+Del)
2. Check `dist/index.html` exists
3. Verify asset paths in HTML

### API Calls Failing

**Error**: 404 or CORS errors
- API location in `staticwebapp.config.json` might be wrong
- Backend API endpoint might not be accessible

**Solution**:
```json
{
  "routes": [
    {
      "route": "/api/*",
      "rewrite": "YOUR_API_URL/api/*"
    }
  ]
}
```

### Performance Issues

**Slow load time**:
- Check bundle size: should be < 500KB gzipped
- Use Azure CDN for static assets
- Enable compression in web server

---

## Performance Optimization

### 1. Enable Compression
Already handled by Azure Static Web Apps (gzip enabled by default)

### 2. Add CDN
```bash
# In Azure Portal:
# Static Web App → Networking → Add CDN
# Select Azure CDN Standard
```

### 3. Cache Headers
```json
{
  "routes": [
    {
      "route": "/assets/*",
      "headers": {
        "cache-control": "max-age=31536000"
      }
    }
  ]
}
```

### 4. Code Splitting
In `src/app/vite.config.js`:
```javascript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'pdfjs': ['pdfjs-dist'],
          'mammoth': ['mammoth']
        }
      }
    }
  }
})
```

---

## Monitoring & Alerts

### Set Up Application Insights

1. **Create Application Insights resource**:
   ```bash
   az monitor app-insights component create \
     --app cg-qa-app \
     --resource-group myResourceGroup \
     --location swedencentral
   ```

2. **Add instrumentation key to app**:
   ```typescript
   // src/app/src/main.tsx
   import { ApplicationInsights } from '@microsoft/applicationinsights-js'
   
   const ai = new ApplicationInsights({
     config: {
       instrumentationKey: 'YOUR_KEY',
       enableAutoRouteTracking: true
     }
   })
   ```

### Configure Alerts
- Set up alerts for:
  - Failed requests > 5%
  - Response time > 2s
  - Server errors > 10

---

## Scaling

### Automatic Scaling
Azure Static Web Apps automatically scales to handle traffic.

### Manual Scaling
If using API, scale the App Service plan:
1. Navigate to App Service
2. Scale up → Select higher tier
3. Upgrade plan type

---

## Security

### 1. Enable HTTPS
- Automatically enabled by Azure Static Web Apps
- Free SSL certificate provided

### 2. Configure CORS
In `staticwebapp.config.json`:
```json
{
  "globalHeaders": {
    "Access-Control-Allow-Origin": "YOUR_DOMAIN"
  }
}
```

### 3. Set Security Headers
```json
{
  "globalHeaders": {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block"
  }
}
```

### 4. Authenticate Users
Use Azure AD or similar service for user authentication.

---

## Backup & Recovery

### 1. Regular Backups
- GitHub repositories serve as backup
- Azure automatically maintains versions

### 2. Rollback Procedure
```bash
# Via GitHub
git revert <commit-hash>
git push origin main

# Automatic redeployment via GitHub Actions
```

### 3. Database Backup
If using backend with database:
- Configure Azure SQL Database backups
- Set retention policy (7-35 days)
- Test restore procedure monthly

---

## Cost Estimation

### Azure Static Web Apps Pricing (Free tier):
- 100 GB bandwidth/month (free)
- Custom domains supported
- HTTPS included
- 1 staging environment

### Upgrade to Standard (if needed):
- Higher bandwidth limits
- Custom staging environments
- API authentication
- ~$9/month base + usage

---

## Support Resources

- **Azure Static Web Apps Docs**: https://docs.microsoft.com/en-us/azure/static-web-apps/
- **GitHub Actions**: https://docs.github.com/en/actions
- **Vite Documentation**: https://vitejs.dev/
- **React Documentation**: https://react.dev/

---

**Deployment Guide Version**: 1.0
**Last Updated**: 2026-04-29
**Status**: Ready for Production Deployment
