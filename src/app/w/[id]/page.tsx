import { Workspace } from "@/components/workspace/Workspace";

export default async function WorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const prefill = typeof sp.prefill === "string" ? sp.prefill.slice(0, 2000) : "";
  return <Workspace id={id} prefill={prefill} />;
}
