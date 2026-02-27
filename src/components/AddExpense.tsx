
import { AddExpenseContainer } from "./expenses/AddExpenseContainer";
import AddGoalForm from "./goals/GoalForm";
import AddSavingsForm from "./goals/AddSavings";
import { useState } from "react";

export const AddExpense: React.FC = () => {
  const [refresh, setRefresh] = useState(false);

  const handleGoalAdded = () => {
    setRefresh((prev) => !prev); // just toggle the state
  };
  return (
    <>
      <AddExpenseContainer />
      <div className="p-6 pb-0">
      <AddGoalForm onGoalAdded={handleGoalAdded} />
      </div>
      <div className="p-6 pb-24 sm:pb-6">
      <AddSavingsForm refresh={refresh}/>
      </div>
    </>
  );
};
