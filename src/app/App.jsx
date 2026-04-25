import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import IdeasPage from './ideas/IdeasPage.jsx'
import IdeasAdmin from './ideas/IdeasAdmin.jsx'
import QualityChecker from './quality-checker/QualityChecker.jsx'
import TemplateLibrary from './quality-checker/TemplateLibrary.jsx'

function Home() {
  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>CG Quality Checker</h1>
      <p>Capgemini Quality Assurance Platform for Document Analysis</p>
      <nav style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Link to="/checker">Document Checker →</Link>
        <Link to="/templates">Template Library →</Link>
        <Link to="/ideas">Ideas Board →</Link>
      </nav>
    </main>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/checker" element={<QualityChecker />} />
        <Route path="/templates" element={<TemplateLibrary />} />
        <Route path="/ideas" element={<IdeasPage />} />
        <Route path="/ideas/admin" element={<IdeasAdmin />} />
      </Routes>
    </BrowserRouter>
  )
}
