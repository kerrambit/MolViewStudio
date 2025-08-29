import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import './index.css'
import routes from './router/routes.tsx'
import { UserSettingsProvider } from './services/UserSettingsProvider.tsx'

const router = createMemoryRouter(routes);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserSettingsProvider>
      <RouterProvider router={router} />
    </UserSettingsProvider>
  </StrictMode>,
)
