# Sprint 12 Checklist

## Goal

Turn the generic ERP coverage for `institutions`, `library`, and `transport` into dedicated product workspaces with clear feature ownership, route entries, and API boundaries.

## Why This Is Next

- `frontend/src/pages/Institutions`, `frontend/src/pages/Library`, and `frontend/src/pages/Transport` are currently empty.
- `frontend/src/routes/AppRoutes.tsx` has no dedicated routes for those modules.
- The backend-facing coverage already exists inside the generic ERP workspace in:
  - `frontend/src/pages/Modules/index.tsx`
  - `frontend/src/features/erp/OperationsPanel.tsx`
  - `frontend/src/features/erp/ModuleReportsPanel.tsx`
  - `frontend/src/features/erp/erpApi.ts`

## Scope

### 1. Institutions Workspace

- Create `frontend/src/pages/Institutions/index.tsx`
- Add `/institutions` route in `frontend/src/routes/AppRoutes.tsx`
- Add a dedicated institutions feature layer:
  - `frontend/src/features/institutions/institutionsApiSlice.ts`
  - `frontend/src/features/institutions/institutionsApi.ts`

Shared and cacheable data should be RTK:
- schools
- tenant domains
- tenant subscriptions
- subscription plans
- academic years
- terms
- departments
- grade levels
- sections
- subjects
- rooms

Keep local API helpers for workflow-style actions only:
- bulk save flows
- multi-step onboarding/setup flows
- domain verification or tenant provisioning actions
- CSV/export/import actions if they are page-specific

Suggested UI batches:
- Batch 1: schools, subscription plans, tenant subscriptions
- Batch 2: academic years, terms, departments, grade levels, sections
- Batch 3: subjects, rooms, tenant domains

### 2. Library Workspace

- Create `frontend/src/pages/Library/index.tsx`
- Add `/library` route in `frontend/src/routes/AppRoutes.tsx`
- Create:
  - `frontend/src/features/library/libraryApiSlice.ts`
  - `frontend/src/features/library/libraryApi.ts`

Shared and cacheable data should be RTK:
- book categories
- books
- library members
- book issues
- book reservations
- overdue report inputs if reused across widgets
- analytics summary if shown in multiple panels

Keep local API helpers for workflow-style actions only:
- issue/return/reserve action submissions
- late-fee automation trigger
- export/download actions

Suggested UI batches:
- Batch 1: books and categories
- Batch 2: members and issue/reservation desk
- Batch 3: overdue analytics and late-fee automation

### 3. Transport Workspace

- Create `frontend/src/pages/Transport/index.tsx`
- Add `/transport` route in `frontend/src/routes/AppRoutes.tsx`
- Create:
  - `frontend/src/features/transport/transportApiSlice.ts`
  - `frontend/src/features/transport/transportApi.ts`

Shared and cacheable data should be RTK:
- vehicles
- stops
- routes
- route stops
- student transport allocations
- vehicle maintenance
- occupancy/utilization snapshots if reused across panels

Keep local API helpers for workflow-style actions only:
- route planning commands
- maintenance workflow transitions
- report export/download actions

Suggested UI batches:
- Batch 1: vehicles, routes, stops
- Batch 2: route-stop mapping and student allocations
- Batch 3: maintenance and reporting

## Navigation Changes

- Add route entries for `/institutions`, `/library`, and `/transport`
- Update dashboard quick links where role-specific navigation should prefer dedicated pages over `/modules`
- Keep `/modules` as fallback admin/ERP console, not the main product surface

## API Ownership Rules

- Use RTK Query for data reused across screens, filters, selectors, drawers, and summary widgets
- Keep one feature-owned local API file for page-local mutations and action endpoints
- Do not call `apiClient` directly from page or component files
- Do not keep duplicate endpoint ownership in both RTK and local helpers unless the local helper is action-only

## Definition Of Done

- Dedicated pages exist for institutions, library, and transport
- Routes are wired and reachable from the main app
- Shared list/reference APIs are served by RTK hooks
- Local action endpoints are isolated in feature API files
- No direct `apiClient` calls remain in the new pages/components
- Generic ERP module views are no longer the only UI for these domains
- `npm.cmd run build` passes
