import { type ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface AppShellProps {
  /** Page content. Rendered as-is inside whichever layout matches the session. */
  children: ReactNode;
  authenticatedContent?: ReactNode;
}

/**
 * Public and informational routes always retain public navigation. Signed-in
 * visitors receive their dashboard return action from PublicHeader.
 */
const AppShell = ({ children }: AppShellProps) => {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
};

export default AppShell;
