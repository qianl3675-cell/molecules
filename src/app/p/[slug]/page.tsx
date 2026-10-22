// 公开分享页：只读全屏预览 + Remix（服务端组装，避免向客户端暴露源文件以外的数据）
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { store } from "@/lib/store";
import { assembleDocument } from "@/lib/agent/assemble";
import { ShareView } from "@/components/ShareView";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await store.getProjectBySlug(slug);
  return { title: p ? `${p.title} · Molecules` : "Molecules" };
}

export default async function SharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await store.getProjectBySlug(slug);
  if (!project || !project.isPublic) notFound();
  const html = assembleDocument(project.files);
  return <ShareView title={project.title} projectId={project.id} html={html} />;
}
