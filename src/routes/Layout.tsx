import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Layout = () => {
  const location = useLocation();
  return (
    <div className="min-h-screen w-full overflow-hidden bg-[#05050a]">
      <Navbar />
      <main className="mx-auto w-full">
        <Outlet key={location.pathname}  />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;