import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import LoadingSpinner from "@/components/LoadingSpinner";

// Lazy load all route components for better code splitting
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
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
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner />
              </div>
            }>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/nova-venda" element={<NovaVenda />} />
                <Route path="/reunioes" element={<Reunioes />} />
                <Route path="/tv-ranking" element={<PublicTVRanking />} />
                <Route path="/profissoes-chart" element={<ProfissoesChart />} />
                <Route path="/teste-vinculacao" element={<TesteVinculacao />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
