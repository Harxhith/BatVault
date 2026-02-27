import { useEffect, useState } from "react";
import { auth, db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Goal } from "@/types"; 
import { IndianRupee, TargetIcon } from "lucide-react";
import { toast } from "sonner";
import { useExpenses } from "@/context/ExpenseContext";


export default function AddSavingsForm({ refresh }: { refresh: boolean }) {
  const { addExpense, categories } = useExpenses();
  const [date, setDate] = useState<Date>(new Date());
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true); // Set loading to true initially

  useEffect(() => {
    const fetchGoals = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const goalsQ = query(collection(db, "goals"), where("user_id", "==", user.uid));
        const snapshot = await getDocs(goalsQ);
        const data = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as unknown as Goal[];

        setGoals(data);
        if (data.length > 0) setSelectedGoalId(data[0].id);
      } catch (error) {
        console.error("Error fetching goals", error);
      }
      setLoading(false); // Set loading to false once the data is fetched
    };

    fetchGoals();
  }, [refresh]);

  const getSavingsCategoryId = async (): Promise<string | null> => {
    try {
      const savingsCategory = categories.find(cat => cat.name === "Savings");
  
      if (!savingsCategory) {
        toast.error('"Savings" category not found. Please create it first.');
        return null;
      }
  
      return savingsCategory.id;
    } catch (error) {
      console.error("Error fetching Savings category ID:", error);
      toast.error("Create a category called 'Savings' first.");
      return null;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalId || !amount) return;

    setLoading(true);

    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, "goal_savings"), {
        user_id: user.uid,
        goal_id: selectedGoalId,
        amount: parseFloat(amount),
      });

      const savingsid = await getSavingsCategoryId();

      if (savingsid) {
        await addExpense({
          amount: parseFloat(amount),
          description:"Goal Savings",
          category: savingsid,
          date,
          type: "expense"
        });
      }

      toast.success("Savings added successfully!");
      setAmount("");
    } catch (error) {
      console.error("Error saving:", error);
    }

    setLoading(false);
  };

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
    <form onSubmit={handleSubmit} className="space-y-4 p-4 batcard rounded-lg shadow max-w-8xl bg-card">

      <div className="space-y-2">
        <label className="text-sm font-medium text-batman-foreground/80 flex items-center gap-2">
          <TargetIcon className="h-4 w-4 text-batman-accent" />
          Select Goal</label>
        <select
          value={selectedGoalId || ""}
          onChange={(e) => setSelectedGoalId(e.target.value)}
          className="w-full p-2 rounded bg-batman border-batman-secondary/40"
        >
          {goals.map((goal) => (
            <option key={goal.id} value={goal.id}>
              {goal.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-batman-foreground/80 flex items-center gap-2">
          <IndianRupee className="h-4 w-4 text-batman-accent" />
          Amount</label>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g. 1500"
          className="bg-batman border-batman-secondary/40"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="bg-batman-accent hover:bg-batman-accent/90 text-batman w-full"
      >
        {loading ? "Saving..." : "Add Savings"}
      </Button>
    </form>
  );
}
