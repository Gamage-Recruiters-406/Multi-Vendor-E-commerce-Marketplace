import { 
  BrowserRouter as Router, 
  Routes, 
  Route } from 'react-router-dom'
import SigninPage from './pages/login/SigninPage'
import SignupPage from './pages/login/SignupPage'
import './App.css'



function App() {
  return (
    <>
      <Router>
        <Routes>

          {/* Auth Routes */}
          <Route path="/login" element={<SigninPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
        </Routes>
      </Router>
    </>
  )
}

export default App
