import { render } from 'preact'
import './styles/index.css'
import { App } from './app.jsx'
import { BrowserRouter } from 'react-router-dom'

render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  document.getElementById('app')
)
