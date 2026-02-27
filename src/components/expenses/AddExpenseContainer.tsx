
import React from "react";
import { Card } from "@/components/ui/card";
import { TransactionType } from "./TransactionType";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecurringTransactionType } from "../recurring/RecurringTransactionType";
import { Calendar, RotateCcw } from "lucide-react";

export const AddExpenseContainer: React.FC = () => {
  return (
    <div className="p-6 space-y-6 pt-8 pb-0">
      <Card className="batcard p-6">
        <Tabs defaultValue="one-time" className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="one-time" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              One-time
            </TabsTrigger>
            <TabsTrigger value="recurring" className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Recurring
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="one-time">
            <TransactionType />
          </TabsContent>
          
          <TabsContent value="recurring">
            <RecurringTransactionType />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};
