import { Outlet, useLocation, useNavigate, type Location } from "react-router-dom";
import { Sheet, SheetContent } from "@/components/ui/sheet";

/**
 * Renders the matched detail route inside a right-hand slide-over Sheet that sits
 * ON TOP of the underlying dashboard list (kept mounted via the background-location
 * pattern). Closing the drawer returns to the preserved background route — and its
 * scroll position — rather than re-mounting the list.
 */
const DrawerHost = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const backgroundLocation = (
    location.state as { backgroundLocation?: Location } | null
  )?.backgroundLocation;

  const handleOpenChange = (open: boolean) => {
    if (open) return;
    if (backgroundLocation) {
      navigate(backgroundLocation);
    } else {
      navigate(-1);
    }
  };

  return (
    <Sheet open onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-full p-0 sm:max-w-2xl lg:max-w-4xl overflow-y-auto"
      >
        <Outlet />
      </SheetContent>
    </Sheet>
  );
};

export default DrawerHost;
