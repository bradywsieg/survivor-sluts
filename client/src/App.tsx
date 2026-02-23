import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Teams from "@/pages/Teams";
import Contestants from "@/pages/Contestants";
import Admin from "@/pages/Admin";
import Rules from "@/pages/Rules";
import Bonus from "@/pages/Bonus";
import Navbar from "@/components/Navbar";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/teams" component={Teams} />
      <Route path="/contestants" component={Contestants} />
      <Route path="/bonus" component={Bonus} />
      <Route path="/admin" component={Admin} />
      <Route path="/rules" component={Rules} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Navbar />
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
