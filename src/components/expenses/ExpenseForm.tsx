
import React, { useState, useEffect } from "react";
import { useExpenses } from "@/context/ExpenseContext";
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
import { format } from "date-fns";
import { CalendarIcon, Plus, IndianRupee, Tag, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryDialog } from "./CategoryDialog";
import { toast } from "sonner";

interface ExpenseFormProps {
  transactionType: "expense" | "income";
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ transactionType }) => {
  const { categories, addExpense } = useExpenses();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);


  const resetForm = () => {
    setAmount("");
    setDescription("");
    setCategory("");
    setDate(new Date());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
  
    if (!category) {
      toast.error("Please select a category");
      return;
    }
  
    await addExpense({
      amount: parsedAmount,
      description,
      category,
      date,
      type: transactionType
    });
  
    resetForm();
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
              placeholder={`What was this ${transactionType} for?`}
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
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-batman-foreground/80 flex items-center gap-2">
              <CalendarIcon className={`h-4 w-4 ${transactionType === "income" ? "text-batman-green" : "text-batman-accent"}`} />
              Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal bg-batman border-batman-secondary/40 hover:bg-batman-secondary/20",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-batman-muted border-batman-secondary/40">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                  className="bg-batman-muted"
                />
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
        >
          {transactionType === "income" ? "Add Income" : "Add Expense"}
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
