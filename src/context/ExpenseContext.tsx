import React, { createContext, useEffect, useState, useContext } from "react";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import { db } from "../integrations/firebase/client";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  orderBy,
  setDoc
} from "firebase/firestore";
import { User as FirebaseUser } from "firebase/auth";

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  createdAt?: Date;
  type: "expense" | "income";
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

interface ExpenseContextProps {
  expenses: Expense[];
  categories: Category[];
  initialBalance: number;
  currentBalance: number;
  currentUser: FirebaseUser | null;
  addExpense: (expense: Omit<Expense, "id" | "createdAt">) => Promise<void>;
  updateExpense: (expenseId: string, expense: Partial<Omit<Expense, "id" | "createdAt">>) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  addCategory: (category: Omit<Category, "id">) => Promise<string>;
  updateInitialBalance: (balance: number) => Promise<void>;
  clearAllData: () => Promise<void>;
  loading: boolean;
  refreshData: () => Promise<void>;
}

const ExpenseContext = createContext<ExpenseContextProps | undefined>(undefined);

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [initialBalance, setInitialBalance] = useState<number>(0);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const { currentUser } = useAuth();

  const fetchExpenses = async () => {
    if (!currentUser) return;

    try {
      const q = query(
        collection(db, "expenses"),
        where("user_id", "==", currentUser.uid),
        orderBy("date", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const mappedExpenses: Expense[] = querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          amount: data.amount,
          category: data.category_id,
          description: data.description || "",
          date: new Date(data.date),
          createdAt: data.created_at ? new Date(data.created_at) : new Date(),
          type: (data.type || "expense") as "expense" | "income"
        };
      });

      setExpenses(mappedExpenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error("Failed to load expenses");
    }
  };

  const fetchCategories = async () => {
    if (!currentUser) return;

    try {
      const q = query(
        collection(db, "categories"),
        where("user_id", "==", currentUser.uid)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        const defaultCategories = [
          { name: "Food", color: "#FF5733" },
          { name: "Transport", color: "#33A8FF" },
          { name: "Entertainment", color: "#FF33E9" },
          { name: "Bills", color: "#33FF57" },
          { name: "Shopping", color: "#F3FF33" },
          { name: "Savings", color: "#ffbf00" },
        ];

        for (const category of defaultCategories) {
          await addCategory(category);
        }

        const newSnapshot = await getDocs(q);
        const mappedCategories: Category[] = newSnapshot.docs.map(docSnap => ({
          id: docSnap.id,
          name: docSnap.data().name,
          color: docSnap.data().color,
        }));
        setCategories(mappedCategories);
      } else {
        const mappedCategories: Category[] = querySnapshot.docs.map(docSnap => ({
          id: docSnap.id,
          name: docSnap.data().name,
          color: docSnap.data().color,
        }));
        setCategories(mappedCategories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    }
  };

  const updateInitialBalance = async (balance: number) => {
    if (!currentUser) return;

    try {
      const q = query(
        collection(db, "user_settings"),
        where("user_id", "==", currentUser.uid)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        await addDoc(collection(db, "user_settings"), {
          user_id: currentUser.uid,
          initial_balance: balance,
        });
      } else {
        // Update the first matching document
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, { initial_balance: balance });
        
        // Clean up any duplicates that might have been created during migration
        if (querySnapshot.docs.length > 1) {
          for (let i = 1; i < querySnapshot.docs.length; i++) {
            await deleteDoc(querySnapshot.docs[i].ref);
          }
        }
      }
      
      // State will be updated automatically by the onSnapshot listener.
      // We still set it locally for an instant UI response.
      setInitialBalance(balance);
      toast.success("Initial balance updated");
    } catch (error) {
      console.error("Error updating balance:", error);
      toast.error("Failed to update balance");
    }
  };

  const calculateCurrentBalance = (initialBal: number, expensesList: Expense[]) => {
    const balance = expensesList.reduce((sum, transaction) => {
      if (transaction.type === "expense") {
        return sum - transaction.amount;
      } else {
        return sum + transaction.amount;
      }
    }, initialBal);
    
    setCurrentBalance(balance);
  };

  const addExpense = async (expense: Omit<Expense, "id" | "createdAt">) => {
    if (!currentUser) return;

    try {
      const newExpenseData = {
        user_id: currentUser.uid,
        amount: expense.amount,
        category_id: expense.category,
        description: expense.description,
        date: expense.date.toISOString(),
        created_at: new Date().toISOString(),
        type: expense.type
      };

      const docRef = await addDoc(collection(db, "expenses"), newExpenseData);
      
      const newExpense: Expense = {
        id: docRef.id,
        amount: expense.amount,
        category: expense.category,
        description: expense.description || "",
        date: expense.date,
        createdAt: new Date(),
        type: expense.type
      };
      
      const updatedExpenses = [newExpense, ...expenses].sort((a,b) => b.date.getTime() - a.date.getTime());
      setExpenses(updatedExpenses);
      
      calculateCurrentBalance(initialBalance, updatedExpenses);
      toast.success(expense.type === "income" ? "Income added successfully" : "Expense added successfully");
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast.error(`Failed to add ${expense.type === "income" ? "income" : "expense"}`);
    }
  };

  const updateExpense = async (
    expenseId: string,
    expenseData: Partial<Omit<Expense, "id" | "createdAt">>
  ) => {
    if (!currentUser) return;

    try {
      const updateData: any = {};
      if (expenseData.amount !== undefined) updateData.amount = expenseData.amount;
      if (expenseData.description !== undefined) updateData.description = expenseData.description;
      if (expenseData.category !== undefined) updateData.category_id = expenseData.category;
      if (expenseData.date !== undefined) updateData.date = expenseData.date.toISOString();
      if (expenseData.type !== undefined) updateData.type = expenseData.type;

      const expenseRef = doc(db, "expenses", expenseId);
      await updateDoc(expenseRef, updateData);
      
      toast.success("Transaction updated successfully");
      // Fetch fresh list and compute balance from it (avoids stale closure)
      const q = query(
        collection(db, "expenses"),
        where("user_id", "==", currentUser.uid),
        orderBy("date", "desc")
      );
      const fresh = await getDocs(q);
      const freshExpenses: Expense[] = fresh.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          amount: data.amount,
          category: data.category_id,
          description: data.description || "",
          date: new Date(data.date),
          createdAt: data.created_at ? new Date(data.created_at) : new Date(),
          type: (data.type || "expense") as "expense" | "income"
        };
      });
      setExpenses(freshExpenses);
      calculateCurrentBalance(initialBalance, freshExpenses);
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast.error("Failed to update transaction");
    }
  };

  const deleteExpense = async (expenseId: string) => {
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, "expenses", expenseId));
      
      const updatedExpenses = expenses.filter((expense) => expense.id !== expenseId);
      setExpenses(updatedExpenses);
      calculateCurrentBalance(initialBalance, updatedExpenses);
      
      toast.success("Transaction deleted successfully");
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Failed to delete transaction");
    }
  };

  const addCategory = async (category: Omit<Category, "id">): Promise<string> => {
    if (!currentUser) throw new Error("No authenticated user");

    try {
      const docRef = await addDoc(collection(db, "categories"), {
        user_id: currentUser.uid,
        name: category.name,
        color: category.color,
      });
      
      const newCategory: Category = {
        id: docRef.id,
        name: category.name,
        color: category.color
      };
      
      setCategories(prevCategories => [...prevCategories, newCategory]);
      return docRef.id;
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Failed to add category");
      throw error;
    }
  };

  const clearAllData = async () => {
    if (!currentUser) return;

    try {
      const q = query(
        collection(db, "expenses"),
        where("user_id", "==", currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      
      const deletePromises = querySnapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
      await Promise.all(deletePromises);

      // Reset balance in Firestore (onSnapshot listener will update state)
      const settingsQ = query(
        collection(db, "user_settings"),
        where("user_id", "==", currentUser.uid)
      );
      const settingsSnap = await getDocs(settingsQ);
      if (!settingsSnap.empty) {
        await updateDoc(settingsSnap.docs[0].ref, { initial_balance: 0 });
      }

      setExpenses([]);
      calculateCurrentBalance(0, []);
    } catch (error) {
      console.error("Error clearing data:", error);
      toast.error("Failed to clear data");
      throw error;
    }
  };

  const refreshData = async () => {
    setLoading(true);
    // user_settings is kept in sync by onSnapshot; no need to re-fetch it here
    await Promise.all([fetchExpenses(), fetchCategories()]);
    setLoading(false);
  };

  // Setup real-time listeners: expenses collection + user_settings document
  useEffect(() => {
    if (!currentUser) return;

    const handleDataChange = () => {
      console.log("Data change detected, refreshing data...");
      refreshData();
    };
    window.addEventListener('expenses-data-changed', handleDataChange);

    // 1. Real-time listener for expenses
    const expensesQuery = query(
      collection(db, "expenses"),
      where("user_id", "==", currentUser.uid)
    );
    const unsubscribeExpenses = onSnapshot(expensesQuery, () => {
      console.log('Expenses changed in Firestore');
      fetchExpenses();
    });

    // 2. Real-time listener for user_settings (balance sync across devices)
    const settingsQuery = query(
      collection(db, "user_settings"),
      where("user_id", "==", currentUser.uid)
    );
    
    const unsubscribeSettings = onSnapshot(settingsQuery, async (querySnapshot) => {
      // Capacitor offline persistence may immediately return an empty cache.
      // Wait for server data before assuming the user is brand new.
      if (querySnapshot.metadata.fromCache && querySnapshot.empty) {
        console.log('Ignoring empty cache read for user_settings...');
        return;
      }

      if (!querySnapshot.empty) {
        // Get the first matching document
        const data = querySnapshot.docs[0].data();
        console.log('User settings changed in Firestore, new balance:', data.initial_balance);
        setInitialBalance(Number(data.initial_balance));
      } else {
        // Server confirmed no settings doc exists — create settings doc to initialize it
        try {
          console.log('No user_settings found on server. Initializing with 0 balance.');
          await addDoc(collection(db, "user_settings"), {
            user_id: currentUser.uid,
            initial_balance: 0,
          });
          setInitialBalance(0);
        } catch (error) {
          console.error("Failed to initialize user_settings:", error);
        }
      }
    });

    return () => {
      window.removeEventListener('expenses-data-changed', handleDataChange);
      unsubscribeExpenses();
      unsubscribeSettings();
    };
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      // Initial load: fetch expenses & categories.
      // user_settings balance is loaded by the onSnapshot listener above.
      refreshData();
    } else {
      setExpenses([]);
      setCategories([]);
      setInitialBalance(0);
      setCurrentBalance(0);
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    calculateCurrentBalance(initialBalance, expenses);
  }, [initialBalance, expenses]);

  const value = {
    expenses,
    categories,
    initialBalance,
    currentBalance,
    currentUser,
    addExpense,
    updateExpense,
    deleteExpense,
    addCategory,
    updateInitialBalance,
    clearAllData,
    loading,
    refreshData,
  };

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
};

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error("useExpenses must be used within an ExpenseProvider");
  }
  return context;
};
