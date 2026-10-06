import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { MarkDefs } from '@/ui/Mark'
import { Landing } from '@/routes/landing/Landing'

// The studio carries the inspector and its controls; visitors who only watch the showcase never load it.
const Studio = lazy(() => import('@/routes/studio/Studio').then((m) => ({ default: m.Studio })))

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <MarkDefs />
      <Suspense fallback={<div style={{ minHeight: '100svh', background: 'var(--dark-0)' }} />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
