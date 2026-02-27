
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { PlusCircle, MinusCircle, CalendarClock, ArrowRight } from "lucide-react";
import { db } from "@/integrations/firebase/client";
import { collection, query, where, orderBy, limit, getDocs, onSnapshot } from "firebase/firestore";
import { formatCurrency } from "@/utils/formatCurrency";
import { useExpenses } from "@/context/ExpenseContext";
import { useAuth } from "@/context/AuthContext";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { useNavigate } from "react-router-dom";

interface RecurringTransaction {
  id: string;
  amount: number;
  description: string | null;
  category_id: string;
  type: string;
  frequency: string;
  next_run_date: string;
  active: boolean;
  category_name?: string;
  category_color?: string;
}

export const RecurringPreview: React.FC = () => {
  const [upcomingTransactions, setUpcomingTransactions] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { categories } = useExpenses();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const fetchUpcomingTransactions = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // Get transactions scheduled for the next 14 days
      const nextTwoWeeks = addDays(new Date(), 14);
      
      const q = query(
        collection(db, "recurring_transactions"),
        where("user_id", "==", currentUser.uid),
        where("active", "==", true),
        where("next_run_date", "<=", nextTwoWeeks.toISOString()),
        orderBy("next_run_date", "asc"),
        limit(5)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setUpcomingTransactions([]);
        setLoading(false);
        return;
      }
      
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RecurringTransaction[];
      
      const enrichedData: RecurringTransaction[] = data.map(transaction => {
        const category = categories.find(cat => cat.id === transaction.category_id);
        return {
          ...transaction,
          category_name: category?.name || "Unknown",
          category_color: category?.color || "#CCCCCC"
        };
      });
      
      setUpcomingTransactions(enrichedData);
    } catch (error) {
      console.error("Error fetching upcoming recurring transactions:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Add a refresh interval to update the display regularly
  useEffect(() => {
    fetchUpcomingTransactions();
    
    // Set up a timer to refresh the data every minute
    const refreshInterval = setInterval(() => {
      fetchUpcomingTransactions();
    }, 60000); // 1 minute
    
    return () => clearInterval(refreshInterval);
  }, [categories]);

  // Listen for changes to only the current user's recurring transactions
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "recurring_transactions"),
      where("user_id", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, () => {
      fetchUpcomingTransactions();
    });

    return () => unsubscribe();
  }, [currentUser, categories]);

  const getFrequencyLabel = (frequency: string): string => {
    switch (frequency) {
      case "weekly": return "Weekly";
      case "monthly": return "Monthly";
      case "quarterly": return "Quarterly";
      case "yearly": return "Yearly";
      default: return frequency;
    }
  };

  if (loading && upcomingTransactions.length === 0) {
    return <div className="h-10 w-full animate-pulse bg-batman-secondary/20 rounded-md mb-6"></div>; 
  }

  // Always show the section even if no transactions
  return (
    <Card className="batcard p-4 mb-6 max-w-8xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-batman-foreground/80">Auto Transactions</h3>
        <CalendarClock className="h-5 w-5 text-batman-accent" />
      </div>
      
      {upcomingTransactions.length > 0 ? (
        <div className="space-y-4">
          {upcomingTransactions.map((transaction) => (
            <div key={transaction.id} className="p-3 border-b border-batman-secondary/20 last:border-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div
                    className="w-1 h-10 rounded-sm"
                    style={{ backgroundColor: transaction.category_color }}
                  />
                  <div>
                    <div className="flex items-center">
                      {transaction.type === "income" ? (
                        <PlusCircle className="h-3 w-3 text-batman-green mr-1" />
                      ) : (
                        <MinusCircle className="h-3 w-3 text-batman-red mr-1" />
                      )}
                      <p className="font-medium">{transaction.description || "Unnamed transaction"}</p>
                    </div>
                    <div className="flex items-center text-xs text-batman-foreground/60">
                      <span>{transaction.category_name}</span>
                      <span className="mx-1">•</span>
                      <span>{getFrequencyLabel(transaction.frequency)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end">
                  <span className={`font-bold ${transaction.type === "income" ? "text-batman-green" : "text-batman-red"}`}>
                    {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.amount)}
                  </span>
                  <span className="text-xs text-batman-foreground/60">
                    Next: {format(new Date(transaction.next_run_date), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          <Button 
            variant="outline" 
            size="sm"
            className="w-full mt-2 border-batman-secondary/30 hover:bg-batman-secondary/10"
            onClick={() => navigate('/recurring')}
          >
            <span>Manage Auto Transactions</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="text-center py-4 text-batman-foreground/60">
          <p>No upcoming recurring transactions for the next 14 days.</p>
          <Button 
            variant="outline" 
            size="sm"
            className="mt-4 border-batman-secondary/30 hover:bg-batman-secondary/10"
            onClick={() => navigate('/recurring')}
          >
            <span>Set Up Recurring Transactions</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </Card>
  );
};
