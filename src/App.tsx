import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ExpenseProvider } from "@/context/ExpenseContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { notificationService } from "@/services/NotificationService";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import DashboardPage from "./pages/DashboardPage";
import AddExpensePage from "./pages/AddExpensePage";
import HistoryPage from "./pages/HistoryPage";
import SettingsPage from "./pages/SettingsPage";
import AIPage from "./pages/AIPage"
import RecurringTransactionsPage from "./pages/RecurringTransactions";
import NotFound from "./pages/NotFound";
import LoadingScreen from "./components/LoadingScreen";

import { db } from "./integrations/firebase/client";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { callNetlifyFunction } from "@/utils/netlifyFunctions";
import { toast } from "sonner";

// Create a client
const queryClient = new QueryClient();

function AppRoutes() {
  const { currentUser, loading } = useAuth();
  const [isProcessingTransactions, setIsProcessingTransactions] = useState(false);

  // Android hardware back button handler
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handler = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        CapApp.exitApp();
      }
    });

    return () => {
      handler.then(h => h.remove());
    };
  }, []);


  useEffect(() => {
    if (currentUser) {
      
      notificationService.initialize();

      // Process recurring transactions function
      const processRecurringTransactions = async () => {
        try {
          if (isProcessingTransactions) return;
          
          setIsProcessingTransactions(true);
          console.log("Checking for due recurring transactions...");
          
          const { data } = await callNetlifyFunction('processRecurringTransactions');
          const { processed, results } = data as any;
          console.log(`Processed ${processed} recurring transactions`);
          
          // Only show toast if there were successful transactions
          const successCount = results?.filter(r => r.status === 'success')?.length || 0;
          if (successCount > 0) {
            toast.success(`${successCount} recurring transactions processed`);
            
            // Trigger a global data refresh
            const refreshEvent = new CustomEvent('refresh-data');
            window.dispatchEvent(refreshEvent);
          }
        } catch (error) {
          console.error("Failed to process recurring transactions:", error);
        } finally {
          setIsProcessingTransactions(false);
        }
      };
      
      // Check and send smart notifications
      const checkAndSendSmartNotifications = async () => {
        try {
          console.log('Checking if smart notifications should be sent...');
          await notificationService.scheduleSmartNotifications();
        } catch (error) {
          console.error('Failed to send smart notifications:', error);
        }
      };
      
      // Setup listener to hear new recurring transactions
      const recurringQuery = query(
        collection(db, "recurring_transactions"),
        where("user_id", "==", currentUser.uid)
      );
      const unsubscribeRecurring = onSnapshot(recurringQuery, (snapshot) => {
        // Simple way to trigger checks:
        if (!snapshot.empty) {
          processRecurringTransactions();
        }
      });
      
      const expensesQuery = query(
        collection(db, "expenses"),
        where("user_id", "==", currentUser.uid)
      );
      const unsubscribeExpenses = onSnapshot(expensesQuery, (snapshot) => {
        if (!snapshot.empty) {
          checkAndSendSmartNotifications();
        }
      });
      
      // Run immediate checks
      processRecurringTransactions();
      checkAndSendSmartNotifications();
      
      // Schedule periodic checks (every 2 hours for smart notifications, every 12 hours for recurring)
      const recurringCheckInterval = setInterval(processRecurringTransactions, 12 * 3600000);
      const smartNotificationsInterval = setInterval(checkAndSendSmartNotifications, 2 * 3600000);
      
      // Listen for data refresh events
      const handleRefreshData = () => {
        // Dispatch event that components can listen for
        window.dispatchEvent(new CustomEvent('expenses-data-changed'));
      };
      
      window.addEventListener('refresh-data', handleRefreshData);

      return () => {
        window.removeEventListener('refresh-data', handleRefreshData);
        clearInterval(recurringCheckInterval);
        clearInterval(smartNotificationsInterval);
        unsubscribeRecurring();
        unsubscribeExpenses();
      };
    }
  }, [currentUser]); 

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route path="/" element={currentUser ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-expense"
        element={
          <ProtectedRoute>
            <AddExpensePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recurring"
        element={
          <ProtectedRoute>
            <RecurringTransactionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai"
        element={
          <ProtectedRoute>
            <AIPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <ExpenseProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner position="top-center" className="toaster" />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </ExpenseProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
