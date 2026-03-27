/**
 * Main App component.
 * Sets up React Router for navigation throughout the application.
 */

import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "@/routes/AppRoutes";
import { ToastProvider } from "@/components/shared";
import { TooltipProvider } from "@/components/ui/tooltip";

function App() {
  return (
    <Router>
      <TooltipProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </TooltipProvider>
    </Router>
  );
}

export default App;
