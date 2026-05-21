import { RouterProvider } from "react-router";
import { router } from "./routes";
import { GiftProvider } from "./context/GiftContext";

export default function App() {
  return (
    <GiftProvider>
      <RouterProvider router={router} />
    </GiftProvider>
  );
}
