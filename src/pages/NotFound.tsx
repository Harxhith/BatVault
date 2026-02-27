
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BatLogo } from "@/components/BatLogo";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-batman bat-grad-bg">
      <div className="text-center max-w-md px-6">
        <BatLogo className="w-24 h-24 mx-auto text-batman-accent animate-glow" />
        <h1 className="text-5xl font-bold text-batman-accent mt-6">404</h1>
        <p className="text-xl text-batman-foreground/80 mt-4 mb-8">
          Even Batman couldn't find this page
        </p>
        <Button 
          onClick={() => navigate("/")}
          className="bg-batman-accent text-batman hover:bg-batman-accent/90"
        >
          Return to Batcave
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
