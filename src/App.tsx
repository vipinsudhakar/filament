import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { MarkDefs } from '@/components/Mark'
import { Home } from '@/pages/home/Home'

// The studio carries the inspector and its controls; visitors who only watch the showcase never load it.
const Studio = lazy(() => import('@/pages/studio/Studio').then((m) => ({ default: m.Studio })))

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <MarkDefs />
      <Suspense fallback={<div style={{ minHeight: '100svh', background: 'var(--dark-0)' }} />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
