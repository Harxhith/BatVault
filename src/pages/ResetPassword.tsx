
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BatLogo } from "@/components/BatLogo";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { auth } from "@/integrations/firebase/client";
import { updatePassword } from "firebase/auth";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage({
        text: "Passwords do not match",
        type: "error"
      });
      return;
    }

    setLoading(true);
    try {
      if (!auth.currentUser) throw new Error("No user is currently signed in.");
      await updatePassword(auth.currentUser, password);
      
      setMessage({
        text: "Password updated successfully!",
        type: "success"
      });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      
    } catch (error: any) {
      console.error("Error updating password:", error);
      setMessage({
        text: error.message || "Failed to update password",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-batman bat-grad-bg">
      <div className="flex flex-col items-center justify-center p-6 space-y-8 max-w-md w-full mx-auto">
        <div className="flex flex-col items-center space-y-2">
          <BatLogo className="w-24 h-24 animate-glow" />
          <h1 className="text-3xl font-bold bat-highlight">BatVault</h1>
          <p className="text-batman-foreground/80 text-center mt-2">
            Set your new password
          </p>
        </div>

        {message && (
          <div className={`w-full p-3 rounded-md text-center ${
            message.type === 'success' 
              ? 'bg-green-900/30 text-green-400 border border-green-800' 
              : 'bg-red-900/30 text-red-400 border border-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="text-sm font-medium text-batman-foreground/80 block mb-1">
                New Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your new password"
                  className="bg-batman border-batman-secondary/40 focus:border-batman-accent focus:ring-batman-accent/40 pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-batman-foreground/60 hover:text-batman-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="text-sm font-medium text-batman-foreground/80 block mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm your new password"
                  className="bg-batman border-batman-secondary/40 focus:border-batman-accent focus:ring-batman-accent/40 pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-batman-foreground/60 hover:text-batman-foreground"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-batman-accent text-batman hover:bg-batman-accent/90 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating Password...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
