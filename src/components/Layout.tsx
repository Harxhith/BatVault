"use client"

import type React from "react"
import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { BatLogo } from "./BatLogo"
import { Button } from "@/components/ui/button"
import { CalendarDays, LogOut, Menu, X, User, Plus, Home, Settings, Bot } from "lucide-react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface LayoutProps {
  children: React.ReactNode
}

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive: boolean
  isMobile?: boolean
  mobileBottom?: boolean
}

const NavItem: React.FC<NavItemProps> = ({ href, icon, label, isActive, isMobile = false, mobileBottom = false }) => {
  if (mobileBottom) {
    return (
      <Link
        to={href}
        className={cn(
          "flex flex-col items-center justify-center gap-1 py-1",
          isActive ? "text-batman-accent" : "text-batman-foreground/70",
        )}
      >
        {icon}
        <span className="text-xs">{label}</span>
      </Link>
    )
  }

  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
        isActive
          ? "bg-batman-accent text-batman"
          : isMobile
            ? "hover:bg-batman-secondary/10 text-batman-foreground"
            : "hover:bg-batman-secondary/10 text-batman-foreground",
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await signOut()
      navigate("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  let pfp: string | null = null;

  if (currentUser.email === "thor@gmail.com") {
    pfp = "/thor1.png";
  } else if (currentUser.email === "batman@gmail.com") {
    pfp = "/bat.png";
  } else {
    pfp = null; 
  }

  if (!currentUser) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-batman">
      <div className="hidden md:flex flex-col w-64 bg-batman-muted border-r border-batman-secondary/20 p-4">
        <div className="flex items-center gap-3 pb-6">
          <BatLogo className="w-10 h-10 text-batman-accent animate-glow" />
          <h1 className="text-xl font-bold text-batman-accent font-orbitron" style={{ fontFamily: "Orbitron", fontWeight:"800"}} >BatVault</h1>
        </div>

        <Separator className="bg-batman-secondary/20 my-3" />

        <div className="space-y-1 mt-4">
          <NavItem
            href="/dashboard"
            icon={<Home size={20} />}
            label="Dashboard"
            isActive={location.pathname === "/dashboard"}
          />
          <NavItem
            href="/ai"
            icon={<Bot size={20} />}
            label="Alfred"
            isActive={location.pathname === "/ai"}
          />
          <NavItem
            href="/add-expense"
            icon={<Plus size={20} />}
            label="Add"
            isActive={location.pathname === "/add-expense"}
          />
          <NavItem
            href="/history"
            icon={<CalendarDays size={20} />}
            label="History"
            isActive={location.pathname === "/history"}
          />
          <NavItem
            href="/settings"
            icon={<Settings size={20} />}
            label="Settings"
            isActive={location.pathname === "/settings"}
          />
        </div>

        <div className="flex-grow" />

        <div className="p-4 bg-batman rounded-lg border border-batman-secondary/20 flex items-center gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-full bg-batman-secondary/30 flex items-center justify-center shrink-0">
            <Avatar>
              <AvatarImage src={pfp} />
              <AvatarFallback className="bg-batman-secondary/30">
              <User size={20} className="text-batman-foreground" />
              </AvatarFallback>
            </Avatar>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-batman-foreground truncate">{currentUser.email?.split("@")[0]}</p>
              <p className="text-xs text-batman-foreground/60 truncate">{currentUser.email}</p>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleLogout}
            className="shrink-0 text-batman-foreground hover:text-batman-red hover:bg-transparent"
          >
            <LogOut size={20} />
          </Button>
        </div>
      </div>

      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-batman border-b border-batman-secondary/20 mobile-safe-top">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <BatLogo className="w-8 h-8 text-batman-accent animate-glow" />
            <h1 className="text-lg font-bold text-batman-accent" style={{ fontFamily: "Orbitron", fontWeight:"800"}} >BatVault</h1>
          </div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-batman-muted border-batman-secondary/20 p-0">
              <div className="flex flex-col h-full mobile-safe-bottom">
                <div className="flex items-center justify-between p-4 border-b border-batman-secondary/20 mobile-sheet-header-top">
                  <div className="flex items-center gap-3">
                    <BatLogo className="w-8 h-8 text-batman-accent" />
                    <h1 className="text-lg font-bold text-batman-accent" style={{ fontFamily: "Orbitron", fontWeight:"800"}} >BatVault</h1>
                  </div>
                  <Button variant="outline" onClick={() => setMobileMenuOpen(false)}>
                    <X size={24} />
                  </Button>
                </div>

                <div className="p-4 space-y-1">
                  <NavItem
                    href="/dashboard"
                    icon={<Home size={20} />}
                    label="Dashboard"
                    isActive={location.pathname === "/dashboard"}
                    isMobile
                  />
                  <NavItem
                    href="/ai"
                    icon={<Bot size={20} />}
                    label="Alfred"
                    isActive={location.pathname === "/ai"}
                    isMobile
                  />
                  <NavItem
                    href="/add-expense"
                    icon={<Plus size={20} />}
                    label="Add"
                    isActive={location.pathname === "/add-expense"}
                    isMobile
                  />
                  <NavItem
                    href="/history"
                    icon={<CalendarDays size={20} />}
                    label="History"
                    isActive={location.pathname === "/history"}
                    isMobile
                  />
                  <NavItem
                    href="/settings"
                    icon={<Settings size={20} />}
                    label="Settings"
                    isActive={location.pathname === "/settings"}
                    isMobile
                  />
                </div>

                <div className="flex-grow" />

                <div className="p-4 m-4 bg-batman rounded-lg border border-batman-secondary/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-batman-secondary/30 flex items-center justify-center">
                    <Avatar>
                      <AvatarImage src={pfp} />
                      <AvatarFallback className="bg-batman-secondary/30">
                      <User size={20} className="text-batman-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-batman-foreground">{currentUser.email?.split("@")[0]}</p>
                      <p className="text-xs text-batman-foreground/60">{currentUser.email}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      handleLogout()
                      setMobileMenuOpen(false)
                    }}
                    variant="outline"
                    className="w-full border-batman-secondary/40 hover:bg-batman-secondary/20"
                  >
                    <LogOut size={16} className="mr-2" /> Sign Out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex-grow md:overflow-auto w-full md:w-auto content-area-padding">{children}</div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-batman border-t border-batman-secondary/20 mobile-safe-bottom">
        <div className="grid grid-cols-5 h-16">
          <NavItem
            href="/dashboard"
            icon={<Home size={20} />}
            label="Home"
            isActive={location.pathname === "/dashboard"}
            mobileBottom
          />
          <NavItem
            href="/add-expense"
            icon={<Plus size={20} />}
            label="Add"
            isActive={location.pathname === "/add-expense"}
            mobileBottom
          />
          <div className="flex items-center justify-center">
          <Link to="/ai" className="bg-yellow-500 p-1 rounded-full flex justify-center items-center">
            <Avatar className="h-9 w-9">
              <AvatarImage src="/alfred1.png" />
            </Avatar>
          </Link>          
          </div>
          <NavItem
            href="/history"
            icon={<CalendarDays size={20} />}
            label="History"
            isActive={location.pathname === "/history"}
            mobileBottom
          />
          <NavItem
            href="/settings"
            icon={<Settings size={20} />}
            label="Settings"
            isActive={location.pathname === "/settings"}
            mobileBottom
          />
        </div>
      </div>
    </div>
  )
}
