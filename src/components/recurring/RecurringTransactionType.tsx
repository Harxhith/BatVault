
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, MinusCircle } from "lucide-react";
import { RecurringTransactionForm } from "./RecurringTransactionForm";

export const RecurringTransactionType: React.FC = () => {
  const [transactionType, setTransactionType] = React.useState<"expense" | "income">("expense");

  return (
    <Tabs defaultValue="expense" onValueChange={(value) => setTransactionType(value as "expense" | "income")}>
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
        <RecurringTransactionForm transactionType="expense" />
      </TabsContent>
      
      <TabsContent value="income">
        <RecurringTransactionForm transactionType="income" />
      </TabsContent>
    </Tabs>
  );
};
