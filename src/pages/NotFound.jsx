import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center animate-fade-in">
        <div className="mb-8">
          <h1 className="text-8xl font-heading font-bold text-gradient">404</h1>
        </div>
        <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
          Page Not Found
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/dashboard">
            <button className="gradient-primary flex items-center px-6 py-3 rounded-lg text-primary-foreground font-semibold text-base">
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </button>
          </Link>
          <button onClick={() => window.history.back()} className="border px-6 py-3 rounded-lg text-base font-semibold flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
