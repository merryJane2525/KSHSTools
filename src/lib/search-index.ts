"use server";

import { prisma } from "@/lib/db";
import { stripHtml } from "./search";

/** 검색에 넣을 본문 최대 길이 (장비 설명·메뉴얼·Q&A 본문) */
const MANUAL_CONTENT_MAX = 10_000;

/** Equipment → SearchDocument (equipment + manual) */
export async function syncEquipmentSearchDocuments() {
  const equipments = await prisma.equipment.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true, description: true, manual: true, updatedAt: true },
  });
  const now = new Date();

  for (const eq of equipments) {
    const title = eq.name;
    const desc = (eq.description ?? "").trim();
    const manualPlain = stripHtml(eq.manual ?? "");
    const content = [desc, manualPlain].filter(Boolean).join(" ").slice(0, MANUAL_CONTENT_MAX) || title;
    const url = `/equipments/${eq.slug}`;

    await prisma.searchDocument.upsert({
      where: {
        type_sourceId: { type: "equipment", sourceId: eq.id },
      },
      create: {
        type: "equipment",
        sourceId: eq.id,
        equipmentId: eq.id,
        title,
        content,
        url,
        updatedAt: eq.updatedAt ?? now,
      },
      update: {
        title,
        content,
        url,
        updatedAt: eq.updatedAt ?? now,
      },
    });

    if (eq.manual && eq.manual.trim()) {
      const manualContent = manualPlain.slice(0, MANUAL_CONTENT_MAX);
      await prisma.searchDocument.upsert({
        where: {
          type_sourceId: { type: "manual", sourceId: eq.id },
        },
        create: {
          type: "manual",
          sourceId: eq.id,
          equipmentId: eq.id,
          title: `${eq.name} 사용 메뉴얼`,
          content: manualContent,
          url: `/equipments/${eq.slug}/manual`,
          updatedAt: eq.updatedAt ?? now,
        },
        update: {
          title: `${eq.name} 사용 메뉴얼`,
          content: manualContent,
          updatedAt: eq.updatedAt ?? now,
        },
      });
    } else {
      await prisma.searchDocument.deleteMany({ where: { type: "manual", sourceId: eq.id } }).catch(() => {});
    }
  }
}

/** Post (Q&A) → SearchDocument */
export async function syncPostSearchDocuments() {
  const posts = await prisma.post.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      title: true,
      body: true,
      equipmentId: true,
      updatedAt: true,
      equipment: { select: { slug: true, name: true } },
    },
  });
  const now = new Date();

  for (const post of posts) {
    const bodyPlain = stripHtml(post.body ?? "");
    const content = bodyPlain.slice(0, MANUAL_CONTENT_MAX) || post.title;
    const url = `/posts/${post.id}`;

    await prisma.searchDocument.upsert({
      where: {
        type_sourceId: { type: "qa", sourceId: post.id },
      },
      create: {
        type: "qa",
        sourceId: post.id,
        equipmentId: post.equipmentId,
        title: post.title,
        content,
        url,
        updatedAt: post.updatedAt ?? now,
      },
      update: {
        title: post.title,
        content,
        url,
        updatedAt: post.updatedAt ?? now,
      },
    });
  }
}

/** 특정 장비 1건만 검색 인덱스 반영 (메뉴얼 저장 후 호출) */
export async function syncEquipmentSearchDocumentById(equipmentId: string) {
  const eq = await prisma.equipment.findFirst({
    where: { id: equipmentId, isActive: true },
    select: { id: true, name: true, slug: true, description: true, manual: true, updatedAt: true },
  });
  if (!eq) return;
  const now = new Date();
  const desc = (eq.description ?? "").trim();
  const manualPlain = stripHtml(eq.manual ?? "");
  const content = [desc, manualPlain].filter(Boolean).join(" ").slice(0, MANUAL_CONTENT_MAX) || eq.name;
  const url = `/equipments/${eq.slug}`;
  await prisma.searchDocument.upsert({
    where: { type_sourceId: { type: "equipment", sourceId: eq.id } },
    create: { type: "equipment", sourceId: eq.id, equipmentId: eq.id, title: eq.name, content, url, updatedAt: eq.updatedAt ?? now },
    update: { title: eq.name, content, url, updatedAt: eq.updatedAt ?? now },
  });
  if (eq.manual?.trim()) {
    const manualContent = manualPlain.slice(0, MANUAL_CONTENT_MAX);
    await prisma.searchDocument.upsert({
      where: { type_sourceId: { type: "manual", sourceId: eq.id } },
      create: { type: "manual", sourceId: eq.id, equipmentId: eq.id, title: `${eq.name} 사용 메뉴얼`, content: manualContent, url: `/equipments/${eq.slug}/manual`, updatedAt: eq.updatedAt ?? now },
      update: { title: `${eq.name} 사용 메뉴얼`, content: manualContent, updatedAt: eq.updatedAt ?? now },
    });
  } else {
    await prisma.searchDocument.deleteMany({ where: { type: "manual", sourceId: eq.id } }).catch(() => {});
  }
}

/** 특정 Q&A(Post) 1건만 검색 인덱스 반영 */
export async function syncPostSearchDocumentById(postId: string) {
  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
    select: { id: true, title: true, body: true, equipmentId: true, updatedAt: true },
  });
  if (!post) {
    await prisma.searchDocument.deleteMany({ where: { type: "qa", sourceId: postId } }).catch(() => {});
    return;
  }
  const now = new Date();
  const bodyPlain = stripHtml(post.body ?? "");
  const content = bodyPlain.slice(0, MANUAL_CONTENT_MAX) || post.title;
  const url = `/posts/${post.id}`;
  await prisma.searchDocument.upsert({
    where: { type_sourceId: { type: "qa", sourceId: post.id } },
    create: { type: "qa", sourceId: post.id, equipmentId: post.equipmentId, title: post.title, content, url, updatedAt: post.updatedAt ?? now },
    update: { title: post.title, content, url, updatedAt: post.updatedAt ?? now },
  });
}

/** 전체 검색 인덱스 동기화 */
export async function syncAllSearchDocuments() {
  await syncEquipmentSearchDocuments();
  await syncPostSearchDocuments();
}
