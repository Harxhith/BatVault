import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useExpenses } from "@/context/ExpenseContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { LogOut, Trash2, IndianRupee } from "lucide-react";
import NotificationSettings from "./NotificationSettings";


const Settings = () => {
  const { currentUser, signOut } = useAuth();
  const { initialBalance, updateInitialBalance, clearAllData } = useExpenses();
  const [balance, setBalance] = useState(initialBalance.toString());

  // Sync local state when context's initialBalance changes (e.g. after a successful update)
  useEffect(() => {
    setBalance(initialBalance.toString());
  }, [initialBalance]);
  const navigate = useNavigate();

  const handleUpdateBalance = async () => {
    const numericBalance = parseFloat(balance);
    if (!isNaN(numericBalance)) {
      await updateInitialBalance(numericBalance);
      // Toast is handled by ExpenseContext.updateInitialBalance
    } else {
      toast.error("Invalid Amount", {
        description: "Please enter a valid number for the initial balance.",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Logout Failed", {
        description: "An error occurred during logout. Please try again.",
      });
    }
  };

  const handleClearAllData = async () => {
    try {
      await clearAllData();
      toast.success("Data Cleared", {
        description: "All your expenses data has been cleared successfully!",
      });
    } catch (error) {
      console.error("Error clearing data:", error);
      toast.error("Error", {
        description: "Failed to clear data. Please try again.",
      });
    }
  };

  return (
    <div className="space-y-6 px-6 pt-8 pb-8 md:pb-12">
      <Card className="border-batman-secondary/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 align-center">
            <IndianRupee className="h-5 w-5" />
            Initial Balance
          </CardTitle>
          <CardDescription>
            Set your starting balance. This affects the calculation of your remaining budget.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="initial-balance">Initial Balance</Label>
            <Input
              id="initial-balance"
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="Enter your initial balance"
              className="max-w-xs"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleUpdateBalance}>Update Balance</Button>
        </CardFooter>
      </Card>

      <NotificationSettings />

      <Card className="border-batman-secondary/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-500">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            These actions are irreversible. Please proceed with caution.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Clear All Data</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all your expenses, categories, and reset your balance.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAllData}>
                  Yes, clear all data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <LogOut className="h-4 w-4" /> Logout
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will need to login again to access your data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout}>
                  Yes, logout
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
