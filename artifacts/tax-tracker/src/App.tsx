import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ExploreProvider } from "@/hooks/use-explore-tracker";
import { Sidebar } from "@/components/Sidebar";
import { TopHeader } from "@/components/TopHeader";
import { BottomNav } from "@/components/BottomNav";
import { useState } from "react";

// Pages
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Calculator from "@/pages/Calculator";
import Breakdown from "@/pages/Breakdown";
import Simulator from "@/pages/Simulator";
import Share from "@/pages/Share";
import Lifetime from "@/pages/Lifetime";
import Explorer from "@/pages/Explorer";
import Sentiment from "@/pages/Sentiment";
import FollowTheMoney from "@/pages/FollowTheMoney";
import RunTheCountry from "@/pages/RunTheCountry";
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
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/calculator" component={Calculator} />
      <Route path="/breakdown" component={Breakdown} />
      <Route path="/simulator" component={Simulator} />
      <Route path="/run-the-country" component={RunTheCountry} />
      <Route path="/share" component={Share} />
      <Route path="/lifetime" component={Lifetime} />
      <Route path="/explorer" component={Explorer} />
      <Route path="/sentiment" component={Sentiment} />
      <Route path="/money-map" component={FollowTheMoney} />
      <Route component={NotFound} />
    </Switch>
  );
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <TopHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
          <div className="dark min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
            <ExploreProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <DashboardLayout>
                  <Router />
                </DashboardLayout>
              </WouterRouter>
            </ExploreProvider>
          </div>
          <Toaster />
        </TooltipProvider>
      </TaxProvider>
    </QueryClientProvider>
  );
}

export default App;
