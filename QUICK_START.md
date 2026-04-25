# 🚀 CG_QA: Next Steps (Do This Now!)

## IMMEDIATE ACTION REQUIRED ⏱️

### Step 1: Set GitHub Actions Variables (5 minutes)

Go to: **https://github.com/Capgemini-RobertHirt/CG_QA/settings/variables/actions**

Click "New repository variable" and add these **exactly**:

| Variable Name | Value |
|---|---|
| `AZURE_CLIENT_ID` | `f3c8b02f-0de5-424a-a760-4b27bcc9ce6d` |
| `AZURE_TENANT_ID` | `8ee51404-402a-48a8-8915-e02c8d224a77` |
| `AZURE_SUBSCRIPTION_ID` | `2233840b-43e5-4eac-99ae-452011c22f62` |
| `AZURE_APP_NAME` | `cg-qa` |
| `AZURE_RESOURCE_GROUP` | `CG_QA_rg` |

✅ You'll see them listed in green when saved.

---

### Step 2: Trigger Deployment (1 minute)

Either:
- **Option A:** Push to main branch:
  ```powershell
  cd "c:\DEV\Python\CG_Invent_Developments\CG_QA"
  git push origin main
  ```

- **Option B:** Manually trigger from GitHub:
  - Go to https://github.com/Capgemini-RobertHirt/CG_QA/actions
  - Click "deploy" workflow
  - Click "Run workflow" button

---

### Step 3: Monitor Deployment (5-10 minutes)

Watch progress at: **https://github.com/Capgemini-RobertHirt/CG_QA/actions**

Green checkmark = ✅ Success

---

### Step 4: Verify It's Live (2 minutes)

After deployment succeeds, test:

```powershell
# Test API health
Invoke-WebRequest -Uri "https://kind-sand-0ab0a5003.7.azurestaticapps.net/api/health"

# View frontend
Start-Process "https://kind-sand-0ab0a5003.7.azurestaticapps.net"
```

---

## What's Deployed

- ✅ **Infrastructure:** All Azure resources live (Static Web App, Functions, Cosmos DB)
- ⏳ **Code:** Committed to GitHub, waiting for GitHub Actions to build & deploy
- ⏳ **Frontend:** React app ready to deploy
- ⏳ **Backend:** 7 Azure Functions ready to deploy

---

## Architecture Overview

```
Frontend → API → Cosmos DB
(React)   (Functions)   (Serverless)
   ↓          ↓            ↓
 SWA     Auto-deployed   Live
```

---

## Important URLs

| Resource | URL |
|----------|-----|
| **Frontend** | https://kind-sand-0ab0a5003.7.azurestaticapps.net |
| **API Base** | https://kind-sand-0ab0a5003.7.azurestaticapps.net/api |
| **GitHub Repo** | https://github.com/Capgemini-RobertHirt/CG_QA |
| **GitHub Actions** | https://github.com/Capgemini-RobertHirt/CG_QA/actions |
| **Variables Settings** | https://github.com/Capgemini-RobertHirt/CG_QA/settings/variables/actions |

---

## Quick Test Script (After Deployment)

```powershell
$baseUrl = "https://kind-sand-0ab0a5003.7.azurestaticapps.net"

# Test 1: Health check
Write-Host "Testing health endpoint..."
$health = Invoke-WebRequest "$baseUrl/api/health" -UseBasicParsing
Write-Host $health.Content

# Test 2: Get available templates
Write-Host "Testing templates endpoint..."
$templates = Invoke-WebRequest "$baseUrl/api/templates/available-types" -UseBasicParsing
Write-Host $templates.Content

# Test 3: Get specific template
Write-Host "Testing template detail..."
$detail = Invoke-WebRequest "$baseUrl/api/templates/rfp_rfi_response" -UseBasicParsing
Write-Host $detail.Content.Substring(0, 200)...
```

---

## Total Time Estimate

| Step | Time |
|------|------|
| Set Variables | 5 min |
| Trigger Deployment | 1 min |
| Deployment Runs | 5-10 min |
| Verify Live | 2 min |
| **TOTAL** | **15-20 min** |

---

## Support

**If deployment fails:**
1. Check variables are set correctly (no typos)
2. Review logs in GitHub Actions tab
3. Verify Azure resources exist in Azure Portal

**If API returns 404:**
- Wait longer (deployment may still be running)
- Check GitHub Actions shows ✅ success

---

**Status:** 95% Complete — Ready for final deployment! 🎉

**Last Updated:** April 25, 2026
