import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import ProductCreate from "./pages/product _create/ProductCreate";
import { Toaster } from "react-hot-toast";
import SigninPage from "./pages/login/SigninPage";
import SignupPage from "./pages/login/SignupPage";
import VendorProductManagemnt from "./pages/Vendor/ProductManagement";
import Products from "./pages/Vendor/Products";
import CreateStore from "./pages/Vendor/CreateStore";
import ViewStore from "./pages/Vendor/ViewStore";
import Announcements from "./pages/Announcements";
import CreateAnnouncement from "./pages/CreateAnnouncement";
import EditAnnouncement from "./pages/EditAnnouncement";
import { AdminDashboard } from "./pages/AdminDashboard/AdminDashboard";
import VendorProfile from "./pages/Profiles/vendorProfile";
import Home from "./pages/Home";
import CheckoutPage from "./pages/CheckoutPage";
import VendorDashboard from "./pages/VendorDashboard";
import BuyerProductDetailsPage from "./pages/Buyer/BuyerProductDetailsPage";

import "./App.css";

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          {/* Home Page */}
          <Route path="/" element={<Home />} />

          {/* Authentication Routes */}
          <Route path="/login" element={<SigninPage />} />

          <Route path="/signup" element={<SignupPage />} />

          {/* Layout 
          <Route path="/" element={<Footer />} />*/}

          <Route path="/register" element={<SignupPage />} />

          {/* Vendor Module (REQ4 & REQ5) */}
          <Route
            path="/vendor/product_management"
            element={<VendorProductManagemnt />}
          />
          <Route path="/vendor/products" element={<Products />} />
          <Route path="/vendor/create-store" element={<CreateStore />} />
          <Route path="/vendor/store/:id" element={<ViewStore />} />
          <Route path="/vendor/profile" element={<VendorProfile />} />

          {/* Vendor Routes */}
          <Route
            path="/vendor/product_management"
            element={<VendorProductManagemnt />}
          />
          <Route path="/vendor/products" element={<Products />} />
          <Route path="/vendor/product_create" element={<ProductCreate />} />

          {/* Admin Module */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/announcements" element={<Announcements />} />
          <Route
            path="/admin/announcements/create"
            element={<CreateAnnouncement />}
          />
          <Route
            path="/admin/announcements/edit/:id"
            element={<EditAnnouncement />}
          />
          <Route path="/vendor/dashboard" element={<VendorDashboard />} />
          <Route
            path="/buyer/productdetails/:id"
            element={<BuyerProductDetailsPage />}
          />

          {/* Checkout */}
          <Route path="/checkout" element={<CheckoutPage />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
