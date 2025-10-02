import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import LoadingSpinner from "@/components/LoadingSpinner";
import Auth from "./pages/Auth"; // Eager load for LCP optimization

// Lazy load non-critical route components for better code splitting
const Index = lazy(() => import("./pages/Index"));
const NovaVenda = lazy(() => import("./pages/NovaVenda"));
const Reunioes = lazy(() => import("./pages/Reunioes"));
const PublicTVRanking = lazy(() => import("./pages/PublicTVRanking"));
const ProfissoesChart = lazy(() => import("./pages/ProfissoesChart"));
const NotFound = lazy(() => import("./pages/NotFound"));
const TesteVinculacao = lazy(() => import("./components/debug/TesteVinculacao").then(m => ({ default: m.TesteVinculacao })));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Auth page eager-loaded for LCP optimization */}
              <Route path="/auth" element={<Auth />} />
              
              {/* Other routes lazy-loaded with Suspense */}
              <Route path="/" element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>}>
                  <Index />
                </Suspense>
              } />
              <Route path="/nova-venda" element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>}>
                  <NovaVenda />
                </Suspense>
              } />
              <Route path="/reunioes" element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>}>
                  <Reunioes />
                </Suspense>
              } />
              <Route path="/tv-ranking" element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>}>
                  <PublicTVRanking />
                </Suspense>
              } />
              <Route path="/profissoes-chart" element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>}>
                  <ProfissoesChart />
                </Suspense>
              } />
              <Route path="/teste-vinculacao" element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>}>
                  <TesteVinculacao />
                </Suspense>
              } />
              <Route path="*" element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>}>
                  <NotFound />
                </Suspense>
              } />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
