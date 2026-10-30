import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Link, Outlet, Route, Routes, useLocation } from "react-router-dom";
import "./index.css";
import { ThemeProvider } from "./lib/theme";
import { AuthProvider, RequireRole } from "./lib/auth";
import { ContentProvider } from "./lib/content";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ChatWidget from "./components/ChatWidget";
import Home from "./pages/Home";
import About from "./pages/About";
import Vacancies, { JobDetail } from "./pages/Vacancies";
import Contact from "./pages/Contact";
import { SignIn, SignUp } from "./pages/Auth";
import CandidateDashboard from "./pages/dashboard/Candidate";
import RecruiterDashboard from "./pages/dashboard/Recruiter";
import AdminDashboard from "./pages/dashboard/Admin";

function Layout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  const isDash = pathname.startsWith("/dashboard");
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand-700 focus:px-4 focus:py-2 focus:text-white">Skip to content</a>
      <Navbar />
      <main id="main" className="flex-1"><Outlet /></main>
      {!isDash && <Footer />}
      <ChatWidget />
    </div>
  );
}

const NotFound = () => (
  <div className="container-x grid min-h-[60vh] place-items-center py-20 text-center">
    <div><p className="text-7xl font-extrabold text-brand-700">404</p><h1 className="mt-3 text-2xl font-bold">Page not found</h1><p className="mt-2 muted">The page you're looking for doesn't exist.</p><Link to="/" className="btn-primary mt-6">Go home</Link></div>
  </div>
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ContentProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/vacancies" element={<Vacancies />} />
                <Route path="/vacancies/:id" element={<JobDetail />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/dashboard/candidate" element={<RequireRole roles={["candidate"]}><CandidateDashboard /></RequireRole>} />
                <Route path="/dashboard/recruiter" element={<RequireRole roles={["recruiter"]}><RecruiterDashboard /></RequireRole>} />
                <Route path="/dashboard/admin" element={<RequireRole roles={["admin"]}><AdminDashboard /></RequireRole>} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </ContentProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
