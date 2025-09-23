import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './router'
import { useSessionUsage } from './hooks/useSessionUsage'


function App() {
  useSessionUsage()
  return (
    <BrowserRouter basename={__BASE_PATH__}>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App