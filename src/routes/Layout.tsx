import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const OFFSET_PAGES = ["/profile", "/billing-history"];

const Layout = () => {
  const location = useLocation();
  const needsOffset = OFFSET_PAGES.some((p) => location.pathname.startsWith(p));
  return (
    <div className="min-h-screen w-full overflow-hidden bg-[#05050a]">
      <Navbar />
      <main className={`mx-auto w-full ${needsOffset ? "pt-[4.5rem]" : ""}`}>
        <Outlet key={location.pathname}  />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;