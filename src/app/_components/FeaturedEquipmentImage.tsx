"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  src: string;
  alt: string;
  displayName: string;
};

/**
 * 대표 장비 카드용 이미지. 로드 실패 시 플레이스홀더 표시.
 */
export function FeaturedEquipmentImage({ src, alt, displayName }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
        <div className="text-center text-zinc-400 dark:text-zinc-500">
          <div className="text-4xl mb-2">🔬</div>
          <div className="text-xs">{displayName}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video relative bg-zinc-100 dark:bg-zinc-800">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 33vw"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
