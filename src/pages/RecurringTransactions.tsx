
import React from "react";
import { Layout } from "@/components/Layout";
import { RecurringTransactions } from "@/components/recurring/RecurringTransactions";

const RecurringTransactionsPage = () => {
  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-8 md:pb-12">
        <RecurringTransactions />
      </div>
    </Layout>
  );
};

export default RecurringTransactionsPage;
