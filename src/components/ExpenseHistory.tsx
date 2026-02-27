
import React, { useState, useEffect } from "react";
import { useExpenses, Expense } from "@/context/ExpenseContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  PlusCircle, 
  MinusCircle,
  Search, 
  Trash2, 
  ArrowUpCircle, 
  ArrowDownCircle,
  Filter,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/utils/formatCurrency";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

export const ExpenseHistory: React.FC = () => {
  const { expenses, categories, deleteExpense } = useExpenses();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>(expenses);
  const [selectedPeriod, setSelectedPeriod] = useState<"all" | "week" | "month" | "year">("all");
  const isMobile = useIsMobile();
  
  // Group expenses by month for display
  const groupedExpenses = filteredExpenses.reduce((groups, expense) => {
    const date = new Date(expense.date);
    const month = format(date, "MMMM yyyy");
    
    if (!groups[month]) {
      groups[month] = [];
    }
    
    groups[month].push(expense);
    return groups;
  }, {} as Record<string, Expense[]>);
  
  // Filter expenses based on search term and period
  useEffect(() => {
    let filtered = expenses;
    
    // Apply period filter
    const now = new Date();
    if (selectedPeriod !== "all") {
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date);
        const diffTime = Math.abs(now.getTime() - expenseDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        switch (selectedPeriod) {
          case "week":
            return diffDays <= 7;
          case "month":
            return diffDays <= 30;
          case "year":
            return diffDays <= 365;
          default:
            return true;
        }
      });
    }
    
    // Apply search term filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(expense => {
        const category = categories.find(c => c.id === expense.category);
        return (
          expense.description.toLowerCase().includes(search) ||
          category?.name.toLowerCase().includes(search) ||
          String(expense.amount).includes(search)
        );
      });
    }
    
    setFilteredExpenses(filtered);
  }, [expenses, searchTerm, selectedPeriod, categories]);
  
  // Calculate the month total considering both expenses and income
  const calculateMonthTotal = (expenseList: Expense[]) => {
    const totalExpenses = expenseList
      .filter(exp => exp.type === "expense")
      .reduce((sum, exp) => sum + exp.amount, 0);
      
    const totalIncome = expenseList
      .filter(exp => exp.type === "income")
      .reduce((sum, exp) => sum + exp.amount, 0);
      
    return { expenses: totalExpenses, income: totalIncome, net: totalIncome - totalExpenses };
  };

  // Filter options component that renders either in drawer (mobile) or inline (desktop)
  const FilterOptions = () => (
    <div className="flex flex-col space-y-3">
      <Button
        variant={selectedPeriod === "all" ? "default" : "outline"}
        onClick={() => setSelectedPeriod("all")}
        className={`w-full ${selectedPeriod !== "all" ? "border-batman-secondary/40" : ""}`}
      >
        All Time
      </Button>
      <Button
        variant={selectedPeriod === "week" ? "default" : "outline"}
        onClick={() => setSelectedPeriod("week")}
        className={`w-full ${selectedPeriod !== "week" ? "border-batman-secondary/40" : ""}`}
      >
        This Week
      </Button>
      <Button
        variant={selectedPeriod === "month" ? "default" : "outline"}
        onClick={() => setSelectedPeriod("month")}
        className={`w-full ${selectedPeriod !== "month" ? "border-batman-secondary/40" : ""}`}
      >
        This Month
      </Button>
      <Button
        variant={selectedPeriod === "year" ? "default" : "outline"}
        onClick={() => setSelectedPeriod("year")}
        className={`w-full ${selectedPeriod !== "year" ? "border-batman-secondary/40" : ""}`}
      >
        This Year
      </Button>
    </div>
  );
  
  return (
    <div className="p-4 sm:p-0 space-y-6 pt-0">
      <Card className="batcard p-3 md:p-4">
        <div className="flex flex-col space-y-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-batman-foreground/50" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-batman border-batman-secondary/40"
            />
          </div>
          
          {isMobile ? (
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline" className="flex justify-between items-center border-batman-secondary/40">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>
                      {selectedPeriod === "all" ? "All Time" : 
                       selectedPeriod === "week" ? "This Week" : 
                       selectedPeriod === "month" ? "This Month" : "This Year"}
                    </span>
                  </div>
                  <Filter className="h-4 w-4" />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="batcard">
                <DrawerHeader>
                  <DrawerTitle>Time Period</DrawerTitle>
                  <DrawerDescription>
                    Select a time period to filter transactions
                  </DrawerDescription>
                </DrawerHeader>
                <div className="px-4 pb-2">
                  <FilterOptions />
                </div>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button>Apply Filter</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          ) : (
            <div className="flex gap-2">
              <Button
                variant={selectedPeriod === "all" ? "default" : "outline"}
                onClick={() => setSelectedPeriod("all")}
                className={selectedPeriod !== "all" ? "border-batman-secondary/40" : ""}
              >
                All
              </Button>
              <Button
                variant={selectedPeriod === "week" ? "default" : "outline"}
                onClick={() => setSelectedPeriod("week")}
                className={selectedPeriod !== "week" ? "border-batman-secondary/40" : ""}
              >
                Week
              </Button>
              <Button
                variant={selectedPeriod === "month" ? "default" : "outline"}
                onClick={() => setSelectedPeriod("month")}
                className={selectedPeriod !== "month" ? "border-batman-secondary/40" : ""}
              >
                Month
              </Button>
              <Button
                variant={selectedPeriod === "year" ? "default" : "outline"}
                onClick={() => setSelectedPeriod("year")}
                className={selectedPeriod !== "year" ? "border-batman-secondary/40" : ""}
              >
                Year
              </Button>
            </div>
          )}
        </div>
      </Card>
      
      {Object.keys(groupedExpenses).length > 0 ? (
        Object.entries(groupedExpenses)
          .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
          .map(([month, monthExpenses]) => {
            const { expenses: totalExpenses, income: totalIncome, net: netAmount } = calculateMonthTotal(monthExpenses);
            
            return (
              <Card key={month} className="batcard p-4">
                <div className="flex items-center mb-3 flex-col md:flex-row gap-2">
                  <div>
                  <h3 className="text-md font-medium">{month}</h3>
                  </div>
                  <div className="flex text-xs align-center space-x-2 items-center">
                    <div className="flex items-center align-center">
                      <MinusCircle className="h-3 w-3 text-batman-red mr-1" />
                      <span className="text-batman-red font-bold">{formatCurrency(totalExpenses)}</span>
                    </div>
                    <div className="flex items-center">
                      <PlusCircle className="h-3 w-3 text-batman-green mr-1" />
                      <span className="text-batman-green font-bold">{formatCurrency(totalIncome)}</span>
                    </div>
                  </div>
                </div>
                
                <Separator className="mb-3 bg-batman-secondary/30" />
                
                <div className="space-y-2">
                  {monthExpenses
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((expense) => {
                      const category = categories.find(c => c.id === expense.category);
                      
                      return (
                        <div key={expense.id} className="flex justify-between items-center p-2 hover:bg-batman-secondary/10 rounded-md transition-colors">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-1 h-10 rounded-sm"
                              style={{ backgroundColor: category?.color || '#5BC0EB' }} 
                            />
                            <div>
                              <div className="flex items-center">
                                {expense.type === "income" ? (
                                  <PlusCircle className="h-3 w-3 text-batman-green mr-1" />
                                ) : (
                                  <MinusCircle className="h-3 w-3 text-batman-red mr-1" />
                                )}
                                <p className="font-medium text-sm truncate max-w-[150px] md:max-w-none">
                                  {expense.description}
                                </p>
                              </div>
                              <p className="text-xs text-batman-foreground/60">
                                {category?.name} • {format(new Date(expense.date), "MMM d")}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <span className={`font-bold text-sm mr-1 ${expense.type === "income" ? "text-batman-green" : "text-batman-red"}`}>
                              {expense.type === "income" ? "+" : "-"}{formatCurrency(expense.amount)}
                            </span>
                            
                            <AlertDialog >
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-batman-foreground/60 hover:text-batman-foreground">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="batcard w-80">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this transaction? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-batman-secondary/40">Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => deleteExpense(expense.id)}
                                    className="bg-batman-red text-white hover:bg-batman-red/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </Card>
            );
          })
      ) : (
        <Card className="batcard p-4 text-center">
          <p className="text-batman-foreground/60 mb-4">No transactions found.</p>
          <Button 
            onClick={() => window.location.href = '/add'}
            className="bg-batman-accent text-batman hover:bg-batman-accent/90"
          >
            Add New Transaction
          </Button>
        </Card>
      )}
    </div>
  );
};
