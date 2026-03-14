import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TaxProvider } from "@/hooks/use-tax-store";
import { Navbar } from "@/components/Navbar";

// Pages
import Home from "@/pages/Home";
import Calculator from "@/pages/Calculator";
import Breakdown from "@/pages/Breakdown";
import Simulator from "@/pages/Simulator";
import Share from "@/pages/Share";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/calculator" component={Calculator} />
      <Route path="/breakdown" component={Breakdown} />
      <Route path="/simulator" component={Simulator} />
      <Route path="/share" component={Share} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TaxProvider>
        <TooltipProvider>
          {/* We enforce dark mode on the wrapper for the unified aesthetic */}
          <div className="dark min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 relative flex flex-col">
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Navbar />
              <main className="flex-1">
                <Router />
              </main>
            </WouterRouter>
          </div>
          <Toaster />
        </TooltipProvider>
      </TaxProvider>
    </QueryClientProvider>
  );
}

export default App;
