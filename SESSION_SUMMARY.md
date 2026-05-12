# CG Quality Checker - API Issues Diagnosis & Fixes

## Date: May 12, 2026
## Status: **Issues Identified and Partially Fixed**

---

## Issues Identified

### ✅ Issue 1: Missing "proposal" Template Mapping (FIXED)
**Problem**: Frontend sends `documentType: "proposal"` but template filename map only had specific types
**Location**: `src/api/lib/cosmosClient.js` line 135
**Fix Applied**: Added `'proposal': 'default.json'` to filenameMap
**Commit**: `db5037f`
**Status**: ✅ FIXED

### ✅ Issue 2: Duplicate Imports Causing Syntax Error (FIXED)
**Problem**: `src/api/lib/pptxParser.js` had duplicate `'use strict'` and duplicate module imports
**Location**: Lines 1-10
**Error**: `SyntaxError: Identifier 'path' has already been declared`
**Fix Applied**: Removed duplicate imports
**Commit**: `18bb9e0`
**Status**: ✅ FIXED - Verified with `node -c` syntax check

### ⚠️ Issue 3: PPTX Upload Workflow Returns 500 (NOT YET FULLY RESOLVED)
**Problem**: `/api/pptx/process` endpoint returns 500 error with generic "Backend call failure" message
**Evidence**:
- Browser console shows: `POST /api/pptx/process → 500`
- Direct API test shows: `Status: 500, Response: "Backend call failure"`
- The "Backend call failure" error suggests SWA infrastructure-level issue, not from function code

**Investigation Results**:
- ✅ Blob upload to storage: **SUCCEEDS** (file exists at `samples/pptx/776e56a1-6e93-4445-b66a-9ec2194dc008/test_presentation.pptx`)
- ✅ Module imports: **ALL PASS** (verified locally - all modules load without error)
- ✅ Syntax checks: **ALL PASS** (no syntax errors in any JS files)
- ✅ Cosmos DB settings: **SET** (COSMOS_DB_ENDPOINT, KEY, NAME, CONTAINER_ID all configured in SWA)
- ❌ Worker execution: **FAILS** (returns 500, not started processing)

**Root Cause**: Likely SWA Azure Functions runtime issue or incomplete deployment

### ⚠️ Issue 4: DELETE Shows 404 When Sample Deleted (PARTIALLY EXPECTED)
**Problem**: After deleting an uploaded sample from the UI, the delete works, but refresh shows it's gone
**Root Cause**: Samples stored in memory when worker fails to persist to Cosmos DB
**Impact**: Once worker is fixed and starts persisting samples to Cosmos DB, this will work correctly
**Status**: ⏳ WILL BE FIXED once Issue #3 is resolved

---

## Configuration Summary

### Azure Resources
| Resource | Name | Status |
|---|---|---|
| Static Web App | `swa-fh-cg-qa` | ✅ Deployed |
| Storage Account | `stcgqa3n3z6erp` | ✅ Configured |
| Cosmos DB | `cosmosdb-fh-cg-qa` | ✅ Configured |
| App Insights | `appi-fh-cg-qa` | ✅ Configured |
| Blob Container | `documents` | ✅ Created |

### SWA App Settings (All Set)
- ✅ `AZURE_STORAGE_CONNECTION_STRING`
- ✅ `DOCUMENTS_BLOB_CONTAINER`  
- ✅ `PPTX_MAX_UPLOAD_BYTES`
- ✅ `PPTX_UPLOAD_SAS_EXPIRY_MINUTES`
- ✅ `COSMOS_DB_ENDPOINT`
- ✅ `COSMOS_DB_KEY`
- ✅ `COSMOS_DB_NAME`
- ✅ `COSMOS_CONTAINER_ID`
- ✅ `APPLICATIONINSIGHTS_CONNECTION_STRING`

### CORS Configuration (Blob Storage)
- ✅ Configured for SWA origin: `https://kind-sand-0ab0a5003.7.azurestaticapps.net`
- ✅ Allows: GET, PUT, DELETE, POST, HEAD, MERGE, OPTIONS

---

## Test Results

### Working Endpoints
- ✅ `/api/health` → 200 OK
- ✅ `/api/samples` (GET) → 200 OK, returns uploaded samples
- ✅ `/api/uploads/pptx/initiate` → 200 OK, returns SAS upload URL
- ✅ `/api/samples/pptx` (POST finalize) → 202 Accepted
- ✅ Blob PUT via SAS token → 201 Created (blob successfully uploaded)

### Failing Endpoints
- ❌ `/api/pptx/process` → 500 Internal Server Error
- ❌ `/api/samples/{id}` (DELETE) → 404 when sample only in memory (expected until worker runs)

### Test Data
- Sample ID: `776e56a1-6e93-4445-b66a-9ec2194dc008`
- Blob: `samples/pptx/776e56a1-6e93-4445-b66a-9ec2194dc008/test_presentation.pptx` (29KB)
- Status: Processing (awaiting worker completion)

---

## Recent Commits

```
f851d56 chore: trigger deployment for pptxParser fix
18bb9e0 fix: remove duplicate 'use strict' and imports in pptxParser causing SyntaxError
db5037f fix: add 'proposal' mapping to template filename map
fc44f64 chore: apply cosmos db settings to swa
395fa96 chore: trigger final production deployment
```

---

## Recommended Next Steps

### 1. Investigate SWA Deployment Status
```bash
az staticwebapp show --name swa-fh-cg-qa --resource-group CG_QA_rg
az staticwebapp environment list --name swa-fh-cg-qa --resource-group CG_QA_rg
```

### 2. Check Azure Functions Logs
- Go to Azure Portal → Static Web Apps → swa-fh-cg-qa → Monitoring → Function Logs
- Look for errors in `/api/pptx/process` function execution

### 3. Verify Function Deployment
- Check if function is actually deployed in the SWA managed API
- May need to manually restart the SWA or rebuild the app

### 4. Test with Minimal Payload
- Create a test that calls the function with minimal params to isolate the issue
- Check if it's a specific module that's causing the 500

---

## Upload Test Summary

**Scenario**: User uploads `test_presentation.pptx` with template type "Default"

**What Works**:
1. ✅ File selected in upload form
2. ✅ SAS token generated for blob upload
3. ✅ Blob uploaded to Azure Storage (verified with `az storage blob list`)
4. ✅ Sample record created in memory (visible in UI)
5. ✅ Sample persists across page refreshes (in memory)

**What Fails**:
6. ❌ Background worker `/api/pptx/process` returns 500
7. ❌ Sample status remains "processing" indefinitely
8. ❌ Quality analysis doesn't run
9. ❌ Sample not persisted to Cosmos DB

**Expected After Fix**:
- Worker processes PPTX
- Extracts metadata and content
- Runs QA analysis
- Persists results to Cosmos DB
- Sample status changes to "completed"
- Quality score displayed (not 0%)
- Delete/refresh properly reflect database state

---

## Files Modified in This Session

1. `src/api/lib/cosmosClient.js` - Added proposal template mapping
2. `src/api/lib/pptxParser.js` - Removed duplicate imports
3. `src/api/pptx-process/function.json` - Verified (no changes needed)

## Testing Files Created

- `test-api.js` - Basic API endpoint tester
- `test-pptx-process.js` - Direct worker endpoint tester
- `test-local-pptx.js` - Local module import tester
- `test_presentation.pptx` - Test PPTX file for uploads

---

## Conclusion

Two critical issues have been fixed:
1. Template mapping for "proposal" type documents
2. Syntax error (duplicate imports) in PPTX parser

However, the main endpoint (`/api/pptx/process`) is still returning a generic 500 error. The error appears to be at the SWA infrastructure level rather than in the function code itself. Next step is to verify the deployment status and check Azure Functions logs to determine why the function isn't executing despite having no syntax errors and all modules loading correctly.

The blob upload and sample creation workflows are functioning correctly, so the upload pipeline is partially operational. Once the worker is fixed, the end-to-end flow should work as designed.
