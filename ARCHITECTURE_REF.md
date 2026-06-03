# DuckLoad Architecture Reference

## March 2026 DRY Refactor - Comprehensive Guide

**Last Updated:** March 2026
**Version:** 1.0.0
**Status:** Production Ready

---

## Table of Contents

1. [Architectural Overview](#architectural-overview)
2. [Service Layer Standards](#service-layer-standards)
3. [Data Fetching & State Management](#data-fetching--state-management)
4. [Utility & Coding Standards](#utility--coding-standards)
5. [Common Workflows](#common-workflows)
6. [Security & Session Management](#security--session-management)

---

## Architectural Overview

### Session Management: LocalStorage → HttpOnly Cookies

The application has transitioned from LocalStorage-based session management to **HttpOnly Cookies** for enhanced security.

| Aspect                | LocalStorage                 | HttpOnly Cookies                 |
| --------------------- | ---------------------------- | -------------------------------- |
| **XSS Vulnerability** | ❌ Accessible via JavaScript | ✅ Inaccessible to JavaScript    |
| **CSRF Protection**   | ❌ Manual handling required  | ✅ Automatic with SameSite flag  |
| **Server Control**    | ❌ Client-side only          | ✅ Server can invalidate anytime |
| **Refresh Tokens**    | ❌ Exposed in storage        | ✅ Secure, automatic refresh     |

**Implementation:**

- Access tokens stored in HttpOnly cookies (set by server)
- Refresh tokens stored in HttpOnly cookies (set by server)
- `withCredentials: true` in Axios config ensures cookies are sent with requests
- No manual token management in client code

### The Bootstrapper Pattern

The **Bootstrapper** service initializes critical app data once on successful authentication using a **Promise Singleton** pattern.

```typescript
// First call - fetches data
const data1 = await BootstrapApp();

// Second call - returns same pending promise (no extra requests)
const data2 = await BootstrapApp();

// Both resolve to identical data
```

**Why Promise Singleton?**

- Prevents redundant API calls when multiple components initialize simultaneously
- Ensures consistent data across the app
- Reduces network overhead on app startup

**Bootstrap Data Includes:**

- User profile (from `/me` endpoint)
- Slip statuses and categories
- Appointment statuses and categories
- Regions (for location dropdowns)

**Location:** `src/services/bootstrapper.ts`

### Axios Interceptor Logic

The Axios interceptor handles **401 Unauthorized** responses with automatic token refresh.

```
Request → Interceptor (add camelCase→snake_case conversion)
  ↓
Response → Check status
  ├─ 200-399: Return response ✓
  ├─ 401: Attempt refresh
  │   ├─ Refresh succeeds: Retry original request
  │   └─ Refresh fails: Reject (AuthProvider handles redirect)
  └─ Other errors: Reject with precision logging
```

**Critical Behavior:**

- 401 errors are **always rejected** (never swallowed)
- Rejection allows `useMe` hook to transition to `"error"` state
- AuthProvider detects error state and redirects to `/login`
- Prevents infinite loading screens

**Location:** `src/lib/api.ts`

---

## Service Layer Standards

### The PascalCase Rule: HTTP Method + Resource

All service functions follow the naming convention: **`[HTTP Method][Resource]`**

| HTTP Method | Resource           | Function Name            | Example                              |
| ----------- | ------------------ | ------------------------ | ------------------------------------ |
| GET         | Current User       | `GetMe`                  | `GetMe()`                            |
| GET         | User by ID         | `GetUserById`            | `GetUserById(id)`                    |
| POST        | Slip               | `PostSlip`               | `PostSlip(data)`                     |
| PATCH       | Appointment Status | `PatchAppointmentStatus` | `PatchAppointmentStatus(id, status)` |
| DELETE      | Account            | `DeleteAccount`          | `DeleteAccount()`                    |

**Benefits:**

- Immediately clear what HTTP method is used
- Prevents confusion between GET and POST operations
- Consistent across all services
- Easy to audit and refactor

### AxiosConfigWithMeta: Logging Metadata

Every service function accepts an optional `config` parameter for error logging.

```typescript
export interface AxiosConfigWithMeta
  extends Partial<InternalAxiosRequestConfig> {
  handlerName?: string; // Function name for logging
  stepName?: string; // Specific step that failed
  _retry?: boolean; // Internal retry flag
}
```

**Usage in Services:**

```typescript
export async function GetMe(config?: AxiosConfigWithMeta): Promise<User> {
  try {
    const response = await apiClient.get(API_ROUTES.users.me, config);
    return response.data;
  } catch (error: any) {
    const handlerName = config?.handlerName || "GetMe";
    const stepName = config?.stepName || "Fetch User";

    throw error;
  }
}
```

**Usage in Hooks:**

```typescript
const { data: user } = useQuery({
  queryFn: () =>
    GetMe({
      handlerName: "useMe",
      stepName: "Fetch Current User",
    }),
});
```

### Precision Logging Format

All errors must follow this exact format:

```
[HandlerName] {Specific Step}: error message
```

**Examples:**

| Scenario              | Log Output                                              |
| --------------------- | ------------------------------------------------------- |
| User fetch fails      | `[useMe] {Fetch Current User}: 401 Unauthorized`        |
| Slip submission fails | `[useSubmitSlip] {Submit Slip}: Network timeout`        |
| Bootstrap fails       | `[BootstrapApp] {Initialize}: Failed to fetch regions`  |
| Token refresh fails   | `[AuthProvider] {Token Refresh}: Invalid refresh token` |

**Why This Format?**

- `[HandlerName]`: Identifies which function/hook failed
- `{Specific Step}`: Pinpoints exact operation that failed
- Enables rapid debugging and error tracking
- Consistent across entire codebase

---

## Data Fetching & State Management

### Query Key Factory (QUERY_KEYS)

Centralized query key definitions prevent magic strings and ensure consistency.

**Location:** `src/config/queryKeys.ts`

**Structure:**

```typescript
export const QUERY_KEYS = {
  users: {
    all: ["users"] as const,
    me: ["users", "me"] as const,
    byId: (id: string) => ["users", "me", id] as const,
  },
  slips: {
    all: ["slips"] as const,
    mySlips: ["slips", "me"] as const,
    stats: ["slips", "stats"] as const,
    byId: (id: number) => ["slips", "id", id] as const,
  },
  // ... more keys
} as const;
```

**Usage:**

```typescript
// ✅ CORRECT: Use factory
useQuery({
  queryKey: QUERY_KEYS.users.me,
  queryFn: () => GetMe(),
});

// ❌ WRONG: Magic string
useQuery({
  queryKey: ["users", "me"],
  queryFn: () => GetMe(),
});
```

**Benefits:**

- Single source of truth for query keys
- Type-safe (TypeScript catches typos)
- Easy to refactor keys globally
- Prevents cache invalidation bugs

### useMe Hydration Guard

The `useMe` hook prevents redirect loops on page refresh by:

1. **Infinite Cache:** `staleTime: Infinity, gcTime: Infinity`
2. **No Retries:** `retry: false` prevents multiple attempts
3. **Timeout Safeguard:** 5-second timeout prevents infinite loading

**Location:** `src/features/users/hooks/useMe.ts`

```typescript
export function useMe({ enabled = true }: { enabled?: boolean }) {
  return useQuery({
    queryKey: QUERY_KEYS.users.me,
    queryFn: async (): Promise<User> => {
      return await userService.GetMe({
        handlerName: "useMe",
        stepName: "Fetch Current User",
      });
    },
    enabled: !!localStorage.getItem("accessToken"),
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
```

**How It Prevents Redirect Loops:**

| Scenario              | Behavior                                           |
| --------------------- | -------------------------------------------------- |
| Session valid         | `status: "success"` → Show app                     |
| Session expired (401) | `status: "error"` → Redirect to login              |
| API timeout           | After 5s → `hasTimedOut: true` → Redirect to login |
| Loading               | Show spinner (not redirect)                        |

### Cache Timing Constants

Different data types have different freshness requirements.

**Location:** `src/config/constants.ts`

```typescript
export const CACHE_TIMING = {
  SHORT: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },
  MEDIUM: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  },
  LONG: {
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  },
  NEVER: {
    staleTime: Infinity,
    gcTime: Infinity,
  },
} as const;
```

**When to Use Each:**

| Timing     | Use Case                 | Examples                           |
| ---------- | ------------------------ | ---------------------------------- |
| **SHORT**  | Frequently changing data | Appointments, slips, user activity |
| **MEDIUM** | Moderately changing data | User preferences, settings         |
| **LONG**   | Stable reference data    | Statuses, categories, locations    |
| **NEVER**  | Critical identity data   | Current user (`/me` endpoint)      |

**Usage:**

```typescript
useQuery({
  queryKey: QUERY_KEYS.slips.all,
  queryFn: () => GetAllSlips(),
  ...CACHE_TIMING.SHORT, // Spread timing config
});
```

---

## Utility & Coding Standards

### The 80-Character Line Limit

All code must maintain a maximum line length of **80 characters** for readability and maintainability.

**Why 80 Characters?**

- Fits on standard terminal windows
- Reduces cognitive load when reading
- Encourages breaking complex logic into smaller pieces
- Improves code review experience

**Examples:**

```typescript
// ✅ CORRECT: Wrapped at 80 characters
const isAuthLoading =
  status === "pending" && !isError && !hasTimedOut;

// ❌ WRONG: Exceeds 80 characters
const isAuthLoading = status === "pending" && !isError && !hasTimedOut;

// ✅ CORRECT: Function parameters wrapped
export async function GetSlipAttachmentDownload(
  slipId: number,
  attachmentId: number,
  config?: AxiosConfigWithMeta,
): Promise<Blob> {
  // ...
}

// ❌ WRONG: Single line exceeds limit
export async function GetSlipAttachmentDownload(slipId: number, attachmentId: number, config?: AxiosConfigWithMeta): Promise<Blob> {
```

### No Magic Numbers or Strings

All constants must be defined in centralized configuration files.

**Location:** `src/config/constants.ts`

```typescript
// ✅ CORRECT: Use constants
const AUTH_TIMEOUT_MS = 5000;
setTimeout(() => setHasTimedOut(true), AUTH_TIMEOUT_MS);

// ❌ WRONG: Magic number
setTimeout(() => setHasTimedOut(true), 5000);

// ✅ CORRECT: Use role constants
const ROLE_ROUTES = {
  1: "/student",
  2: "/student",
};

// ❌ WRONG: Magic numbers
if (user.role.id === 1) navigate("/student");
```

### Dynamic Format12HourTime Utility

Consistent date/time formatting across the app.

**Location:** `src/features/appointments/utils/dateTime.ts`

```typescript
const format12HourTime = (input: string): string => {
  // Handles both ISO dates and HH:mm strings
  // Returns format like "02:30 PM"
};

const toISODateString = (date: Date) => {
  // Returns YYYY-MM-DD format
};
```

**Usage:**

```typescript
// ✅ CORRECT: Use utility
const displayTime = format12HourTime("14:30"); // "02:30 PM"
const displayTime2 = format12HourTime("2024-03-15T14:30:00"); // "02:30 PM"

// ❌ WRONG: Manual formatting
const displayTime = new Date("14:30").toLocaleTimeString();
```

---

## Common Workflows

### How to Add a New API Service

**Step 1: Define API Route**

```typescript
// src/config/apiRoutes.ts
export const API_ROUTES = {
  myFeature: {
    all: "/my-feature",
    byId: (id: number) => `/my-feature/${id}`,
    create: "/my-feature",
    update: (id: number) => `/my-feature/${id}`,
  },
};
```

**Step 2: Create Service Functions**

```typescript
// src/features/myFeature/services/index.ts
import { apiClient, AxiosConfigWithMeta } from "@/lib/api";
import { API_ROUTES } from "@/config/apiRoutes";

export async function GetMyFeatures(config?: AxiosConfigWithMeta) {
  try {
    const response = await apiClient.get(API_ROUTES.myFeature.all, config);
    return response.data;
  } catch (error: any) {
    const handlerName = config?.handlerName || "GetMyFeatures";
    const stepName = config?.stepName || "Fetch Features";

    throw error;
  }
}

export async function PostMyFeature(
  data: MyFeatureData,
  config?: AxiosConfigWithMeta,
) {
  try {
    const response = await apiClient.post(
      API_ROUTES.myFeature.create,
      data,
      config,
    );
    return response.data;
  } catch (error: any) {
    const handlerName = config?.handlerName || "PostMyFeature";
    const stepName = config?.stepName || "Create Feature";

    throw error;
  }
}
```

**Step 3: Add Query Keys**

```typescript
// src/config/queryKeys.ts
export const QUERY_KEYS = {
  myFeature: {
    all: ["myFeature"] as const,
    byId: (id: number) => ["myFeature", "id", id] as const,
  },
};
```

**Step 4: Create Hook**

```typescript
// src/features/myFeature/hooks/useMyFeatures.ts
import { useQuery } from "@tanstack/react-query";
import { GetMyFeatures } from "../services";
import { QUERY_KEYS } from "@/config/queryKeys";
import { CACHE_TIMING } from "@/config/constants";

export function useMyFeatures() {
  return useQuery({
    queryKey: QUERY_KEYS.myFeature.all,
    queryFn: () =>
      GetMyFeatures({
        handlerName: "useMyFeatures",
        stepName: "Fetch Features",
      }),
    ...CACHE_TIMING.SHORT,
  });
}
```

### How to Create a Protected Route with Role-Based Access

**Step 1: Define Role Constants**

```typescript
// src/config/constants.ts
export const ROLE_ROUTES = {
  1: "/student",
  2: "/admin",
} as const;

const ROLE_MAP = {
  1: "student",
  2: "admin",
};
```

**Step 2: Create Protected Route Component**

```typescript
// src/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context";
import { LoadingSpinner } from "@/components/shared";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute = ({
  children,
  requiredRole,
}: ProtectedRouteProps) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Show spinner while loading
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Redirect if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check role if required
  if (
    requiredRole &&
    ROLE_MAP[user.role?.id || 0] !== requiredRole
  ) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
```

**Step 3: Use in Routes**

```typescript
// src/routes/index.tsx
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AdminDashboard from "@/features/admin/pages/Dashboard";

export const routes = [
  {
    path: "/admin/dashboard",
    element: (
      <ProtectedRoute requiredRole="admin">
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
];
```

### How to Log a Multi-Step Process Correctly

**Scenario:** Submitting a form with multiple validation steps

```typescript
export async function submitForm(data: FormData) {
  try {
    // Step 1: Validate
    console.log("[submitForm] {Validate}: Starting validation");
    const validation = validateFormData(data);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "));
    }
    console.log("[submitForm] {Validate}: Validation passed");

    // Step 2: Transform
    console.log("[submitForm] {Transform}: Converting data");
    const payload = transformData(data);
    console.log("[submitForm] {Transform}: Data transformed");

    // Step 3: Submit
    console.log("[submitForm] {Submit}: Sending to API");
    const response = await PostFormData(payload, {
      handlerName: "submitForm",
      stepName: "Submit",
    });
    console.log("[submitForm] {Submit}: Success");

    // Step 4: Update cache
    console.log("[submitForm] {Cache}: Invalidating queries");
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.forms.all,
    });
    console.log("[submitForm] {Cache}: Cache updated");

    return response;
  } catch (error: any) {
    console.error(`[submitForm] {Process}: ${error.message}`);
    throw error;
  }
}
```

**Log Output:**

```
[submitForm] {Validate}: Starting validation
[submitForm] {Validate}: Validation passed
[submitForm] {Transform}: Converting data
[submitForm] {Transform}: Data transformed
[submitForm] {Submit}: Sending to API
[submitForm] {Submit}: Success
[submitForm] {Cache}: Invalidating queries
[submitForm] {Cache}: Cache updated
```

---

## Security & Session Management

### HttpOnly Cookie Flow

```
1. User logs in
   ↓
2. Server validates credentials
   ↓
3. Server sets HttpOnly cookies (access + refresh tokens)
   ↓
4. Browser automatically includes cookies in requests
   ↓
5. Axios interceptor checks response status
   ├─ 200-399: Success
   ├─ 401: Attempt refresh
   │   ├─ Success: Retry original request
   │   └─ Fail: Reject (redirect to login)
   └─ Other: Reject with error
```

### Token Refresh Strategy

> **CRITICAL:** Never store tokens in LocalStorage. Always use HttpOnly cookies set by the server.

**Automatic Refresh Flow:**

1. Request fails with 401
2. Axios interceptor calls `/auth/refresh`
3. Server validates refresh token (from cookie)
4. Server returns new access token (in cookie)
5. Original request is retried automatically
6. If refresh fails, user is redirected to login

**Location:** `src/lib/api.ts`

### Session Persistence on Refresh

The app prevents redirect loops on page refresh through:

1. **useMe Query Configuration:**
   - `retry: false` - No automatic retries
   - `staleTime: Infinity` - Never refetch
   - `gcTime: Infinity` - Keep in cache forever

2. **AuthProvider Timeout Safeguard:**
   - 5-second timeout prevents infinite loading
   - If auth check takes too long, force loading to false
   - Allows redirect to login instead of app lockout

3. **ProtectedRoute Logic:**
   - Show spinner while `isLoading === true`
   - Only redirect when `isLoading === false` AND `!user`
   - Never redirect during loading state

**Location:** `src/context/AuthContext.tsx`

---

## Best Practices Checklist

- [ ] All service functions use `[HTTP Method][Resource]` naming
- [ ] All service functions accept `config?: AxiosConfigWithMeta`
- [ ] All errors logged as `[HandlerName] {Step}: message`
- [ ] All lines ≤ 80 characters
- [ ] No magic numbers or strings (use constants)
- [ ] Query keys use `QUERY_KEYS` factory
- [ ] Cache timing uses `CACHE_TIMING` constants
- [ ] Protected routes check `isLoading` before redirecting
- [ ] Date/time formatting uses `format12HourTime` utility
- [ ] Bootstrap only called after successful auth
- [ ] Axios interceptor properly rejects 401 errors
- [ ] HttpOnly cookies used for token storage

---

## Quick Reference

| Concept          | Location     | Key File                                      |
| ---------------- | ------------ | --------------------------------------------- |
| Service naming   | All services | `src/features/*/services/`                    |
| Query keys       | Centralized  | `src/config/queryKeys.ts`                     |
| Cache timing     | Centralized  | `src/config/constants.ts`                     |
| Axios config     | API client   | `src/lib/api.ts`                              |
| Auth context     | Global       | `src/context/AuthContext.tsx`                 |
| Protected routes | Components   | `src/components/ProtectedRoute.tsx`           |
| Bootstrapper     | Services     | `src/services/bootstrapper.ts`                |
| Date formatting  | Utilities    | `src/features/appointments/utils/dateTime.ts` |

---

**Document Version:** 1.0.0
**Last Updated:** March 2026
**Maintained By:** DuckLoad Development Team
