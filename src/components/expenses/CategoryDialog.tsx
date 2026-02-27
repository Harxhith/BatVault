
import React, { useState } from "react";
import { useExpenses } from "@/context/ExpenseContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { HexColorPicker } from "react-colorful";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryAdded: (categoryId: string) => void;
}

export const CategoryDialog: React.FC<CategoryDialogProps> = ({ 
  open, 
  onOpenChange,
  onCategoryAdded 
}) => {
  const { addCategory } = useExpenses();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#5BC0EB");
  
  const handleAddCategory = async () => {
    if (newCategoryName.trim()) {
      try {
        const newCategoryId = await addCategory({
          name: newCategoryName.trim(),
          color: newCategoryColor,
        });
        
        onCategoryAdded(newCategoryId);
        setNewCategoryName("");
        setNewCategoryColor("#5BC0EB");
        onOpenChange(false);
        toast.success("Category added successfully");
      } catch (error) {
        console.error("Error adding category:", error);
        toast.error("Failed to add category");
      }
    } else {
      toast.error("Please enter a category name");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="batcard">
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Category Name</label>
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g., Groceries"
              className="bg-batman border-batman-secondary/40"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Category Color</label>
            <HexColorPicker color={newCategoryColor} onChange={setNewCategoryColor} />
            <div className="flex items-center mt-2 gap-2">
              <div 
                className="w-6 h-6 rounded-full" 
                style={{ backgroundColor: newCategoryColor }} 
              />
              <Input
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
                className="bg-batman border-batman-secondary/40"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="border-batman-secondary/40 hover:bg-batman-secondary/20"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddCategory}
            className="bg-batman-accent text-batman hover:bg-batman-accent/90"
          >
            Add Category
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
