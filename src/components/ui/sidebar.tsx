
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { 
  Home, 
  PlusCircle, 
  ClipboardList, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Wallet, 
  RotateCw
} from "lucide-react";

export const Sidebar = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      name: "Dashboard",
      icon: <Home className="h-5 w-5" />,
      path: "/dashboard",
    },
    {
      name: "Add Expense",
      icon: <PlusCircle className="h-5 w-5" />,
      path: "/add-expense",
    },
    {
      name: "History",
      icon: <ClipboardList className="h-5 w-5" />,
      path: "/history",
    },
    {
      name: "Recurring",
      icon: <RotateCw className="h-5 w-5" />,
      path: "/recurring",
    },
    {
      name: "Settings",
      icon: <Settings className="h-5 w-5" />,
      path: "/settings",
    },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-batman-card shadow-sm border-b border-batman-border">
        <div className="flex items-center">
          <Wallet className="h-6 w-6 text-batman-accent mr-2" />
          <span className="font-bold text-lg">BatBudget</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMobileMenu}
          className="text-batman-foreground"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-batman flex flex-col p-6 pt-20">
          <div className="flex flex-col space-y-4">
            {navItems.map((item) => (
              <Button
                key={item.name}
                variant={location.pathname === item.path ? "default" : "ghost"}
                className={`justify-start ${
                  location.pathname === item.path
                    ? "bg-batman-accent text-white hover:bg-batman-accent/90"
                    : "text-batman-foreground hover:bg-batman-accent/10"
                }`}
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
              >
                {item.icon}
                <span className="ml-2">{item.name}</span>
              </Button>
            ))}
            <Button
              variant="ghost"
              className="justify-start text-batman-red hover:bg-batman-red/10"
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
            >
              <LogOut className="h-5 w-5" />
              <span className="ml-2">Logout</span>
            </Button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:pt-5 lg:bg-batman-card lg:border-r lg:border-batman-border">
        <div className="flex items-center justify-center h-16 px-4">
          <Wallet className="h-8 w-8 text-batman-accent mr-2" />
          <span className="font-bold text-xl">BatBudget</span>
        </div>
        <div className="flex flex-col flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Button
              key={item.name}
              variant={location.pathname === item.path ? "default" : "ghost"}
              className={`justify-start ${
                location.pathname === item.path
                  ? "bg-batman-accent text-white hover:bg-batman-accent/90"
                  : "text-batman-foreground hover:bg-batman-accent/10"
              }`}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              <span className="ml-2">{item.name}</span>
            </Button>
          ))}
        </div>
        <div className="px-3 py-4 border-t border-batman-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-batman-red hover:bg-batman-red/10"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            <span className="ml-2">Logout</span>
          </Button>
        </div>
      </div>
    </>
  );
};
