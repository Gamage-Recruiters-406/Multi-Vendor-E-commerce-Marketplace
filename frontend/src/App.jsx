import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { Toaster } from 'react-hot-toast';
import SigninPage from "./pages/login/SigninPage";
import SignupPage from "./pages/login/SignupPage";
import VendorProductManagemnt from "./pages/Vendor/ProductManagement";
import Products from "./pages/Vendor/Products";
import CreateStore from "./pages/Vendor/CreateStore";
import ViewStore from "./pages/Vendor/ViewStore";
import Announcements from "./pages/Announcements";
import CreateAnnouncement from "./pages/CreateAnnouncement";
import EditAnnouncement from "./pages/EditAnnouncement";

import "./App.css";

function App() {
  return (  
    <>
      <Toaster position="top-right" />
      <Router>
        <Routes>

          {/* Home Page Placeholder */}
          <Route path="/" element={<h1>Home Page</h1>} />

          {/* Authentication Routes */}
          <Route path="/login" element={<SigninPage />} />
          <Route path="/register" element={<SignupPage />} />

          {/* Vendor Module (REQ4 & REQ5) */}
          <Route path="/vendor/product_management" element={<VendorProductManagemnt />} />
          <Route path="/vendor/products" element={<Products />} />
          <Route path="/vendor/create-store" element={<CreateStore />} />
          <Route path="/vendor/store/:id" element={<ViewStore />} />
      
          {/* Vendor Routes */}
          <Route path="/vendor/product_management" element={<VendorProductManagemnt />} />
          <Route path="/vendor/products" element={<Products />} />
            
          {/* Admin Module */}
          <Route path="/admin/announcements" element={<Announcements />} />
          <Route path="/admin/announcements/create" element={<CreateAnnouncement />} />
          <Route path="/admin/announcements/edit/:id" element={<EditAnnouncement />} />
          
        </Routes>
      </Router>
    </>
  )
}

export default App
