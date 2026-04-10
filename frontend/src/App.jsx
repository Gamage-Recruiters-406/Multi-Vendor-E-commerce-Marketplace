import { 
  BrowserRouter as Router, 
  Routes, 
  Route } from 'react-router-dom'
import Footer from './components/Layouts/Footer'
import './App.css'
import VendorProductManagemnt from './pages/Vendor/ProductManagement'
import Products from './pages/Vendor/Products'



function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Footer />} />
          <Route path="/vendor/product_management" element={<VendorProductManagemnt />} />
          <Route path="/vendor/products" element={<Products />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
