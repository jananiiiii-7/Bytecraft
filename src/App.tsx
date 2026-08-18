import { AuthProvider } from "@/contexts/AuthContext";
import { V1App } from "@/components/v1/V1App";
import { Toaster } from "@/components/ui/toaster";

export default function App() {
  return <AuthProvider><V1App /><Toaster /></AuthProvider>;
}
