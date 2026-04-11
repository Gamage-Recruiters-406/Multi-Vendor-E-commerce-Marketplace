import { 
  BrowserRouter as Router, 
  Routes, 
  Route } from 'react-router-dom'
import SigninPage from './pages/login/SigninPage'
import SignupPage from './pages/login/SignupPage'
import './App.css'
import VendorProductManagemnt from './pages/Vendor/ProductManagement'
import Products from './pages/Vendor/Products'



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
