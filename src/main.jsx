import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SpeedInsights } from '@vercel/speed-insights/react'
import App from '@/App.jsx'
import '@/index.css'

// Build stamp (useful for debugging cache/deploy issues in production).
// If you don't see an updated SHA after a deploy, your browser is serving stale JS.
// eslint-disable-next-line no-undef
const PO_BUILD_SHA = typeof __PO_BUILD_SHA__ !== 'undefined' ? __PO_BUILD_SHA__ : 'unknown';
// eslint-disable-next-line no-undef
const PO_BUILD_TIME = typeof __PO_BUILD_TIME__ !== 'undefined' ? __PO_BUILD_TIME__ : 'unknown';
// eslint-disable-next-line no-console
console.log(`🟢 WEB BUILD: ${PO_BUILD_SHA} @ ${PO_BUILD_TIME}`);
if (typeof window !== 'undefined') {
  window.__PO_WEB_BUILD__ = { sha: PO_BUILD_SHA, time: PO_BUILD_TIME };
}

// Sensible defaults to reduce refetch churn and make the app feel faster.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Default: fetch on mount if data is stale. (We prefer `placeholderData` over `initialData` on pages.)
      refetchOnMount: true,
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <App />
    {import.meta.env.VITE_ENABLE_SPEED_INSIGHTS === 'true' ? <SpeedInsights /> : null}
  </QueryClientProvider>
)