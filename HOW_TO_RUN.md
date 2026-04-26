# CG_QA - How to Run the Application

## Summary

The CG_QA application is a **full-stack JavaScript/React + Azure Functions** application that can run in two modes:

1. **Local Development** - For active development and testing
2. **Production (Azure)** - For deployed application

---

## Mode 1: Local Development

### System Requirements Checklist

- ✅ **Node.js 20+** - Already have this (verified with `npm --version`)
- ✅ **npm/npx** - Included with Node.js
- ❌ **Azure Functions Core Tools v4** - **NOT INSTALLED** (blocker for backend)
- ⚠️ **Git** - Already available
- 🟡 **Azure Cosmos DB Emulator** - Optional (for offline Cosmos DB testing)

### Installation Steps

#### Step 1: Install Azure Functions Core Tools (REQUIRED for backend)

This is the only missing prerequisite. Choose one method:

**Method 1: npm (Recommended)**
```powershell
npm install -g azure-functions-core-tools@4 --unsafe-perm
```

**Method 2: Winget**
```powershell
winget install Microsoft.AzureFunctionsCoreTools
```

**Method 3: Chocolatey** (if installed)
```powershell
choco install azure-functions-core-tools-4
```

Verify installation:
```powershell
func --version  # Should show 4.x.x
```

#### Step 2: Install Node Dependencies

Already done! Both frontend and backend have dependencies installed:
- ✅ `src/app/node_modules/` - 278 packages installed
- ✅ `src/api/node_modules/` - 65 packages installed

If needed to reinstall:
```powershell
cd c:\DEV\Python\CG_Invent_Developments\CG_QA
cd src\app && npm install
cd ..\api && npm install
```

### Running the Application Locally

Once Azure Functions Core Tools are installed:

#### Terminal 1: Start Backend (Azure Functions)
```powershell
cd c:\DEV\Python\CG_Invent_Developments\CG_QA\src\api
npm start
```

**Expected output:**
```
Azure Functions Core Tools
Version: 4.x.x
...
Now listening on: http://localhost:7071
Functions loaded
```

**Available endpoints:**
- http://localhost:7071/api/health
- http://localhost:7071/api/templates/available-types
- http://localhost:7071/api/templates/{entityType}

#### Terminal 2: Start Frontend (React + Vite)
```powershell
cd c:\DEV\Python\CG_Invent_Developments\CG_QA
npm run dev
```

**Expected output:**
```
VITE v5.4.1  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  press h + enter to show help
```

#### Step 3: Open in Browser

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:7071/api/

Navigate to `/checker` to try the quality document analysis feature.

### Development Features

**Automatic Reloading:**
- **Frontend:** Changes to React files auto-reload (Vite HMR)
- **Backend:** Changes to Functions auto-reload (Azure Functions Core Tools)

**Available Commands:**

From root directory:
```powershell
npm run dev       # Start frontend dev server
npm run build     # Build frontend for production
npm run lint      # Lint frontend code
npm test          # Run backend tests
```

From `src/app`:
```powershell
npm run dev       # Vite dev server (localhost:5173)
npm run build     # Build to dist/
npm run preview   # Preview production build
npm run lint      # ESLint checks
```

From `src/api`:
```powershell
npm start         # Run Functions locally (localhost:7071)
npm test          # Run function tests
```

---

## Mode 2: Production (Azure)

The application is already deployed to Azure. To access or update it:

### View Production Application

- **Frontend:** https://kind-sand-0ab0a5003.7.azurestaticapps.net
- **API Base:** https://kind-sand-0ab0a5003.7.azurestaticapps.net/api/

### Deploy Updates to Production

**Prerequisites:** GitHub Actions variables must be set (see [QUICK_START.md](QUICK_START.md))

**Process:**
1. Commit changes to repository
2. Push to main branch:
   ```powershell
   git push origin main
   ```
3. GitHub Actions automatically:
   - Builds the React frontend
   - Lints and packages Azure Functions
   - Deploys to Static Web App
   - Deploys to integrated Functions runtime
4. Deployment completes in ~5-10 minutes
5. Monitor at: https://github.com/Capgemini-RobertHirt/CG_QA/actions

---

## Database Configuration

### Local Development

**Current Setup:**
- Uses local Cosmos DB Emulator (https://localhost:8081/)
- Configuration in: `src/api/local.settings.json`

**To use Azure Cosmos DB instead:**

1. Get the connection key:
   ```powershell
   az cosmosdb keys list --resource-group CG_QA_rg --name cosmosdb-fh-cg-qa --query primaryMasterKey -o tsv
   ```

2. Update `src/api/local.settings.json`:
   ```json
   {
     "Values": {
       "COSMOS_DB_ENDPOINT": "https://cosmosdb-fh-cg-qa.documents.azure.com:443/",
       "COSMOS_DB_KEY": "<paste-key-here>"
     }
   }
   ```

3. Restart backend: `npm start`

### Production

- Uses Azure Cosmos DB (serverless tier)
- Endpoint: https://cosmosdb-fh-cg-qa.documents.azure.com:443/
- Database: `cg-qa`
- Container: `quality-templates`

---

## API Reference

### Core Endpoints

**GET /api/health**
- Health check
- Response: `{"status":"ok"}`

**GET /api/templates/available-types**
- List all quality template entity types
- Response: `{"available_types":["rfp_rfi_response","whitepaper",...,]}`

**GET /api/templates/{entityType}**
- Get complete template configuration
- Example: `/api/templates/rfp_rfi_response`
- Response: Full JSON template with 12 sections

**POST /api/templates**
- Create or update template (admin operation)
- Auth: Function key required
- Body: Template JSON

**POST /api/analyze**
- Analyze document against template
- Auth: Function key required
- Body: `{documentContent, templateType, documentType}`
- Response: Scores + findings

**POST /api/samples**
- Upload document sample
- Auth: Function key required
- Body: FormData with file + metadata

**GET /api/samples**
- List samples, optionally filtered
- Query param: `?document_type=...`

**POST /api/admin/load-templates**
- Load all 7 templates into Cosmos DB
- Auth: Function key required
- Response: Status of template loading

### Testing with curl

```powershell
# Test health
curl http://localhost:7071/api/health

# List templates
curl http://localhost:7071/api/templates/available-types

# Get specific template (200KB+ response)
curl http://localhost:7071/api/templates/rfp_rfi_response
```

---

## Troubleshooting

### "func: The term 'func' is not recognized"
**Cause:** Azure Functions Core Tools not installed
**Fix:** Run: `npm install -g azure-functions-core-tools@4 --unsafe-perm`

### Port 5173 already in use (Frontend)
**Fix:** 
```powershell
npm run dev -- --port 5174
```

### Port 7071 already in use (Backend)
**Fix:**
```powershell
cd src/api
func start --port 7072
```

### "Cannot find module 'react'" or similar
**Cause:** Dependencies not installed
**Fix:**
```powershell
cd src/app && npm install
cd ../api && npm install
```

### Cosmos DB connection error
**Cause:** Local Cosmos DB Emulator not running or credentials wrong
**Fix:** 
- Option 1: Install/run [Cosmos DB Emulator](https://aka.ms/cosmosdb-emulator)
- Option 2: Update local.settings.json to use Azure instead (see Database Configuration)

### CORS error when frontend calls API
**Likely fixed:** `local.settings.json` already allows `http://localhost:5173`
**If still occurring:** 
- Verify CORS in `src/api/local.settings.json` includes `http://localhost:5173`
- Restart backend: Stop and run `npm start` again

### Frontend not updating on file changes
**Cause:** Vite HMR not working
**Fix:**
- Verify browser shows dev server (localhost:5173, not production URL)
- Hard refresh browser: Ctrl+Shift+R
- Restart `npm run dev`

---

## File Structure Quick Reference

```
CG_QA/
├── src/
│   ├── api/              # Azure Functions (Node.js)
│   │   ├── health/       # Health check endpoint
│   │   ├── templates-*/  # Template management endpoints
│   │   ├── analyze/      # Document analysis endpoint
│   │   ├── samples-*/    # Sample management endpoints
│   │   ├── admin-*/      # Admin endpoints
│   │   ├── lib/          # Shared libraries (cosmosClient.js)
│   │   ├── templates/    # JSON template files
│   │   ├── package.json  # API dependencies
│   │   └── local.settings.json  # Local config
│   └── app/              # React Frontend (Vite)
│       ├── App.jsx       # Routes
│       ├── quality-checker/    # QualityChecker component
│       ├── quality-checker/    # TemplateLibrary component
│       ├── package.json  # Frontend dependencies
│       └── vite.config.js
├── infra/
│   └── main.bicep        # Azure Infrastructure as Code
├── .github/workflows/
│   ├── deploy.yml        # Production deployment
│   └── pr-checks.yml     # PR validation
├── RUNNING_LOCALLY.md    # This file - detailed local setup
├── QUICK_START.md        # Quick reference for next steps
├── STATUS_REPORT.md      # Complete technical overview
└── README.md             # Project overview
```

---

## Next Steps

### To Start Developing Locally:
1. ✅ Install Azure Functions Core Tools: `npm install -g azure-functions-core-tools@4 --unsafe-perm`
2. ✅ Verify: `func --version`
3. Run Terminal 1: `cd src/api && npm start`
4. Run Terminal 2: `cd . && npm run dev`
5. Open http://localhost:5173 in browser
6. Start coding! Changes auto-reload

### To Deploy to Production:
1. Set GitHub Actions variables (see QUICK_START.md)
2. Push to main: `git push origin main`
3. Monitor deployment: GitHub Actions tab
4. View at: https://kind-sand-0ab0a5003.7.azurestaticapps.net

---

**Documentation Files:**
- [RUNNING_LOCALLY.md](RUNNING_LOCALLY.md) - Detailed local setup guide
- [QUICK_START.md](QUICK_START.md) - Production deployment steps
- [STATUS_REPORT.md](STATUS_REPORT.md) - Complete technical architecture
- [DEPLOYMENT_NOTES.md](DEPLOYMENT_NOTES.md) - Deployment configuration
- [README.md](README.md) - Project overview

**Having trouble?** Check the troubleshooting section above or review the detailed [RUNNING_LOCALLY.md](RUNNING_LOCALLY.md) guide.
