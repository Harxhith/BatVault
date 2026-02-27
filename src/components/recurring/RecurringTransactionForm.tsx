import React, { useState, useEffect } from "react";
import { useExpenses } from "@/context/ExpenseContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays, addMonths, addYears } from "date-fns";
import { CalendarIcon, IndianRupee, Tag, RotateCcw, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CategoryDialog } from "../expenses/CategoryDialog";
import { db } from "@/integrations/firebase/client";
import { collection, addDoc } from "firebase/firestore";

interface RecurringTransactionFormProps {
  transactionType: "expense" | "income";
  onComplete?: () => void;
}

const frequencies = [
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "quarterly", label: "Quarterly (Every 3 months)" },
  { id: "yearly", label: "Yearly" },
];

const daysOfWeek = [
  { id: 0, label: "Sunday" },
  { id: 1, label: "Monday" },
  { id: 2, label: "Tuesday" },
  { id: 3, label: "Wednesday" },
  { id: 4, label: "Thursday" },
  { id: 5, label: "Friday" },
  { id: 6, label: "Saturday" },
];

export const RecurringTransactionForm: React.FC<RecurringTransactionFormProps> = ({ 
  transactionType,
  onComplete
}) => {
  const { categories } = useExpenses();
  const { currentUser } = useAuth();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [frequency, setFrequency] = useState<string>("monthly");
  const [dayOfMonth, setDayOfMonth] = useState<string>("");
  const [dayOfWeek, setDayOfWeek] = useState<string>("");
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setDayOfMonth(new Date().getDate().toString());
    setDayOfWeek(new Date().getDay().toString());
  }, []);

  const calculateNextRunDate = (
    startDate: Date,
    frequency: string,
    dayOfMonth?: number,
    dayOfWeek?: number
  ): Date => {
    const today = new Date();
    let nextDate = new Date(startDate);
    
    if (nextDate < today) {
      nextDate = new Date(today);
    }
    
    switch (frequency) {
      case "weekly":
        if (dayOfWeek !== undefined) {
          const currentDay = nextDate.getDay();
          const daysUntilNextDay = (dayOfWeek - currentDay + 7) % 7;
          nextDate = addDays(nextDate, daysUntilNextDay);
        }
        break;
      case "monthly":
        if (dayOfMonth !== undefined) {
          nextDate.setDate(1);
          nextDate.setDate(Math.min(dayOfMonth, getDaysInMonth(nextDate.getMonth(), nextDate.getFullYear())));
          if (nextDate < today) {
            nextDate = addMonths(nextDate, 1);
            nextDate.setDate(Math.min(dayOfMonth, getDaysInMonth(nextDate.getMonth(), nextDate.getFullYear())));
          }
        }
        break;
      case "quarterly":
        if (dayOfMonth !== undefined) {
          nextDate.setDate(1);
          const currentMonth = nextDate.getMonth();
          const targetQuarterMonth = Math.floor(currentMonth / 3) * 3;
          
          if (
            nextDate.getMonth() > targetQuarterMonth || 
            (nextDate.getMonth() === targetQuarterMonth && nextDate.getDate() > dayOfMonth)
          ) {
            nextDate = addMonths(nextDate, 3);
          } else {
            nextDate.setMonth(targetQuarterMonth);
          }
          
          nextDate.setDate(Math.min(dayOfMonth, getDaysInMonth(nextDate.getMonth(), nextDate.getFullYear())));
        }
        break;
      case "yearly":
        if (dayOfMonth !== undefined) {
          const currentMonth = nextDate.getMonth();
          if (
            (currentMonth > 0) || 
            (currentMonth === 0 && nextDate.getDate() > dayOfMonth)
          ) {
            nextDate = addYears(nextDate, 1);
          }
          
          nextDate.setMonth(0);
          nextDate.setDate(Math.min(dayOfMonth, getDaysInMonth(0, nextDate.getFullYear())));
        }
        break;
    }
    
    return nextDate;
  };

  const getDaysInMonth = (month: number, year: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const resetForm = () => {
    setAmount("");
    setDescription("");
    setCategory("");
    setStartDate(new Date());
    setEndDate(undefined);
    setFrequency("monthly");
    setDayOfMonth(new Date().getDate().toString());
    setDayOfWeek(new Date().getDay().toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid amount");
      setIsSubmitting(false);
      return;
    }
    
    if (!category) {
      toast.error("Please select a category");
      setIsSubmitting(false);
      return;
    }
    
    if (!frequency) {
      toast.error("Please select a frequency");
      setIsSubmitting(false);
      return;
    }
    
    try {
      const parsedDayOfMonth = frequency !== "weekly" ? parseInt(dayOfMonth) : undefined;
      const parsedDayOfWeek = frequency === "weekly" ? parseInt(dayOfWeek) : undefined;
      
      const nextRunDate = calculateNextRunDate(
        startDate,
        frequency,
        parsedDayOfMonth,
        parsedDayOfWeek
      );
      
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      
      await addDoc(collection(db, "recurring_transactions"), {
        user_id: currentUser.uid,
        amount: parsedAmount,
        description,
        category_id: category,
        type: transactionType,
        frequency,
        start_date: startDate.toISOString(),
        end_date: endDate?.toISOString() || null,
        next_run_date: nextRunDate.toISOString(),
        day_of_month: parsedDayOfMonth !== undefined ? parsedDayOfMonth : null,
        day_of_week: parsedDayOfWeek !== undefined ? parsedDayOfWeek : null,
        active: true
      });
      
      toast.success(`Recurring ${transactionType} scheduled successfully`);
      
      const refreshEvent = new CustomEvent('refresh-data');
      window.dispatchEvent(refreshEvent);
      
      resetForm();
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Error scheduling recurring transaction:", error);
      toast.error(`Failed to schedule recurring ${transactionType}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="amount" className="text-sm font-medium text-batman-foreground/80 flex items-center gap-2">
              <IndianRupee className={`h-4 w-4 ${transactionType === "income" ? "text-batman-green" : "text-batman-accent"}`} />
              Amount
            </label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-batman border-batman-secondary/40 focus:border-batman-accent"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-batman-foreground/80 flex items-center gap-2">
              <Tag className={`h-4 w-4 ${transactionType === "income" ? "text-batman-green" : "text-batman-accent"}`} />
              Description
            </label>
            <Textarea
              id="description"
              placeholder={`What is this recurring ${transactionType} for?`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-batman border-batman-secondary/40 focus:border-batman-accent resize-none"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-batman-foreground/80 flex items-center gap-2">
              <Tag className={`h-4 w-4 ${transactionType === "income" ? "text-batman-green" : "text-batman-accent"}`} />
              Category
            </label>
            <div className="flex gap-2">
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger className="w-full bg-batman border-batman-secondary/40">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-batman-muted border-batman-secondary/40">
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: cat.color }} 
                        />
                        <span>{cat.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                type="button"
                variant="outline"
                className="border-batman-secondary/40 hover:bg-batman-secondary/20"
                onClick={() => setShowCategoryDialog(true)}
              >
                <Tag className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-batman-foreground/80 flex items-center gap-2">
              <RotateCcw className={`h-4 w-4 ${transactionType === "income" ? "text-batman-green" : "text-batman-accent"}`} />
              Frequency
            </label>
            <Select value={frequency} onValueChange={setFrequency} required>
              <SelectTrigger className="w-full bg-batman border-batman-secondary/40">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent className="bg-batman-muted border-batman-secondary/40">
                {frequencies.map((freq) => (
                  <SelectItem key={freq.id} value={freq.id}>
                    {freq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {frequency === "weekly" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-batman-foreground/80 flex items-center gap-2">
                <Clock className={`h-4 w-4 ${transactionType === "income" ? "text-batman-green" : "text-batman-accent"}`} />
                Day of week
              </label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek} required>
                <SelectTrigger className="w-full bg-batman border-batman-secondary/40">
                  <SelectValue placeholder="Select day of week" />
                </SelectTrigger>
                <SelectContent className="bg-batman-muted border-batman-secondary/40">
                  {daysOfWeek.map((day) => (
                    <SelectItem key={day.id} value={day.id.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {frequency !== "weekly" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-batman-foreground/80 flex items-center gap-2">
                <Clock className={`h-4 w-4 ${transactionType === "income" ? "text-batman-green" : "text-batman-accent"}`} />
                Day of month
              </label>
              <Input
                type="number"
                min="1"
                max="31"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
                className="bg-batman border-batman-secondary/40 focus:border-batman-accent"
                required
              />
              <p className="text-xs text-batman-foreground/60">
                If the day exceeds the days in a month, the last day of the month will be used.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-batman-foreground/80 flex items-center gap-2">
              <CalendarIcon className={`h-4 w-4 ${transactionType === "income" ? "text-batman-green" : "text-batman-accent"}`} />
              Start Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal bg-batman border-batman-secondary/40 hover:bg-batman-secondary/20",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-batman-muted border-batman-secondary/40">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(d) => d && setStartDate(d)}
                  initialFocus
                  className="bg-batman-muted"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-batman-foreground/80 flex items-center gap-2">
              <CalendarIcon className={`h-4 w-4 ${transactionType === "income" ? "text-batman-green" : "text-batman-accent"}`} />
              End Date (Optional)
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal bg-batman border-batman-secondary/40 hover:bg-batman-secondary/20",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : <span>No end date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-batman-muted border-batman-secondary/40">
                <div className="p-2">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-left mb-2"
                    onClick={() => setEndDate(undefined)}
                  >
                    No end date
                  </Button>
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(d) => setEndDate(d || undefined)}
                    disabled={(date) => date < startDate}
                    initialFocus
                    className="bg-batman-muted"
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Button 
          type="submit" 
          className={`w-full ${
            transactionType === "income" 
            ? "bg-batman-green text-batman hover:bg-batman-green/90" 
            : "bg-batman-accent text-batman hover:bg-batman-accent/90"
          } transition-colors`}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Scheduling..." : `Schedule Recurring ${transactionType}`}
        </Button>
      </form>

      <CategoryDialog 
        open={showCategoryDialog} 
        onOpenChange={setShowCategoryDialog}
        onCategoryAdded={(categoryId) => setCategory(categoryId)}
      />
    </>
  );
};
