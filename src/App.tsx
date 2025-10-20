import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useDarkMode";
import { RetailerLayout } from "@/components/RetailerLayout";
import Auth from "./pages/Auth";
import RetailerHome from "./pages/RetailerHome";
import RetailerInventory from "./pages/RetailerInventory";
import RetailerReverseCommerce from "./pages/RetailerReverseCommerce";
import Reports from "./pages/Reports";
import RetailerSettings from "./pages/RetailerSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={
                <RetailerLayout>
                  <RetailerHome />
                </RetailerLayout>
              } />
              <Route path="/inventory" element={
                <RetailerLayout>
                  <RetailerInventory />
                </RetailerLayout>
              } />
              <Route path="/reverse-commerce" element={
                <RetailerLayout>
                  <RetailerReverseCommerce />
                </RetailerLayout>
              } />
              <Route path="/reports" element={
                <RetailerLayout>
                  <Reports />
                </RetailerLayout>
              } />
              <Route path="/settings" element={
                <RetailerLayout>
                  <RetailerSettings />
                </RetailerLayout>
              } />
              {/* Redirect old routes to new structure */}
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="/retailer" element={<Navigate to="/" replace />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
