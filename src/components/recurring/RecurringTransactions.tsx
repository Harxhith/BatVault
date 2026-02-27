import React, { useState, useEffect } from "react";
import { db, functions } from "@/integrations/firebase/client";
import { collection, query, getDocs, updateDoc, deleteDoc, doc, orderBy } from "firebase/firestore";
import { callNetlifyFunction } from "@/utils/netlifyFunctions";
import { useExpenses } from "@/context/ExpenseContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, MinusCircle, Edit, Trash2, RotateCcw, Calendar, DollarSign, CircleSlash, Play } from "lucide-react";
import { RecurringTransactionForm } from "./RecurringTransactionForm";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/formatCurrency";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface RecurringTransaction {
  id: string;
  amount: number;
  description: string | null;
  category_id: string;
  type: string;
  frequency: string;
  start_date: string;
  end_date: string | null;
  next_run_date: string;
  day_of_month: number | null;
  day_of_week: number | null;
  created_at: string;
  active: boolean;
  category_name?: string;
  category_color?: string;
  user_id: string;
  last_run_date: string | null;
}

export const RecurringTransactions: React.FC = () => {
  const { categories, refreshData } = useExpenses();
  const [transactions, setTransactions] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"add" | "manage">("manage");
  const [transactionType, setTransactionType] = useState<"expense" | "income">("expense");
  const [openDialogs, setOpenDialogs] = useState<{ [key: string]: boolean }>({});
  const [processingTransactions, setProcessingTransactions] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const recurringRef = collection(db, "recurring_transactions");
      const q = query(recurringRef, orderBy("next_run_date", "asc"));
      const snapshot = await getDocs(q);
      
      const data = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as unknown as RecurringTransaction[];
      
      const enrichedData: RecurringTransaction[] = data.map(transaction => {
        const category = categories.find(cat => cat.id === transaction.category_id);
        return {
          ...transaction,
          category_name: category?.name || "Unknown",
          category_color: category?.color || "#CCCCCC"
        };
      });
      
      setTransactions(enrichedData);
    } catch (error) {
      console.error("Error fetching recurring transactions:", error);
      toast.error("Failed to load recurring transactions");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTransactions();
  }, [categories]);
  
  const toggleTransactionActive = async (id: string, currentActive: boolean) => {
    try {
      await updateDoc(doc(db, "recurring_transactions", id), { active: !currentActive });
      
      setTransactions(prev => 
        prev.map(transaction => 
          transaction.id === id 
            ? { ...transaction, active: !currentActive } 
            : transaction
        )
      );
      
      toast.success(`Recurring transaction ${!currentActive ? "activated" : "paused"}`);
    } catch (error) {
      console.error("Error toggling transaction status:", error);
      toast.error("Failed to update transaction status");
    }
  };
  
  const deleteTransaction = async (id: string) => {
    try {
      await deleteDoc(doc(db, "recurring_transactions", id));
      
      setTransactions(prev => prev.filter(transaction => transaction.id !== id));
      toast.success("Recurring transaction deleted");
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Failed to delete transaction");
    }
  };
  
  const processRecurringTransactions = async () => {
    try {
      setProcessingTransactions(true);
      const { data } = await callNetlifyFunction('processRecurringTransactions');
      
      const { processed, results } = data as any;
      console.log(`Processed ${processed} recurring transactions:`, results);
      
      const successCount = results.filter(r => r.status === 'success').length;
      if (successCount > 0) {
        toast.success(`${successCount} recurring transactions processed`);
        await refreshData();
      } else if (processed > 0) {
        const skippedCount = results.filter(r => r.status === 'skipped').length;
        if (skippedCount > 0) {
          toast.info(`${skippedCount} transactions were already processed recently`);
        } else {
          toast.info("No transactions were due for processing");
        }
      } else {
        toast.info("No transactions were due for processing");
      }
      
      fetchTransactions();
    } catch (error) {
      console.error("Error processing recurring transactions:", error);
      toast.error("Failed to process recurring transactions");
    } finally {
      setProcessingTransactions(false);
    }
  };
  
  const getFrequencyLabel = (frequency: string): string => {
    switch (frequency) {
      case "weekly": return "Weekly";
      case "monthly": return "Monthly";
      case "quarterly": return "Quarterly";
      case "yearly": return "Yearly";
      default: return frequency;
    }
  };
  
  const getNextOccurrenceText = (transaction: RecurringTransaction): string => {
    return `Next: ${format(new Date(transaction.next_run_date), "MMM d, yyyy")}`;
  };
  
  const getScheduleDetails = (transaction: RecurringTransaction): string => {
    let detailText = getFrequencyLabel(transaction.frequency);
    
    if (transaction.frequency === "weekly" && transaction.day_of_week !== null) {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      detailText += ` on ${days[transaction.day_of_week]}`;
    } else if (transaction.day_of_month !== null) {
      detailText += ` on day ${transaction.day_of_month}`;
    }
    
    return detailText;
  };

  return (
    <div className="bg-card border rounded-lg space-y-6 p-4">
      <Tabs 
        defaultValue="manage" 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as "add" | "manage")}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Manage Recurring
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Create New
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="manage">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-batman-foreground/80 font-medium">Auto Transactions</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={processRecurringTransactions}
              disabled={processingTransactions}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {processingTransactions ? "Processing..." : "Process Transactions"}
            </Button>
          </div>
          
          {loading ? (
            <div className="text-center py-8">Loading recurring transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-batman-foreground/60 mb-4">No recurring transactions yet</p>
              <Button 
                onClick={() => setActiveTab("add")}
                className="bg-batman-accent text-batman hover:bg-batman-accent/90"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Create your first recurring transaction
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <Card key={transaction.id} className="p-4 bg-batman-card">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-2">
                      <div 
                        className={`rounded-full w-6 h-6 flex items-center justify-center mt-1 ${
                          transaction.type === "income" ? "bg-batman-green/20" : "bg-batman-accent/20"
                        }`}
                      >
                        {transaction.type === "income" ? (
                          <PlusCircle className="h-4 w-4 text-batman-green" />
                        ) : (
                          <MinusCircle className="h-4 w-4 text-batman-accent" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-batman-foreground">
                          {transaction.description || "Unnamed transaction"}
                        </h3>
                        <div className="text-sm text-batman-foreground/60 flex items-center gap-1">
                        <div 
                              className="w-2 h-2 rounded-lg"
                              style={{ backgroundColor: transaction.category_color || '#5BC0EB' }} 
                            />
                          {transaction.category_name}
                        </div>
                        
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`font-semibold ${
                        transaction.type === "income" ? "text-batman-green" : "text-batman-accent"
                      }`}>
                        {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.amount)}
                      </span>
                      <div className="flex gap-4 mt-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-4"
                          onClick={() => toggleTransactionActive(transaction.id, transaction.active)}
                          title={transaction.active ? "Pause" : "Activate"}
                        >
                          {transaction.active ? (
                            <CircleSlash className="h-4 w-4 text-batman-foreground/70" />
                          ) : (
                            <RotateCcw className="h-4 w-4 text-batman-foreground/70" />
                          )}
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-4"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-batman-red" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-batman-card">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete recurring transaction?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove the recurring schedule. Any transactions already created will remain.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-batman-secondary/40 hover:bg-batman-secondary/60">Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                className="bg-batman-red text-white hover:bg-batman-red/80"
                                onClick={() => deleteTransaction(transaction.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-batman-foreground/60 flex items-center justify-between pt-1">
                      <span className="flex items-center gap-1">
                          <RotateCcw className="h-3 w-3" />
                          {getScheduleDetails(transaction)}
                      </span>
                      <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {getNextOccurrenceText(transaction)}
                      </span>
                  </div>
                 
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="add">
          <Card className="p-6 bg-batman-card">
            <Tabs 
              defaultValue="expense" 
              onValueChange={(value) => setTransactionType(value as "expense" | "income")}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="expense" className="flex items-center gap-2">
                  <MinusCircle className="h-4 w-4 text-batman-red" />
                  Expense
                </TabsTrigger>
                <TabsTrigger value="income" className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4 text-batman-green" />
                  Income
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="expense">
                <RecurringTransactionForm 
                  transactionType="expense"
                  onComplete={() => {
                    fetchTransactions();
                    setActiveTab("manage");
                  }} 
                />
              </TabsContent>
              
              <TabsContent value="income">
                <RecurringTransactionForm 
                  transactionType="income"
                  onComplete={() => {
                    fetchTransactions();
                    setActiveTab("manage");
                  }}
                />
              </TabsContent>
            </Tabs>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
