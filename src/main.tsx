import { createRoot } from 'react-dom'
import App from './app'
import './index.scss'

const root = createRoot(document.getElementById('app')!)
root.render(<App />)
