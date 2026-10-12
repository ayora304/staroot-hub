import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'
import { ErrorBoundary } from './app/ErrorBoundary'
import { syncEngine } from './core/offline'
import { registerApprovalHandlers } from './modules/approvals'
import { registerSiteHandlers } from './modules/site-progress/services/site-progress.service'
import { registerInventoryHandlers } from './modules/inventory/services/inventory.service'
import './styles/index.css'

// Register one sync handler per action type here as each phase ships, e.g.
//   syncEngine.registerHandler('approval.create', sendApproval)
// Handlers must be registered BEFORE start(). Called once at module level
// (not in an effect) so StrictMode cannot start it twice.
registerApprovalHandlers()
registerSiteHandlers()
registerInventoryHandlers()
syncEngine.start()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
