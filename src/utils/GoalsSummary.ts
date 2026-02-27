import { auth, db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";
import { format } from "date-fns";

export async function getUserGoalsWithProgress() {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn("User not authenticated.");
      return { goals: [], formattedGoals: "" };
    }

    // Fetch goals
    const goalsQ = query(collection(db, "goals"), where("user_id", "==", user.uid));
    const goalsSnap = await getDocs(goalsQ);
    const goalsData = goalsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    // Fetch goal_savings
    const savingsQ = query(collection(db, "goal_savings"), where("user_id", "==", user.uid));
    const savingsSnap = await getDocs(savingsQ);
    const savingsData = savingsSnap.docs.map(doc => doc.data()) as any[];

    // Calculate total saved per goal
    const savingsMap: Record<string, number> = {};
    savingsData.forEach(entry => {
      savingsMap[entry.goal_id] = (savingsMap[entry.goal_id] || 0) + parseFloat(entry.amount);
    });

    // Merge and format goals
    const goalsWithProgress = goalsData.map(goal => {
      return {
        ...goal,
        total_saved: savingsMap[goal.id] || 0
      };
    });

    const formattedGoals = goalsWithProgress.map(goal => {
      const deadlineText = goal.deadline ? `by ${format(new Date(goal.deadline), "dd MMM yyyy")}` : "no deadline";
      return `${goal.name} (₹${goal.target_amount}, saved ₹${goal.total_saved}, ${deadlineText})`;
    }).join("; ");

    return { goals: goalsWithProgress, formattedGoals };

  } catch (err) {
    console.error("Unexpected error getting user goals:", err);
    return { goals: [], formattedGoals: "" };
  }
}