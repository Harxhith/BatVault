import { useEffect, useState, useCallback } from "react";
import { auth, db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

type Goal = {
  id: string;
  name: string;
  target_amount: number;
  deadline: string | null;
  total_saved: number;
};

export default function GoalsList() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoalsWithSavings = useCallback(async () => {
    setLoading(true);

    const user = auth.currentUser;
    if (!user) {
      console.error("Not authenticated");
      setLoading(false);
      return;
    }

    try {
      const goalsQ = query(collection(db, "goals"), where("user_id", "==", user.uid));
      const goalsSnap = await getDocs(goalsQ);

      const savingsQ = query(collection(db, "goal_savings"), where("user_id", "==", user.uid));
      const savingsSnap = await getDocs(savingsQ);

      const savingsMap: Record<string, number> = {};
      savingsSnap.forEach((docSnap) => {
        const entry = docSnap.data();
        savingsMap[entry.goal_id] = (savingsMap[entry.goal_id] || 0) + parseFloat(entry.amount);
      });

      const mergedGoals = goalsSnap.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name,
          target_amount: data.target_amount,
          deadline: data.deadline || null,
          total_saved: savingsMap[docSnap.id] || 0,
        };
      });

      setGoals(mergedGoals);
    } catch (error) {
      console.error("Failed to fetch goals:", error);
    } finally {
      setLoading(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGoalsWithSavings();
  }, [fetchGoalsWithSavings]);

  if (loading) {
    return (
        <div className="h-10 w-full animate-pulse bg-batman-secondary/20 rounded-md" />
    );
  }
  
  if (goals.length === 0) {
    return (
      <div className="p-4 bg-card rounded-lg shadow">
        <p className="text-muted-foreground text-center">You haven't created any goals yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {goals.map((goal) => {
        const progress = Math.min((goal.total_saved / goal.target_amount) * 100, 100);

        return (
          <Card
            key={goal.id}
            className="p-4 bg-card border border-batman-secondary/30 rounded-xl space-y-3"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-batman-foreground/80">🎯{goal.name}</h3>
                <p className="text-sm text-muted-foreground">
                  ₹{goal.total_saved} / ₹{goal.target_amount}
                </p>
              </div>
              {goal.deadline && (
                <span className="text-xs text-muted-foreground">
                  {format(new Date(goal.deadline), "MMM d, yyyy")}
                </span>
              )}
            </div>

            <Progress value={progress} className="h-2 bg-muted" />

          </Card>
        );
      })}
    </div>
  );
}
