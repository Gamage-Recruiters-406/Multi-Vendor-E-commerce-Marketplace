import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Footer from "./components/Layouts/Footer";
import "./App.css";
import VendorDashboard from "./pages/VendorDashboard";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Footer />} />
          <Route path="/vendor/dashboard" element={<VendorDashboard />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
