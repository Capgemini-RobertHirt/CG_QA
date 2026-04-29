# Backend API Deployment Guide

## Overview

The CG QA application consists of:
- **Frontend**: React/Vite SPA deployed to Azure Static Web Apps
- **Backend**: Node.js/Express API deployed as Azure Function

This guide explains how to deploy both components to Azure.

## Prerequisites

- Azure subscription
- Azure CLI installed locally
- GitHub account with the repository
- Node.js 18+ and npm

## Local Development

### 1. Start the Backend API

```bash
cd src/api
npm install
npm run start  # Uses Azure Functions Core Tools

# Or for direct Node.js execution:
node index.js
```

The API will be available at `http://localhost:7072`

### 2. Start the Frontend (in another terminal)

```bash
cd src/app
npm install
npm run dev
```

The frontend will be available at `http://localhost:5174` with automatic API proxying.

## Azure Deployment

### Step 1: Create Azure Static Web Apps Resource

```bash
# Create a resource group
az group create --name cg-qa-rg --location eastus

# Create Azure Static Web Apps instance
az staticwebapp create \
  --name cg-qa-app \
  --resource-group cg-qa-rg \
  --source https://github.com/YOUR-USERNAME/CG_QA \
  --branch main \
  --github-token YOUR_GITHUB_TOKEN \
  --location eastus \
  --app-location "src/app" \
  --api-location "src/api" \
  --output-location "dist"
```

### Step 2: GitHub Secrets Configuration

The deployment uses these secrets (set in GitHub):
- `SWA_DEPLOYMENT_TOKEN`: From Azure Static Web Apps deployment
- `GITHUB_TOKEN`: Auto-provided by GitHub Actions

To get the SWA token:
```bash
az staticwebapp secrets list --name cg-qa-app --resource-group cg-qa-rg
```

### Step 3: Deploy via GitHub Actions

The `.github/workflows/deploy.yml` workflow automatically:
1. Builds the frontend (React/Vite)
2. Builds the API (Node.js)
3. Deploys both to Azure Static Web Apps

Push to the `main` branch to trigger deployment:
```bash
git add .
git commit -m "Update"
git push origin main
```

## Architecture

```
┌─────────────────────────────────────────────┐
│ Azure Static Web Apps (Frontend)            │
│ - React/Vite SPA                            │
│ - Serves on /                               │
│ - Proxies /api/* to backend                 │
└─────────────────────────────────────────────┘
          │
          │ /api/* requests
          ↓
┌─────────────────────────────────────────────┐
│ Azure Functions (Backend)                   │
│ - Node.js/Express wrapped with serverless-http
│ - Serves on /api                            │
│ - Handles document upload/analysis          │
└─────────────────────────────────────────────┘
```

## API Endpoints

All endpoints are relative to `/api`:

```
GET  /health              - Health check
GET  /templates           - List all templates
GET  /templates/:type     - Get specific template
POST /samples             - Upload document
GET  /samples             - List all documents
GET  /samples/:id         - Get specific document
DELETE /samples/:id       - Delete document
POST /analyze/:id         - Analyze document
GET  /analyze/:id         - Get analysis results
```

## Environment Configuration

### Frontend Configuration

The frontend automatically detects the environment:
- **Local dev**: Uses Vite proxy to `http://localhost:7072`
- **Azure**: Uses `/api` (proxied by Static Web Apps)
- **Fallback**: Uses mock API if backend unavailable

### Backend Configuration

The backend supports multiple deployment modes:
- **Local Node**: `node src/api/index.js` (port 7072)
- **Azure Functions**: Wrapped with `serverless-http`
- **Azure Function Tools**: `func start`

## Data Persistence

Currently, the API uses **in-memory storage** for demonstration:
- Data is lost when the function restarts
- Suitable for demos and testing

For production, integrate:
- **Azure Cosmos DB** for documents
- **Azure Blob Storage** for file uploads
- **Azure Table Storage** for analysis results

## Troubleshooting

### 404 Errors on `/api/*`

**Symptom**: Frontend shows `GET /api/templates 404 (Not Found)`

**Causes**:
1. API not deployed with SWA
2. Incorrect `staticwebapp.config.json`
3. API build failed silently

**Solutions**:
```bash
# Check deployment logs
az staticwebapp show --name cg-qa-app --resource-group cg-qa-rg

# Verify API location in config
cat staticwebapp.config.json

# Re-deploy
git add .github/workflows/deploy.yml
git commit -m "fix: update workflow"
git push origin main
```

### CORS Errors

The backend includes CORS middleware. If you see CORS errors:
1. Verify frontend is calling `/api/*` (not full URL)
2. Check `express.cors()` in `src/api/index.js`
3. Verify backend is accessible: `curl https://your-app.azurestaticapps.net/api/health`

### Backend Not Starting Locally

```bash
# Check Node.js version
node --version  # Should be 18+

# Clear cache
rm -rf src/api/node_modules
cd src/api
npm install

# Try running directly
node index.js
```

## Monitoring

### Check API Health

```bash
# Local
curl http://localhost:7072/api/health

# Azure
curl https://your-app.azurestaticapps.net/api/health
```

### View Logs

**Azure Static Web Apps**:
```bash
# View build logs
az staticwebapp show --name cg-qa-app --resource-group cg-qa-rg
```

**Local Function App**:
```bash
func logs stream
```

## Security Considerations

Currently:
- All endpoints have `authLevel: anonymous`
- No authentication/authorization
- In-memory data not persisted

For production:
1. Enable Azure AD authentication
2. Add role-based access control (RBAC)
3. Use managed identity for database access
4. Implement request validation
5. Add rate limiting
6. Enable WAF (Web Application Firewall)

## Next Steps

1. **Set up persistent storage**: Implement Cosmos DB or Blob Storage
2. **Add authentication**: Integrate Azure AD
3. **Enhance monitoring**: Enable Application Insights
4. **Performance optimization**: Implement caching strategies
5. **CI/CD improvements**: Add automated testing to workflow

## References

- [Azure Static Web Apps Documentation](https://learn.microsoft.com/en-us/azure/static-web-apps/)
- [Azure Functions Node.js Guide](https://learn.microsoft.com/en-us/azure/azure-functions/functions-reference-node)
- [serverless-http Documentation](https://github.com/dougmoscrop/serverless-http)
