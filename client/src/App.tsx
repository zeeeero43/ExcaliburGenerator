import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "./components/Layout";
import { useLanguage } from "./hooks/useLanguage";
import { useVerification } from "./hooks/useVerification";
import { CustomBotProtection } from "./components/CustomBotProtection";
import { initGA } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProductForm from "./pages/AdminProductForm";
import AdminCategoryForm from "./pages/AdminCategoryForm";
import AdminSubcategoryForm from "./pages/AdminSubcategoryForm";
import AdminSiteImages from "./pages/AdminSiteImages";
import AdminImageManager from "./pages/AdminImageManager";
import AdminContactSettings from "./pages/AdminContactSettings";
import Legal from "./pages/Legal";
import CubaSEO from "./pages/CubaSEO";
import NotFound from "./pages/not-found";

import { OfflineIndicator } from "./components/OfflineIndicator";
import { CartProvider } from "./contexts/CartContext";
// PageViewTracker removed - now using Layout.tsx universal tracking

function Router() {
  const { isLoading } = useLanguage();
  const { needsVerification, isLoading: isVerificationLoading, markAsVerified } = useVerification();
  const [location] = useLocation();
  
  // Track page views with Google Analytics
  useAnalytics();

  // Scroll to top whenever route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Show loading spinner while checking language or verification
  if (isLoading || isVerificationLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-excalibur-blue rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">E</span>
          </div>
          <p className="text-excalibur-gray">Cargando...</p>
        </div>
      </div>
    );
  }

  // Show custom bot protection if needed
  if (needsVerification) {
    return (
      <CustomBotProtection 
        onVerified={markAsVerified}
        isVisible={needsVerification}
      />
    );
  }

  return (
    <Switch>
      {/* Admin Routes - No Layout */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/products/new" component={AdminProductForm} />
      <Route path="/admin/products/:id/edit" component={AdminProductForm} />
      <Route path="/admin/categories/new">
        {() => {
          console.log('AdminCategoryForm route matched: /admin/categories/new');
          return <AdminCategoryForm />;
        }}
      </Route>
      <Route path="/admin/categories/:id/edit">
        {(params) => {
          console.log('AdminCategoryForm route matched: /admin/categories/:id/edit', params);
          return <AdminCategoryForm />;
        }}
      </Route>
      <Route path="/admin/subcategories/new">
        {() => {
          console.log('AdminSubcategoryForm route matched: /admin/subcategories/new');
          return <AdminSubcategoryForm />;
        }}
      </Route>
      <Route path="/admin/subcategories/:id/edit">
        {(params) => {
          console.log('AdminSubcategoryForm route matched: /admin/subcategories/:id/edit', params);
          return <AdminSubcategoryForm />;
        }}
      </Route>
      <Route path="/admin/site-images" component={AdminSiteImages} />
      <Route path="/admin/images" component={AdminImageManager} />
      <Route path="/admin/contact" component={AdminContactSettings} />
      
      {/* Public Routes - With Layout */}
      <Route path="/">
        {() => (
          <Layout>
            <Home />
          </Layout>
        )}
      </Route>
      <Route path="/products">
        {() => (
          <Layout>
            <Products />
          </Layout>
        )}
      </Route>
      <Route path="/product/:slug">
        {() => (
          <Layout>
            <ProductDetail />
          </Layout>
        )}
      </Route>
      <Route path="/about">
        {() => (
          <Layout>
            <About />
          </Layout>
        )}
      </Route>
      <Route path="/contact">
        {() => (
          <Layout>
            <Contact />
          </Layout>
        )}
      </Route>
      <Route path="/legal">
        {() => (
          <Layout>
            <Legal />
          </Layout>
        )}
      </Route>
      <Route path="/cuba-energia-solar">
        {() => (
          <Layout>
            <CubaSEO />
          </Layout>
        )}
      </Route>
      <Route component={() => (
        <Layout>
          <NotFound />
        </Layout>
      )} />
    </Switch>
  );
}

function App() {
  // Initialize Google Analytics when app loads
  useEffect(() => {
    // Verify required environment variable is present
    if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
      console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    } else {
      initGA();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CartProvider>
          <OfflineIndicator />
          <Router />
          <Toaster />
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
