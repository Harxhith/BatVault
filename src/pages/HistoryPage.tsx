
import { Layout } from "@/components/Layout";
import { ExpenseHistory } from "@/components/ExpenseHistory";
import { RecurringPreview } from "@/components/recurring/RecurringPreview";
import { useEffect, useState } from "react";
import  GoalsOverview  from "@/components/goals/GoalsOverview";

const HistoryPage = () => {
  const [key, setKey] = useState(Date.now());
  
  // Add an effect to refresh components when data changes
  useEffect(() => {
    const handleDataChange = () => {
      // Force re-render by changing the key
      setKey(Date.now());
    };
    
    window.addEventListener('expenses-data-changed', handleDataChange);
    
    return () => {
      window.removeEventListener('expenses-data-changed', handleDataChange);
    };
  }, []);

  return (
    <Layout>
      <div className="max-w-8xl mx-auto w-full px-6 pt-8 pb-8 md:pb-12">
        <div className="p-4 pb-6 sm:p-0 sm:pb-6">
          <GoalsOverview />
        </div>
        <div className="py-0 px-4 sm:px-0">
        <RecurringPreview key={`recurring-${key}`} />
        </div>
        <ExpenseHistory key={`history-${key}`} />
      </div>
    </Layout>
  );
};

export default HistoryPage;
