# CG_QA Azure Migration - Deployment Complete ✅

## Azure Deployment Status: SUCCESS
Deployment completed in **1m 52s** on April 25, 2026
GitHub Actions variables configured on **April 27, 2026** ✅

## Key Azure Resources Created

### Compute
- **Static Web App:** `kind-sand-0ab0a5003.7.azurestaticapps.net` (SWA Free tier)
- **Integrated Functions:** Node.js v20 runtime for quality checker APIs

### Data & Storage
- **Cosmos DB:** `cosmosdb-fh-cg-qa` (Serverless tier)
  - Database: `cg-qa`
  - Container: `quality-templates`
  - Endpoint: `https://cosmosdb-fh-cg-qa.documents.azure.com:443/`
- **Azure Storage:** `stcgqa3n3z6erp` (for ideas board & Function App runtime)

### Security & Monitoring
- **Key Vault:** `kv-fh-cg-qa`
- **Managed Identity:** `id-fh-cg-qa` (Client ID: f3c8b02f-0de5-424a-a760-4b27bcc9ce6d)
- **Application Insights:** `appi-fh-cg-qa`
- **Log Analytics:** `log-fh-cg-qa`

### Resource Group
- **Name:** `CG_QA_rg` (switzerlandnorth)
- **Subscription:** Invent CH (2233840b-43e5-4eac-99ae-452011c22f62)

---

## GitHub Actions CI/CD Setup - COMPLETE ?

### Required Repository Variables
Set these in GitHub Settings → Secrets and variables → Actions → Repository variables:

```
AZURE_CLIENT_ID = f3c8b02f-0de5-424a-a760-4b27bcc9ce6d
AZURE_TENANT_ID = 8ee51404-402a-48a8-8915-e02c8d224a77
AZURE_SUBSCRIPTION_ID = 2233840b-43e5-4eac-99ae-452011c22f62
AZURE_APP_NAME = cg-qa
AZURE_RESOURCE_GROUP = CG_QA_rg
```

**To set these variables, use:**

```bash
# If using GitHub CLI (requires authentication)
gh variable set AZURE_CLIENT_ID --body "f3c8b02f-0de5-424a-a760-4b27bcc9ce6d" -R Capgemini-RobertHirt/CG_QA
gh variable set AZURE_TENANT_ID --body "8ee51404-402a-48a8-8915-e02c8d224a77" -R Capgemini-RobertHirt/CG_QA
gh variable set AZURE_SUBSCRIPTION_ID --body "2233840b-43e5-4eac-99ae-452011c22f62" -R Capgemini-RobertHirt/CG_QA
gh variable set AZURE_APP_NAME --body "cg-qa" -R Capgemini-RobertHirt/CG_QA
gh variable set AZURE_RESOURCE_GROUP --body "CG_QA_rg" -R Capgemini-RobertHirt/CG_QA
```

Or set manually in GitHub web UI: https://github.com/Capgemini-RobertHirt/CG_QA/settings/variables/actions

---

## Azure Functions Endpoints

### Public (Anonymous Access)
- **GET** `/api/health` - Health check
- **GET** `/api/templates/available-types` - List all entity types
- **GET** `/api/templates/{entityType}` - Get template by entity type
- **POST** `/api/analyze` - Analyze document

### Admin Functions (Requires API Key)
- **POST** `/api/templates` - Create/update template
- **POST** `/api/samples` - Upload sample document
- **GET** `/api/samples?document_type=<type>` - List samples
- **POST** `/api/admin/load-templates` - Load templates from JSON files

**API Route Pattern:** `https://kind-sand-0ab0a5003.7.azurestaticapps.net/api/{endpoint}`

---

## Cosmos DB Connection Details

- **Endpoint:** `https://cosmosdb-fh-cg-qa.documents.azure.com:443/`
- **Primary Key:** *(Retrieve from Azure Portal → Cosmos DB → Keys)*
- **Database:** `cg-qa`
- **Container:** `quality-templates`

### Local Development Config
Update `src/api/local.settings.json` with Cosmos DB credentials from Azure Portal:
```json
{
  "COSMOS_DB_ENDPOINT": "https://cosmosdb-fh-cg-qa.documents.azure.com:443/",
  "COSMOS_DB_KEY": "<primary-key-from-azure-portal>"
}
```

### Azure OpenAI QA Agent Config
The recommendation agent can now run in `hybrid` or `llm` mode through Azure OpenAI. Add these settings to the Function App or local settings:

```json
{
  "QA_AGENT_STRATEGY": "hybrid",
  "QA_LLM_AGENT_ID": "recommendation-agent",
  "QA_LLM_AGENT_IDS": "recommendation-agent,standards-agent,structure-agent",
  "QA_LLM_TIMEOUT_MS": "15000",
  "AZURE_OPENAI_ENDPOINT": "https://<azure-openai-resource>.openai.azure.com",
  "AZURE_OPENAI_DEPLOYMENT": "<chat-deployment-name>",
  "AZURE_OPENAI_API_VERSION": "2024-10-21",
  "AZURE_OPENAI_API_KEY": "<optional-api-key-for-local-dev>",
  "AZURE_OPENAI_AUTH_MODE": "auto",
  "AZURE_OPENAI_ENDPOINT_RECOMMENDATION_AGENT": "https://<optional-recommendation-resource>.openai.azure.com",
  "AZURE_OPENAI_ENDPOINT_STANDARDS_AGENT": "https://<optional-standards-resource>.openai.azure.com",
  "AZURE_OPENAI_ENDPOINT_STRUCTURE_AGENT": "https://<optional-structure-resource>.openai.azure.com",
  "AZURE_OPENAI_DEPLOYMENT_RECOMMENDATION_AGENT": "<optional-recommendation-deployment>",
  "AZURE_OPENAI_DEPLOYMENT_STANDARDS_AGENT": "<optional-standards-deployment>",
  "AZURE_OPENAI_DEPLOYMENT_STRUCTURE_AGENT": "<optional-structure-deployment>",
  "AZURE_OPENAI_AUTH_MODE_RECOMMENDATION_AGENT": "auto",
  "AZURE_OPENAI_AUTH_MODE_STANDARDS_AGENT": "managed-identity",
  "AZURE_OPENAI_AUTH_MODE_STRUCTURE_AGENT": "api-key"
}
```

Notes:
- `QA_AGENT_STRATEGY=heuristic` disables all LLM calls.
- `QA_LLM_AGENT_IDS` is the preferred setting for enabling more than one LLM-backed agent.
- `QA_AGENT_STRATEGY=hybrid` keeps the existing deterministic agents and upgrades only the listed agents to Azure OpenAI when configured.
- `QA_AGENT_STRATEGY=llm` still uses the same boundary but prefers Azure OpenAI reasoning for the listed agents.
- `AZURE_OPENAI_AUTH_MODE` and `AZURE_OPENAI_AUTH_MODE_<AGENT_ID>` accept `auto`, `api-key`, or `managed-identity`.
- `auto` prefers API key when present and otherwise falls back to managed identity.
- `AZURE_OPENAI_ENDPOINT_<AGENT_ID>` lets you split agents across separate Azure OpenAI resources, not only separate deployments.
- `AZURE_OPENAI_DEPLOYMENT_<AGENT_ID>` lets you split deployments by role, for example `AZURE_OPENAI_DEPLOYMENT_STANDARDS_AGENT`.
- If no API key is supplied, the API will try managed identity via `DefaultAzureCredential`.

### Values Needed For A Live Smoke Test
This repository does not contain a real Azure OpenAI endpoint, deployment name, or credential. To run the smoke test end-to-end, supply these from your Azure subscription in Function App settings or `local.settings.json`.

API key flow:

```json
{
  "AZURE_OPENAI_ENDPOINT": "https://<your-resource>.openai.azure.com",
  "AZURE_OPENAI_DEPLOYMENT": "<your-chat-deployment>",
  "AZURE_OPENAI_AUTH_MODE": "api-key",
  "AZURE_OPENAI_API_KEY": "<your-api-key>"
}
```

Managed identity flow:

```json
{
  "AZURE_OPENAI_ENDPOINT": "https://<your-resource>.openai.azure.com",
  "AZURE_OPENAI_DEPLOYMENT": "<your-chat-deployment>",
  "AZURE_OPENAI_AUTH_MODE": "managed-identity"
}
```

For agent-specific resources, use `AZURE_OPENAI_ENDPOINT_<AGENT_ID>`, `AZURE_OPENAI_DEPLOYMENT_<AGENT_ID>`, and optionally `AZURE_OPENAI_AUTH_MODE_<AGENT_ID>`.

### Successful Smoke Test Path
Once working Azure OpenAI settings are available, run this from `src/api`:

```bash
npm run smoke:qa-agents
```

The smoke test prints each agent's effective strategy, provider, endpoint host, deployment, auth mode, and any fallback reason. A successful Azure OpenAI run should show `provider: "azure-openai"` and `strategy: "hybrid"` or `"llm"` for the configured agents without a fallback reason.

**To retrieve the key:**
```bash
az cosmosdb keys list --resource-group CG_QA_rg --name cosmosdb-fh-cg-qa --query primaryMasterKey -o tsv
```

---

## Frontend Application URL
**Production:** `https://kind-sand-0ab0a5003.7.azurestaticapps.net/`

Features deployed:
- ✅ Document Quality Checker (`/checker`)
- ✅ Template Library (`/templates`)
- ✅ Ideas Board (`/ideas`)

---

## Next Steps

1. **Set GitHub Actions Variables** (above)
2. **Push to main branch** to trigger deployment:
   ```bash
   git push origin main
   ```
3. **Monitor deployment** in GitHub Actions
4. **Load templates into Cosmos DB:**
   ```bash
   curl -X POST https://kind-sand-0ab0a5003.7.azurestaticapps.net/api/admin/load-templates \
     -H "x-functions-key: <function-key>"
   ```
5. **Test API endpoints** against production
6. **Configure Entra ID** for `/ideas/admin` protection (optional)

---

## Deployment Outputs Summary

```
Subscription:         2233840b-43e5-4eac-99ae-452011c22f62
Resource Group:       CG_QA_rg
Region:               switzerlandnorth (EU)
Static Web App:       kind-sand-0ab0a5003.7.azurestaticapps.net
Cosmos DB Endpoint:   https://cosmosdb-fh-cg-qa.documents.azure.com:443/
Managed Identity ID:  f3c8b02f-0de5-424a-a760-4b27bcc9ce6d
Duration:             1m 52s
Status:               SUCCESS ✅
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│         Azure Static Web App (CDN Global)              │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Frontend (React 18 + Vite + TypeScript)         │   │
│  │ - Quality Checker (/checker)                    │   │
│  │ - Template Library (/templates)                 │   │
│  │ - Ideas Board (/ideas)                          │   │
│  └─────────────────────────────────────────────────┘   │
│                          ↓                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Integrated Azure Functions (Node.js v20)       │   │
│  │ - Quality Templates API                         │   │
│  │ - Document Analysis Engine                      │   │
│  │ - Sample Management                             │   │
│  │ - Admin Functions                               │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
            ↓                          ↓
    ┌──────────────────┐      ┌──────────────────┐
    │   Cosmos DB      │      │  Azure Storage   │
    │  (Serverless)    │      │   (Ideas Board)  │
    │                  │      │                  │
    │ - Templates      │      │ - Ideas Table    │
    │ - Analysis       │      │ - Documents      │
    │ - Samples        │      │                  │
    └──────────────────┘      └──────────────────┘
            ↓
    ┌──────────────────┐
    │  Key Vault +     │
    │  App Insights    │
    │  Log Analytics   │
    └──────────────────┘
```

---

## Troubleshooting

### API returns 403 Unauthorized
- Check Function Key in Key Vault
- Verify Managed Identity has Cosmos DB access (requires RBAC setup)

### Cosmos DB Connection Error
- Verify connection string in local.settings.json
- Check firewall rules in Azure portal

### Static Web App shows 404
- Check staticwebapp.config.json routing
- Verify frontend build artifacts in dist/ folder

---

**Deployment Date:** April 25, 2026  
**Deployed By:** robert.hirt@capgemini.com  
**Status:** ✅ PRODUCTION READY

# Deployment Ready - Production credentials configured
