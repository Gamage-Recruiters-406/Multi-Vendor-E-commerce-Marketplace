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

          {/* Home Page */}
          <Route path="/" element={<h1>Home Page</h1>} />

          {/* Authentication Routes */}
          <Route path="/login" element={<SigninPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Layout */}
          <Route path="/" element={<Footer />} />

          {/* Vendor Routes */}
          <Route path="/vendor/product_management" element={<VendorProductManagemnt />} />
          <Route path="/vendor/products" element={<Products />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
