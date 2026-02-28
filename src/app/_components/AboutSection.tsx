"use client";

import { useState } from "react";

export function AboutSection() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 transition-colors dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {isOpen ? "About 닫기" : "About"}
      </button>

      {isOpen && (
        <div className="mt-6 max-w-3xl mx-auto text-left space-y-4 text-sm leading-7 text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-6 shadow-sm home-animate-fade-in-up-fast">
          <p>
            심화 기자재는 단순한 이론 학습만으로는 익히기 어렵고, 실제 사용 경험을 통해 비로소 제대로 이해할 수 있습니다. 그러나 하나의 연구에 오랜 시간 집중하는 환경에서는 다양한 기기를 접할 기회가 제한되고, 같은 공간에 있으면서도 동기·선후배 간의 노하우가 충분히 공유되지 못하는 경우가 많습니다. 그 결과, 기자재를 올바르게 사용하지 못해 장비가 손상되거나, 안전사고로 이어질 위험도 존재합니다.
          </p>
          <p>
            이 웹사이트는 이러한 문제의식에서 출발했습니다.
            심화 기자재의 사용법과 실험 노하우를 체계적으로 기록하고 공유함으로써, 누구나 보다 안전하고 효율적으로 장비를 다룰 수 있도록 돕고자 합니다. 또한 단순한 매뉴얼 아카이브를 넘어, 경험과 질문, 팁을 자유롭게 나눌 수 있는 커뮤니티를 통해 학생들 사이의 지식과 경험이 자연스럽게 이어지는 환경을 만들고자 합니다.
          </p>
          <p>
            이곳이 실험실의 경험을 확장하고, 서로의 시행착오를 줄이며, 더 나은 연구로 나아가는 출발점이 되기를 바랍니다.
          </p>
        </div>
      )}
    </div>
  );
}
