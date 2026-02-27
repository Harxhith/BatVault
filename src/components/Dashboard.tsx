import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useExpenses } from "@/context/ExpenseContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BadgeDollarSign,
  BadgeIndianRupee, 
  PiggyBank, 
  TrendingUp, 
  Calendar, 
  AlertCircle,
  PlusCircle,
  MinusCircle 
} from "lucide-react";
import { format } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/utils/formatCurrency";
import { toast } from "sonner";
import { TooltipProps } from 'recharts';
import { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';


export const Dashboard: React.FC = () => {
  const { expenses, categories, initialBalance, currentBalance, updateInitialBalance, refreshData } = useExpenses();
  const navigate = useNavigate();
  const [showBalanceForm, setShowBalanceForm] = useState(false);
  const [newBalance, setNewBalance] = useState(initialBalance.toString());

  // Sync newBalance input when initialBalance from context changes
  useEffect(() => {
    setNewBalance(initialBalance.toString());
  }, [initialBalance]);

  const handleBalanceUpdate = async () => {
    const numBalance = parseFloat(newBalance);
    if (!isNaN(numBalance)) {
      try {
        await updateInitialBalance(numBalance);
        await refreshData();
        setShowBalanceForm(false);
      } catch (error) {
        console.error("Error updating balance:", error);
        toast.error("Failed to update balance");
      }
    } else {
      toast.error("Please enter a valid amount");
    }
  };

  const categoryTotals = categories.map((category) => {
    const total = expenses
      .filter((expense) => expense.category === category.id && expense.type === "expense")
      .reduce((sum, expense) => sum + expense.amount, 0);
    return {
      name: category.name,
      value: total,
      color: category.color,
    };
  }).filter(cat => cat.value > 0);

  const today = new Date();
  const todayString = format(today, "yyyy-MM-dd");
  const todayExpenses = expenses
    .filter((expense) => format(expense.date, "yyyy-MM-dd") === todayString && expense.type === "expense")
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  const todayIncome = expenses
    .filter((expense) => format(expense.date, "yyyy-MM-dd") === todayString && expense.type === "income")
    .reduce((sum, expense) => sum + expense.amount, 0);

  const thisMonth = format(today, "yyyy-MM");
  const thisMonthExpenses = expenses
    .filter((expense) => format(expense.date, "yyyy-MM") === thisMonth && expense.type === "expense")
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  const thisMonthIncome = expenses
    .filter((expense) => format(expense.date, "yyyy-MM") === thisMonth && expense.type === "income")
    .reduce((sum, expense) => sum + expense.amount, 0);

  const isDeficit = currentBalance < 0;

  const CustomTooltip: React.FC<TooltipProps<ValueType, NameType>> = ({
    active,
    payload,
  }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: '#1D252D',
            border: '1px solid #3A506B',
            borderRadius: '0.375rem',
            padding: '8px 12px',
          }}
        >
          <p style={{ color: '#ffffff', margin: 0 }}>
            {payload[0].name}: {formatCurrency(payload[0].value as number)}
          </p>
        </div>
      );
    }
  
    return null;
  };

  return (
    <div className="space-y-6 p-6 pt-8 sm:pt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="batcard p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-batman-foreground/80">Current Balance</h3>
            <PiggyBank className="h-5 w-5 text-batman-accent" />
          </div>
          <div className="flex items-baseline">
            <span className={`text-3xl font-bold ${currentBalance >= 0 ? 'text-batman-green' : 'text-batman-red'}`}>
              {formatCurrency(currentBalance)}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm pt-2">
            <span className="text-batman-foreground/60">Initial Balance:</span>
            <span className="font-medium">{formatCurrency(initialBalance)}</span>
          </div>

          <Button 
            variant="outline" 
            size="sm"
            className="w-full border-batman-secondary/30 hover:bg-batman-secondary/10"
            onClick={() => setShowBalanceForm(!showBalanceForm)}
          >
            {showBalanceForm ? "Cancel" : "Update Balance"}
          </Button>

          {showBalanceForm && (
            <div className="flex flex-col space-y-2 animate-fade-in">
              <Input
                type="number"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                placeholder="Enter new balance"
                className="bg-batman border-batman-secondary/40"
              />
              <Button 
                onClick={handleBalanceUpdate}
                className="bg-batman-accent text-batman hover:bg-batman-accent/90"
              >
                Save
              </Button>
            </div>
          )}
        </Card>

        <Card className="batcard p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-batman-foreground/80">Spending Overview</h3>
            <TrendingUp className="h-5 w-5 text-batman-accent" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-sm text-batman-foreground/60">Today</span>
              <div className="flex flex-col">
                <div className="flex items-center">
                  <MinusCircle className="h-4 w-4 text-batman-red mr-1" />
                  <span className="text-lg font-bold text-batman-red">{formatCurrency(todayExpenses)}</span>
                </div>
                <div className="flex items-center mt-1">
                  <PlusCircle className="h-4 w-4 text-batman-green mr-1" />
                  <span className="text-lg font-bold text-batman-green">{formatCurrency(todayIncome)}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-sm text-batman-foreground/60">This Month</span>
              <div className="flex flex-col">
                <div className="flex items-center">
                  <MinusCircle className="h-4 w-4 text-batman-red mr-1" />
                  <span className="text-lg font-bold text-batman-red">{formatCurrency(thisMonthExpenses)}</span>
                </div>
                <div className="flex items-center mt-1">
                  <PlusCircle className="h-4 w-4 text-batman-green mr-1" />
                  <span className="text-lg font-bold text-batman-green">{formatCurrency(thisMonthIncome)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm flex justify-between items-center pt-2">
            <span className="text-batman-foreground/60">Last Updated:</span>
            <span className="font-medium">{format(new Date(), "MMM d, yyyy")}</span>
          </div>
        </Card>
      </div>

      {isDeficit && (
        <div className="bg-batman-red/10 border border-batman-red/30 rounded-lg p-4 flex items-center space-x-3 animate-pulse-slow">
          <AlertCircle className="h-5 w-5 text-batman-red" />
          <div>
            <p className="text-batman-red font-medium">Warning: You're in deficit</p>
            <p className="text-sm text-batman-foreground/70">Your current balance is negative. Consider reducing expenses.</p>
          </div>
        </div>
      )}

      <Card className="batcard p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-batman-foreground/80">Expense Breakdown</h3>
          <BadgeIndianRupee className="h-5 w-5 text-batman-accent" />
        </div>

        {categoryTotals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryTotals}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryTotals.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {categoryTotals.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color }} 
                    />
                    <span>{category.name}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(category.value)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center p-8 text-batman-foreground/60">
            <p>No expenses yet. Start adding expenses to see your breakdown.</p>
          </div>
        )}
      </Card>

      <Card className="batcard p-6 mb-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-batman-foreground/80">Recent Transactions</h3>
          <Calendar className="h-5 w-5 text-batman-accent" />
        </div>

        {expenses.length > 0 ? (
          <div className="space-y-3">
            {expenses.slice(0, 2).map((expense) => {
              const category = categories.find(c => c.id === expense.category);
              return (
                <div key={expense.id} className="flex items-center justify-between py-2 border-b border-batman-secondary/20">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-2 h-10 rounded-sm"
                      style={{ backgroundColor: category?.color || '#5BC0EB' }} 
                    />
                    <div>
                      <p className="font-medium pr-2 text-sm">{expense.description}</p>
                      <p className="text-xs text-batman-foreground/60">
                        {category?.name} • {format(expense.date, "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {expense.type === "income" ? (
                      <PlusCircle className="h-4 w-4 text-batman-green mr-2" />
                    ) : (
                      <MinusCircle className="h-4 w-4 text-batman-red mr-2" />
                    )}
                    <span className={`font-bold ${expense.type === "income" ? "text-batman-green" : "text-batman-red"}`}>
                      {formatCurrency(expense.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
            
            <Button 
              variant="outline" 
              size="sm"
              className="w-full mt-2 border-batman-secondary/30 hover:bg-batman-secondary/10"
              onClick={() => navigate('/history')}
            >
              View All Transactions
            </Button>
          </div>
        ) : (
          <div className="text-center p-8 text-batman-foreground/60">
            <p>No recent transactions. Add your first expense!</p>
          </div>
        )}
      </Card>
    </div>
  );
};
