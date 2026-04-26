# Running CG_QA Locally

This guide covers setting up and running the CG_QA application on your local machine for development.

---

## Prerequisites Installation

### 1. Node.js 20+ (Required)
**Check if installed:**
```powershell
node --version
npm --version
```

**Install if needed:**
- Download from https://nodejs.org/ (LTS version 20+)
- Verify: `node --version` should show v20.x.x or higher

### 2. Azure Functions Core Tools v4 (Required for Backend)
**Check if installed:**
```powershell
func --version
```

**Install if needed:**

**Windows (using npm):**
```powershell
npm install -g azure-functions-core-tools@4 --unsafe-perm
```

**Windows (using Chocolatey - if installed):**
```powershell
choco install azure-functions-core-tools-4
```

**Windows (using Winget):**
```powershell
winget install Microsoft.AzureFunctionsCoreTools
```

**Verify installation:**
```powershell
func --version  # Should show 4.x.x
```

### 3. Git (Required)
Already installed if you're using this repo.

### 4. Azure CLI (Optional but Recommended)
For managing Azure resources:
```powershell
az --version  # Check if installed
```

### 5. Azure Cosmos DB Emulator (Optional)
For local database testing without Azure connection:
- Download: https://aka.ms/cosmosdb-emulator
- Provides local Cosmos DB on `https://localhost:8081/`
- Useful for developing offline

---

## Quick Start (5 minutes)

### Step 1: Install Dependencies

```powershell
cd c:\DEV\Python\CG_Invent_Developments\CG_QA

# Install all dependencies
cd src\app && npm install
cd ..\api && npm install
cd ..\..
```

**Expected output:** Both should show "added X packages" without errors.

### Step 2: Start Backend (Terminal 1)

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
```

### Step 3: Start Frontend (Terminal 2)

```powershell
cd c:\DEV\Python\CG_Invent_Developments\CG_QA
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

### Step 4: Open in Browser

- Frontend: http://localhost:5173
- API: http://localhost:7071/api/

---

## Detailed Setup Steps

### Setup Frontend Development

1. **Navigate to frontend directory:**
   ```powershell
   cd c:\DEV\Python\CG_Invent_Developments\CG_QA\src\app
   ```

2. **Install dependencies:**
   ```powershell
   npm install
   ```

3. **Run development server:**
   ```powershell
   npm run dev
   ```
   - Opens on http://localhost:5173
   - Auto-reloads on file changes (HMR - Hot Module Replacement)

4. **Available frontend commands:**
   ```powershell
   npm run dev       # Start dev server with hot reload
   npm run build     # Build production bundle (dist/)
   npm run preview   # Preview production build locally
   npm run lint      # Run ESLint code checker
   ```

### Setup Backend (Azure Functions)

1. **Verify Azure Functions Core Tools:**
   ```powershell
   func --version
   ```
   If not installed, see Prerequisites above.

2. **Navigate to API directory:**
   ```powershell
   cd c:\DEV\Python\CG_Invent_Developments\CG_QA\src\api
   ```

3. **Install dependencies:**
   ```powershell
   npm install
   ```

4. **Review local configuration:**
   - File: `local.settings.json`
   - Already configured for local emulator:
     - Cosmos DB: `https://localhost:8081/` (emulator)
     - Storage: `UseDevelopmentStorage=true` (Azure Storage Emulator)
     - CORS: Allows `http://localhost:5173`

5. **Start Functions locally:**
   ```powershell
   npm start
   ```
   Functions available on http://localhost:7071

6. **Available backend commands:**
   ```powershell
   npm start    # Run Azure Functions locally (func start)
   npm test     # Run function tests
   ```

---

## Development Workflow

### Typical Local Development Session

**Terminal 1 - Backend:**
```powershell
cd c:\DEV\Python\CG_Invent_Developments\CG_QA\src\api
npm start
# Keep running - automatically reloads when code changes
```

**Terminal 2 - Frontend:**
```powershell
cd c:\DEV\Python\CG_Invent_Developments\CG_QA
npm run dev
# Keep running - automatically reloads with HMR
```

**Terminal 3 - Git/Testing:**
```powershell
cd c:\DEV\Python\CG_Invent_Developments\CG_QA
# Make code changes
# Run tests: npm test
# Commit: git add . && git commit -m "message"
```

### Testing API Endpoints

Once backend is running, test endpoints:

```powershell
# Health check
curl http://localhost:7071/api/health

# List templates
curl http://localhost:7071/api/templates/available-types

# Get specific template
curl http://localhost:7071/api/templates/rfp_rfi_response
```

### Testing Frontend

Navigate to http://localhost:5173

- Try the **Quality Checker** tab (`/checker`)
- Try the **Template Library** tab (`/templates`)
- Try the **Ideas** board (`/ideas`)

---

## Configuration for Local Development

### Environment Variables

The `src/api/local.settings.json` is already configured:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_DB_ENDPOINT": "https://localhost:8081/",
    "COSMOS_DB_KEY": "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLMQA4j/EIVM+7QOU7z1AxkxDx/wexJ5lw==",
    "COSMOS_DB_NAME": "cg-qa",
    "COSMOS_CONTAINER_ID": "quality-templates"
  },
  "Host": {
    "CORS": "http://localhost:5173"
  }
}
```

**To use Azure instead of local emulator:**

1. Open `src/api/local.settings.json`
2. Replace these values:
   ```json
   "COSMOS_DB_ENDPOINT": "https://cosmosdb-fh-cg-qa.documents.azure.com:443/",
   "COSMOS_DB_KEY": "<key-from-azure-portal>"
   ```
3. Get key: 
   ```powershell
   az cosmosdb keys list --resource-group CG_QA_rg --name cosmosdb-fh-cg-qa --query primaryMasterKey -o tsv
   ```

---

## Troubleshooting

### "func: The term 'func' is not recognized"
**Solution:** Install Azure Functions Core Tools (see Prerequisites)

### "Cannot find module 'react'"
**Solution:** Dependencies not installed
```powershell
cd src/app && npm install
cd ../api && npm install
```

### Port 5173 already in use (Frontend)
**Solution:** Kill process or use different port
```powershell
# Use different port
npm run dev -- --port 5174
```

### Port 7071 already in use (Backend)
**Solution:** Kill process or use different port
```powershell
# Use different port
func start --port 7072
```

### Cosmos DB connection error
**Solution 1:** Install Azure Cosmos DB Emulator
- Download: https://aka.ms/cosmosdb-emulator
- Ensure it's running on `https://localhost:8081/`

**Solution 2:** Use Azure instead of emulator
- Update `local.settings.json` with Azure credentials (see Configuration section)

### CORS errors when calling API from frontend
**Fix already applied:** `local.settings.json` allows `http://localhost:5173`

If you see CORS errors:
1. Check `Host.CORS` in `local.settings.json` includes `http://localhost:5173`
2. Restart backend: Stop and run `npm start` again

### ESLint errors in frontend
**To fix automatically:**
```powershell
cd src/app
npm run lint
```

---

## Debugging

### Debug Frontend (VS Code)

1. Install [Debugger for Firefox](https://marketplace.visualstudio.com/items?itemName=firefox-devtools.vscode-firefox-debug) or [Debugger for Chrome](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome)

2. In VS Code, press `F5` to start debugging

3. Set breakpoints in code

### Debug Backend (Azure Functions)

Azure Functions don't support easy local debugging with VS Code's debugger. Instead:

1. Use `console.log()` for debugging
2. Check output in the terminal running `npm start`
3. For detailed logs, set environment variable:
   ```powershell
   $env:AzureWebJobsDebug = "true"
   npm start
   ```

---

## Building for Production

### Build Frontend

```powershell
cd c:\DEV\Python\CG_Invent_Developments\CG_QA
npm run build
```

Creates optimized bundle in `src/app/dist/`

### Deploy to Azure

1. **Set GitHub Actions variables** (see QUICK_START.md)
2. **Push to main:**
   ```powershell
   git push origin main
   ```
3. **Watch deployment:**
   - GitHub Actions automatically deploys to Azure
   - Monitor at: https://github.com/Capgemini-RobertHirt/CG_QA/actions

---

## Summary: Local vs Production

| Aspect | Local | Production |
|--------|-------|------------|
| **Frontend Port** | localhost:5173 | https://kind-sand-0ab0a5003.7.azurestaticapps.net |
| **API Port** | localhost:7071 | https://kind-sand-0ab0a5003.7.azurestaticapps.net/api |
| **Database** | Local emulator or Azure | Azure (Cosmos DB) |
| **Hot Reload** | Yes (Vite HMR) | No (requires rebuild) |
| **Deployment** | Manual (npm run dev/start) | Automated (GitHub Actions) |
| **Auth** | None (dev) | OIDC + API keys |

---

## Next Steps

1. **Install prerequisites** (Node 20+, Azure Functions Core Tools)
2. **Run `npm install`** in both src/app and src/api
3. **Start backend:** `npm start` in src/api
4. **Start frontend:** `npm run dev` from root
5. **Open http://localhost:5173** in browser
6. **Start coding!** Changes auto-reload

For production deployment, see [QUICK_START.md](QUICK_START.md)

---

**Questions?** Check [DEPLOYMENT_NOTES.md](DEPLOYMENT_NOTES.md) or [STATUS_REPORT.md](STATUS_REPORT.md)
