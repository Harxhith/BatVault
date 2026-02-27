
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/components/Dashboard";
import { RecurringPreview } from "@/components/recurring/RecurringPreview";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import  GoalsList  from "@/components/goals/GoalList";

const DashboardPage = () => {
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
      <div className="max-w-6xl mx-auto w-full">
        <Dashboard key={`dashboard-${key}`} />
        <div className="px-6 pb-0">
          <RecurringPreview key={`recurring-${key}`} />
        </div>
        <div className="px-6 pt-0 pb-8 md:pb-12">
        <GoalsList />
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
