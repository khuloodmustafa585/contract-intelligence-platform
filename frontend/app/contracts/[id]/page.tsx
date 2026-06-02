import { redirect } from "next/navigation";

// Individual contract detail view routes to the Clause Library.
// /contract-review/[contractId]/page.tsx is preserved for future restoration.
export default async function ContractViewPage() {
  redirect("/clause-library");
}
