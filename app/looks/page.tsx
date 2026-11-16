import { redirect } from "next/navigation";

/** "Looks" opens on the Maharani collection; wedding looks live at /looks/wedding. */
export default function LooksIndex() {
  redirect("/looks/maharani");
}
