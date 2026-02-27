import { useEffect, useState } from "react";
import { auth, db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  CalendarIcon,
  Pencil,
  Trash2,
  Save,
  X,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

type Goal = {
  id: string;
  name: string;
  target_amount: number;
  deadline: string | null;
  total_saved: number;
};

export default function ManageGoalsList() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Goal>>({});

  const fetchGoals = async () => {
    setLoading(true);
    const user = auth.currentUser;
    if (!user) return;

    try {
      const goalsQ = query(collection(db, "goals"), where("user_id", "==", user.uid));
      const goalsSnap = await getDocs(goalsQ);
      
      const savingsQ = query(collection(db, "goal_savings"), where("user_id", "==", user.uid));
      const savingsSnap = await getDocs(savingsQ);

      const savingsMap: Record<string, number> = {};
      savingsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        savingsMap[data.goal_id] = (savingsMap[data.goal_id] || 0) + parseFloat(data.amount);
      });

      const merged = goalsSnap.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name,
          target_amount: data.target_amount,
          deadline: data.deadline || null,
          total_saved: savingsMap[docSnap.id] || 0,
        };
      });

      setGoals(merged);
    } catch (error) {
      console.error("Error fetching goals:", error);
      toast.error("Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const startEditing = (goal: Goal) => {
    setEditingId(goal.id);
    setEditForm({
      name: goal.name,
      target_amount: goal.target_amount,
      deadline: goal.deadline ? new Date(goal.deadline) : null,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveChanges = async (goalId: string) => {
    const { name, target_amount, deadline } = editForm;
    try {
      await updateDoc(doc(db, "goals", goalId), {
        name,
        target_amount,
        deadline: deadline ? format(deadline, "yyyy-MM-dd") : null,
      });

      toast.success("Goal updated successfully");
      cancelEditing();
      fetchGoals();
    } catch (error) {
      console.error("Error saving goal:", error);
      toast.error("Failed to save changes");
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      await deleteDoc(doc(db, "goals", goalId));
      toast.success("Goal deleted successfully");
      fetchGoals();
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error("Failed to delete goal");
    }
  };
 
  if (loading) {
    return (
        <div className="h-10 w-full animate-pulse bg-batman-secondary/20 rounded-md" />
    );
  }

  return (
    <Card className="p-4 space-y-2.5 bg-card rounded-xl shadow-md border border-muted max-w-8xl">
      <h2 className="text-lg font-medium text-batman-foreground/80">Your Goals</h2>

      {goals.length === 0 && (
        <p className="text-sm text-muted-foreground">No goals added yet.</p>
      )}

      {goals.map((goal, index) => {
        const isEditing = editingId === goal.id;
        const progress = Math.min((goal.total_saved / goal.target_amount) * 100, 100);

        return (
          <div key={goal.id} className="pb-2 space-y-1">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editForm.name || ""}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Goal name"
                />
                <Input
                  type="number"
                  value={editForm.target_amount || ""}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      target_amount: parseFloat(e.target.value),
                    }))
                  }
                  placeholder="Target amount"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left text-sm font-normal bg-muted",
                        !editForm.deadline && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editForm.deadline
                        ? format(new Date(editForm.deadline), "PPP")
                        : "Pick deadline"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-card border-muted">
                    <Calendar
                      mode="single"
                      selected={
                        editForm.deadline ? new Date(editForm.deadline) : undefined
                      }
                      onSelect={(date) =>
                        setEditForm((prev) => ({ ...prev, deadline: date || null }))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <div className="flex gap-2">
                  <Button
                    onClick={() => saveChanges(goal.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button
                    onClick={cancelEditing}
                    variant="ghost"
                    className="flex-1 text-muted-foreground bg-red-600 text-white"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">🎯 {goal.name}</p>
                    <div className="flex items-center text-batman-foreground/60">
                    <p className="text-sm">
                      ₹{goal.total_saved} / ₹{goal.target_amount}
                    </p>
                    {goal.deadline && <span className="mx-1">•</span>}
                    {goal.deadline && (
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(goal.deadline), "MMM d, yyyy")}
                      </p>
                    )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => startEditing(goal)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteGoal(goal.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>
        );
      })}
    </Card>
  );
}
