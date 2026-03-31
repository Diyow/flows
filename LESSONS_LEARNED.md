# FLOWS Project: Lessons Learned

> A comprehensive reflection on technical insights gained during development of the FLOWS Flood Monitoring System.

---

## 1. Real-Time Architecture: Push Beats Poll

### Title
**"Real-Time Isn't Fast Internet — It's Eliminating Wait Time"**

### Context
We needed live water level and flow rate data displayed to users. Initially, we used interval-based polling (`setInterval` every 5 seconds), but discovered architectural patterns matter more than raw network speed.

### What We Learned

| Approach | Mechanism | Typical Latency | Resource Usage |
|----------|-----------|-----------------|----------------|
| **Polling** | Client repeatedly asks "Any new data?" | Interval + RTT (~1-5s) | High (constant requests) |
| **Snapshot Listeners** | Server pushes when data changes | Near-instant (~100-500ms) | Low (persistent connection) |

**Code Evidence:**
```typescript
// ❌ Polling (less efficient)
setInterval(() => {
    fetch('/api/readings').then(...)
}, 5000);

// ✅ Snapshot Listener (real-time)
onSnapshot(collection(db, 'readings'), (snapshot) => {
    updateUI(snapshot.docs);  // Automatically called on change
});
```

### Key Takeaway
> Push-based architectures (WebSockets, Firebase `onSnapshot`) will always outperform pull-based (polling) for live data, regardless of network speed.

---

## 2. Singleton Pattern for Third-Party Service Initialization

### Title
**"Initialize Once, Use Everywhere"**

### Context
Firebase SDK creates connections, authenticates, and sets up listeners. Initializing it multiple times causes memory leaks, duplicate connections, and race conditions.

### What We Learned
Using the **Singleton Pattern** ensures a single Firebase instance across the entire application:

```typescript
// lib/firebase.ts
let db: Firestore | null = null;
let initialized = false;

export const initializeFirebase = () => {
    if (initialized) {
        return { app, db, auth };  // Return existing instance
    }
    // ... initialization logic
    initialized = true;
    return { app, db, auth };
};
```

### Key Takeaway
> For expensive resources (database connections, API clients), use singleton patterns to prevent duplicate initialization and ensure consistent state.

---

## 3. Graceful Degradation with Fallback Strategies

### Title
**"Plan for Failure — Cache as a Safety Net"**

### Context
External APIs (OpenWeatherMap, Firebase) can fail due to rate limits, network issues, or service outages. The application should remain functional.

### What We Learned
Implement **multi-layer fallback** strategy:

1. **Try fresh data** from API
2. **Use cached data** if API fails
3. **Show stale data with warning** rather than error state

```typescript
// useWeather.ts
try {
    const data = await fetch(weatherAPI);
    localStorage.setItem(cacheKey, JSON.stringify(data));  // Cache success
} catch (err) {
    // Fallback to stale cache
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        setWeather(JSON.parse(cached));  // Better than nothing
    }
}
```

### Key Takeaway
> Stale data is often better than no data. Design systems to degrade gracefully rather than fail completely.

---

## 4. Hydration Mismatch Prevention in SSR

### Title
**"Server and Client Must Agree — Or Wait"**

### Context
Next.js renders pages on the server first, then hydrates on the client. If server and client render different content (e.g., language from localStorage), React throws hydration errors.

### What We Learned
Use a **mounted flag** to delay client-specific rendering:

```typescript
// LanguageContext.tsx
const [mounted, setMounted] = useState(false);

useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('language');  // Client-only
    if (saved) setLanguage(saved);
}, []);

if (!mounted) {
    return <Provider value={{ language: 'en' }}>{children}</Provider>;  // Default for SSR
}
```

### Key Takeaway
> In SSR frameworks, defer client-specific state (localStorage, browser APIs) until after hydration to prevent mismatches.

---

## 5. Environment-Based Configuration

### Title
**"Configuration Should Be External, Not Hardcoded"**

### Context
API keys, database URLs, and feature flags differ between development, staging, and production.

### What We Learned
Use **environment variables** with validation:

```typescript
// Validate before use
export const isFirebaseConfigured = (): boolean => {
    return !!(
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'your_api_key_here'
    );
};
```

**Structure:**
- `.env.local` — Local development (git-ignored)
- `.env.example` — Template for required variables
- Runtime checks prevent crashes from missing config

### Key Takeaway
> Never hardcode secrets. Validate environment variables at runtime and fail fast with clear error messages.

---

## 6. Smart Caching Strategies for External APIs

### Title
**"Not Everything Needs Real-Time — Cache What Makes Sense"**

### Context
Weather data doesn't change every second, but calling the API 60 times/hour is wasteful and hits rate limits.

### What We Learned
Implement **time-based cache invalidation**:

```typescript
// useWeather.ts
const CACHE_DURATION = 30 * 60 * 1000;  // 30 minutes

const cached = localStorage.getItem(cacheKey);
if (cached) {
    const { lastFetched } = JSON.parse(cached);
    if (Date.now() - lastFetched < CACHE_DURATION) {
        return cached;  // Use cache, skip API call
    }
}
```

| Data Type | Recommended Cache Duration |
|-----------|---------------------------|
| Weather forecast | 30 minutes |
| User settings | Until changed + real-time sync |
| Sensor readings | Real-time (no cache) |

### Key Takeaway
> Match cache duration to data volatility. High-frequency data needs real-time; slow-changing data benefits from aggressive caching.

---

## 7. Component Props Over Hardcoding

### Title
**"Make Components Flexible with Props"**

### Context
Initially, components like `SensorMap` had hardcoded coordinates. When we needed dynamic location management, refactoring was painful.

### What We Learned
Design components to receive configuration via props:

```diff
- const SENSOR_LOCATION = { lat: -8.7115, lng: 115.2277 };  // Hardcoded
- function SensorMap() { ... }

+ interface SensorMapProps {
+     location: { name: string; lat: number; lng: number };
+     status?: 'safe' | 'warning' | 'danger';
+ }
+ function SensorMap({ location, status }: SensorMapProps) { ... }
```

### Key Takeaway
> Design components for reusability from the start. Props > hardcoded values.

---

## 8. Custom Hooks for State Separation

### Title
**"Separate Concerns — One Hook, One Responsibility"**

### Context
Managing water data, weather, location, and admin users in component state leads to bloated components and duplicated logic.

### What We Learned
Create **purpose-specific hooks**:

| Hook | Responsibility |
|------|----------------|
| `useWaterData` | Sensor readings, thresholds, status |
| `useWeather` | Weather API, forecast caching |
| `useLocation` | Sensor location management |
| `useAdminUsers` | Admin CRUD operations |

**Benefits:**
- Reusable across components
- Testable in isolation
- Clear separation of concerns

### Key Takeaway
> Extract related logic into custom hooks. Components should orchestrate, not contain business logic.

---

## 9. Internationalization Architecture

### Title
**"Plan for Multiple Languages Early"**

### Context
Adding multi-language support after development requires touching every component with text.

### What We Learned
Use a **translation function pattern**:

```typescript
// Usage in components
const { t } = useTranslation();
return <h1>{t('dashboard.title')}</h1>;

// Translation function with parameter support
const t = (key: string, params?: Record<string, string>) => {
    let text = translations[language][key];
    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            text = text.replace(`{${k}}`, v);
        });
    }
    return text;
};
```

### Key Takeaway
> Centralize all user-facing strings from day one. The `t()` function pattern makes adding languages trivial.

---

## 10. Error Handling Best Practices

### Title
**"Handle Errors Where They Happen, Report Where It Matters"**

### Context
Firebase operations, API calls, and localStorage access can all fail. Silent failures cause confusion; unhandled errors crash the app.

### What We Learned
Handle specific error types with user-friendly messages:

```typescript
try {
    await createUserWithEmailAndPassword(auth, email, password);
} catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    
    if (message.includes('email-already-in-use')) {
        return { error: 'Email already registered' };
    }
    if (message.includes('weak-password')) {
        return { error: 'Password must be at least 6 characters' };
    }
    return { error: message };
}
```

### Key Takeaway
> Catch specific errors, map them to user-friendly messages, and always have a fallback for unexpected errors.

---

## Summary Table

| # | Lesson | Pattern/Technique |
|---|--------|-------------------|
| 1 | Real-time requires push, not poll | Snapshot Listeners |
| 2 | Initialize expensive resources once | Singleton Pattern |
| 3 | Plan for API failures | Graceful Degradation |
| 4 | SSR/CSR consistency | Mounted Flag Pattern |
| 5 | Externalize configuration | Environment Variables |
| 6 | Cache appropriately | Time-based Invalidation |
| 7 | Build flexible components | Props Over Hardcoding |
| 8 | Separate concerns | Custom Hooks |
| 9 | Plan for i18n early | Translation Function Pattern |
| 10 | Handle errors gracefully | Specific Error Mapping |

---

*Document generated from FLOWS Flood Monitoring System codebase analysis.*
