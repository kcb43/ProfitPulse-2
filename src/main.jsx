import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SpeedInsights } from '@vercel/speed-insights/react'
import App from '@/App.jsx'
import '@/index.css'

// Build stamp (useful for debugging cache/deploy issues in production).
// If you don't see this in the browser console, you're not on the latest deployed JS bundle.
console.log('🟢 WEB BUILD: 2026-01-02-dashboard-autoload-05b1898');

// Sensible defaults to reduce refetch churn and make the app feel faster.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Critical: many pages use `initialData: []` which can otherwise be treated as fresh and skip the first fetch.
      // Force a fetch on mount so Dashboard/Sales/Inventory load without needing a page switch.
      refetchOnMount: 'always',
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