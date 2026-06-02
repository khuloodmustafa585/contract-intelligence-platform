import { redirect } from "next/navigation";

// /contracts/[id] is the canonical URL for a single contract.
// The full review UI lives at /contract-review/[contractId], so forward there.
export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/contract-review/${id}`);
}
