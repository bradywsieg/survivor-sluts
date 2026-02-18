import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Palmtree, Trophy, Users, UserCircle, BookOpen, Menu, X, Tv, Shield } from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: typeof Trophy;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: Trophy },
  { label: "Teams", href: "/teams", icon: Users },
  { label: "Contestants", href: "/contestants", icon: UserCircle },
  { label: "Rules", href: "/rules", icon: BookOpen },
  { label: "Admin", href: "/admin", icon: Shield },
  { label: "Seasons", href: "/seasons", icon: Tv },
];

export default function Navbar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 h-16 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2" data-testid="link-home">
          <Palmtree className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl font-['Slackey'] tracking-wide text-primary">Survivor Sluts</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className="text-sm font-medium uppercase tracking-wide gap-2"
                  data-testid={`link-nav-${item.label.toLowerCase()}`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          data-testid="button-mobile-menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-card border-b p-4 space-y-2 z-50">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className="w-full justify-start gap-2 text-sm font-medium uppercase tracking-wide"
                  data-testid={`link-mobile-nav-${item.label.toLowerCase()}`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
