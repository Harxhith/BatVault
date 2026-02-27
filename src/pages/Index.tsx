
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BatLogo } from "@/components/BatLogo";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-batman bat-grad-bg">
      <div className="max-w-3xl w-full px-6 py-12 text-center">
        <div className="flex flex-col items-center mb-8 animate-fade-in">
          <BatLogo className="w-32 h-32 text-batman-accent animate-glow" />
          <h1 className="text-5xl font-bold mt-6 bat-highlight">BatVault</h1>
          <p className="mt-4 text-xl text-batman-foreground/80">
            The expense tracker Gotham deserves
          </p>
        </div>

        <div className="space-y-8 max-w-xl mx-auto animate-fade-in">
          <p className="text-batman-foreground">
            Track your finances with precision and power using this Batman-inspired expense
            tracker. Stay in control of your budget like the Dark Knight controls Gotham.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-batman-muted/60 rounded-lg p-4 backdrop-blur-sm border border-batman-secondary/20">
              <h3 className="text-batman-accent font-bold mb-2">Track Expenses</h3>
              <p className="text-sm text-batman-foreground/70">
                Log and categorize all your spending with ease
              </p>
            </div>
            <div className="bg-batman-muted/60 rounded-lg p-4 backdrop-blur-sm border border-batman-secondary/20">
              <h3 className="text-batman-accent font-bold mb-2">Analyze Spending</h3>
              <p className="text-sm text-batman-foreground/70">
                Visualize where your money goes with detailed charts
              </p>
            </div>
            <div className="bg-batman-muted/60 rounded-lg p-4 backdrop-blur-sm border border-batman-secondary/20">
              <h3 className="text-batman-accent font-bold mb-2">Budget Control</h3>
              <p className="text-sm text-batman-foreground/70">
                Set budget limits and get alerts when overspending
              </p>
            </div>
          </div>

          <div className="pt-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                className="bg-batman-accent text-batman hover:bg-batman-accent/90"
                size="lg"
                onClick={() => navigate("/login")}
              >
                Sign In
              </Button>
              <Button
                variant="outline"
                className="border-batman-accent text-batman-accent hover:bg-batman-accent/10"
                size="lg"
                onClick={() => navigate("/register")}
              >
                Create Account
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
