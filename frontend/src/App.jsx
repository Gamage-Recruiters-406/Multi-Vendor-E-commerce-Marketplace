import { 
  BrowserRouter as Router, 
  Routes, 
  Route } from 'react-router-dom'
import Footer from './components/Layouts/Footer'
import './App.css'



function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Footer />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
