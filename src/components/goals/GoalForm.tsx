import { useState } from "react";
import { auth, db } from "@/integrations/firebase/client";
import { collection, addDoc } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TargetIcon ,IndianRupee } from "lucide-react";
import { toast } from "sonner";

export default function AddGoalForm({ onGoalAdded }: { onGoalAdded?: () => void }) {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !targetAmount) {
      return;
    }

    setLoading(true);

    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, "goals"), {
        user_id: user.uid,
        name,
        target_amount: parseFloat(targetAmount),
        deadline: deadline ? format(deadline, "yyyy-MM-dd") : null,
      });

      toast.success("Goal added successfully!");
      setName("");
      setTargetAmount("");
      setDeadline(undefined);
      onGoalAdded?.();
    } catch (error) {
      console.error("Failed to insert goal:", error);
    }

    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 batcard rounded-lg shadow max-w-8xl bg-card"
    >

      <div className="space-y-2">
        <label className="text-sm font-medium text-batman-foreground/80 flex items-center gap-2"><TargetIcon className="h-4 w-4 text-batman-accent" />
        Goal Name
        </label>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border-batman-secondary/40 rounded-md bg-batman"
          placeholder="e.g. Lamborghini Aventador"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-batman-foreground/80 flex items-center gap-2">
        <IndianRupee className="h-4 w-4 text-batman-accent" />
        Target Amount</label>
        <Input
          type="number"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          className="w-full p-2 border-batman-secondary/40 rounded-md bg-batman"
          placeholder="e.g. 25000"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-batman-foreground/80 flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-batman-accent" />
          Deadline (optional)
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal bg-batman border-batman-secondary/40 hover:bg-batman-secondary/20",
                !deadline && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              {deadline ? format(deadline, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-batman-muted border-batman-secondary/40">
            <Calendar
              mode="single"
              selected={deadline}
              onSelect={(d) => d && setDeadline(d)}
              initialFocus
              className="bg-batman-muted"
            />
          </PopoverContent>
        </Popover>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="bg-batman-accent text-batman hover:bg-batman-accent/90 w-full"
      >
        {loading ? "Saving..." : "Add Goal"}
      </Button>
    </form>
  );
}
