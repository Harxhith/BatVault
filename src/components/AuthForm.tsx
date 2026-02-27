
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BatLogo } from "./BatLogo";
import { useNavigate } from "react-router-dom";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface AuthFormProps {
  isLogin?: boolean;
}

export const AuthForm: React.FC<AuthFormProps> = ({ isLogin = true }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (forgotPassword) {
        await resetPassword(email);
        setResetSuccess(true);
        toast.success("Password reset email sent!", {
          description: "Check your email for further instructions."
        });
      } else if (isLogin) {
        await signIn(email, password);
        navigate("/dashboard");
      } else {
        await signUp(email, password);
        navigate("/dashboard");
      }
    } catch (error: any) {
      // Handle specific error types
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Invalid Credentials", {
          description: "The email or password you entered is incorrect."
        });
      } else if (error.message.includes("Password should be at least 6 characters")) {
        toast.error("Password Too Short", {
          description: "Password must be at least 6 characters long."
        });
      } else if (error.message.includes("User already exists")) {
        toast.error("Registration Error", {
          description: "An account with this email already exists."
        });
      } else {
        // Catch-all for other errors
        toast.error("Authentication Error", {
          description: error.message || "An unexpected error occurred. Please try again."
        });
      }
      console.error("Authentication error:", error);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (forgotPassword) {
    return (
      <div className="flex flex-col items-center justify-center p-6 space-y-8 max-w-md w-full mx-auto">
        <div className="flex flex-col items-center space-y-2">
          <BatLogo className="w-24 h-24 animate-glow" />
          <h1 className="text-3xl font-bold bat-highlight">BatVault</h1>
          <p className="text-batman-foreground/80 text-center mt-2">
            {resetSuccess ? "Password reset email sent!" : "Reset your password"}
          </p>
        </div>

        {resetSuccess ? (
          <div className="w-full space-y-6">
            <p className="text-center text-batman-foreground/80">
              Check your email for a password reset link.
            </p>
            <Button 
              type="button" 
              onClick={() => {
                setForgotPassword(false);
                setResetSuccess(false);
              }}
              className="w-full bg-batman-accent text-batman hover:bg-batman-accent/90 transition-colors"
            >
              Back to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="text-sm font-medium text-batman-foreground/80 block mb-1">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  className="bg-batman border-batman-secondary/40 focus:border-batman-accent focus:ring-batman-accent/40"
                />
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
                  Sending Reset Email...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>

            <div className="text-center mt-4">
              <Button 
                variant="link" 
                type="button"
                onClick={() => setForgotPassword(false)}
                className="text-batman-foreground/80 hover:text-batman-accent"
              >
                Back to Login
              </Button>
            </div>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-8 max-w-md w-full mx-auto">
      <div className="flex flex-col items-center space-y-2">
        <BatLogo className="w-24 h-24 animate-glow" />
        <h1 className="text-3xl font-bold bat-highlight">BatVault</h1>
        <p className="text-batman-foreground/80 text-center mt-2">
          {isLogin
            ? "Sign in to access your financial dashboard"
            : "Create an account to start tracking your expenses"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-batman-foreground/80 block mb-1">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              className="bg-batman border-batman-secondary/40 focus:border-batman-accent focus:ring-batman-accent/40"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-batman-foreground/80 block mb-1">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="bg-batman border-batman-secondary/40 focus:border-batman-accent focus:ring-batman-accent/40 pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-batman-foreground/60 hover:text-batman-foreground"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
        </div>

        {isLogin && (
          <div className="flex justify-end">
            <Button 
              variant="link" 
              type="button"
              onClick={() => setForgotPassword(true)}
              className="text-sm text-batman-foreground/80 hover:text-batman-accent"
            >
              Forgot password?
            </Button>
          </div>
        )}

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full bg-batman-accent text-batman hover:bg-batman-accent/90 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isLogin ? "Signing In..." : "Creating Account..."}
            </>
          ) : (
            isLogin ? "Sign In" : "Create Account"
          )}
        </Button>

        <div className="text-center mt-4">
          {isLogin ? (
            <p className="text-batman-foreground/80">
              Don't have an account?{" "}
              <Link to="/register" className="text-batman-accent hover:underline">
                Sign up
              </Link>
            </p>
          ) : (
            <p className="text-batman-foreground/80">
              Already have an account?{" "}
              <Link to="/login" className="text-batman-accent hover:underline">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default AuthForm;
