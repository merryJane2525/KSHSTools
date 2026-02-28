/**
 * 간단한 마크다운을 HTML로 변환하는 유틸리티 함수
 * 기본적인 마크다운 문법만 지원합니다.
 * 서버 사이드에서도 사용 가능합니다.
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function markdownToHtml(markdown: string): string {
  let html = markdown;

  // 코드 블록 처리 (```code```)
  html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
    return `<pre><code>${escapeHtml(code.trim())}</code></pre>`;
  });

  // 인라인 코드 처리 (`code`)
  html = html.replace(/`([^`]+)`/g, (match, code) => {
    return `<code>${escapeHtml(code)}</code>`;
  });

  // 이미지 처리 (![alt](url))
  // img: 형식의 참조는 건너뛰고 나중에 치환
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
    // img: 형식의 참조는 그대로 유지 (나중에 processManualContent에서 치환)
    if (url.startsWith("img:")) {
      return match;
    }
    return `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" class="max-w-full h-auto rounded-lg" />`;
  });

  // 링크 처리 ([text](url))
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${escapeHtml(text)}</a>`;
  });

  // 볼드 처리 (**text** 또는 __text__)
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__([^_]+)__/g, "<strong>$1</strong>");

  // 이탤릭 처리 (*text* 또는 _text_)
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/_([^_]+)_/g, "<em>$1</em>");

  // 헤딩 처리 (# ## ###)
  html = html.replace(/^### (.*$)/gm, "<h3 class='text-lg font-semibold mt-4 mb-2'>$1</h3>");
  html = html.replace(/^## (.*$)/gm, "<h2 class='text-xl font-semibold mt-6 mb-3'>$1</h2>");
  html = html.replace(/^# (.*$)/gm, "<h1 class='text-2xl font-semibold mt-8 mb-4'>$1</h1>");

  // 리스트 처리 (간단한 버전)
  // 번호 리스트
  html = html.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");
  // 불릿 리스트
  html = html.replace(/^[\*\-\+] (.+)$/gm, "<li>$1</li>");

  // 줄바꿈 처리
  const lines = html.split("\n");
  const result: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isListItem = line.trim().startsWith("<li>");

    if (isListItem) {
      if (!inList) {
        result.push("<ul>");
        inList = true;
      }
      result.push(line);
    } else {
      if (inList) {
        result.push("</ul>");
        inList = false;
      }
      if (line.trim() && !line.trim().startsWith("<")) {
        result.push(`<p>${line.trim()}</p>`);
      } else if (line.trim()) {
        result.push(line);
      }
    }
  }

  if (inList) {
    result.push("</ul>");
  }

  html = result.join("\n");

  return html;
}

/**
 * 마크다운과 HTML이 혼합된 텍스트를 처리합니다.
 * 이미 HTML 태그가 있으면 그대로 두고, 마크다운만 변환합니다.
 * 이미지 참조(img:0 형식)를 실제 이미지 데이터로 치환합니다.
 */
export function processManualContent(content: string, manualImages: unknown = null): string {
  // 이미지 배열 파싱
  let imagesArray: string[] = [];
  if (manualImages != null) {
    try {
      if (Array.isArray(manualImages)) {
        imagesArray = manualImages.filter((img): img is string => typeof img === "string" && img.length > 0);
      } else if (typeof manualImages === "string") {
        // 문자열로 저장된 경우 JSON 파싱 시도
        const parsed = JSON.parse(manualImages);
        if (Array.isArray(parsed)) {
          imagesArray = parsed.filter((img): img is string => typeof img === "string" && img.length > 0);
        }
      }
    } catch {
      // 파싱 실패 시 무시
    }
  }

  // 이미지 참조 치환 함수
  const replaceImageRefs = (text: string): string => {
    // 마크다운 형식: ![alt](img:0)
    text = text.replace(/!\[([^\]]*)\]\(img:(\d+)\)/g, (match, alt, indexStr) => {
      const index = parseInt(indexStr, 10);
      if (index >= 0 && index < imagesArray.length && imagesArray[index]) {
        return `<img src="${escapeHtml(imagesArray[index])}" alt="${escapeHtml(alt)}" class="max-w-full h-auto rounded-lg" />`;
      }
      // 이미지가 없으면 빈 이미지 또는 원본 유지
      return `<span class="text-red-500 text-xs">[이미지 ${index}를 찾을 수 없습니다]</span>`;
    });

    // HTML 형식: <img src="img:0" alt="alt" /> 또는 <img src='img:0' alt='alt' />
    text = text.replace(/<img\s+src=["']img:(\d+)["']\s+alt=["']([^"']*)["']\s*\/?>/gi, (match, indexStr, alt) => {
      const index = parseInt(indexStr, 10);
      if (index >= 0 && index < imagesArray.length && imagesArray[index]) {
        return `<img src="${escapeHtml(imagesArray[index])}" alt="${escapeHtml(alt)}" class="max-w-full h-auto rounded-lg" />`;
      }
      // 이미지가 없으면 빈 이미지 또는 원본 유지
      return `<span class="text-red-500 text-xs">[이미지 ${index}를 찾을 수 없습니다]</span>`;
    });

    // HTML 형식 (따옴표 없이): <img src=img:0 alt=alt />
    text = text.replace(/<img\s+src=img:(\d+)\s+alt=([^\s>]+)\s*\/?>/gi, (match, indexStr, alt) => {
      const index = parseInt(indexStr, 10);
      if (index >= 0 && index < imagesArray.length && imagesArray[index]) {
        return `<img src="${escapeHtml(imagesArray[index])}" alt="${escapeHtml(alt)}" class="max-w-full h-auto rounded-lg" />`;
      }
      return `<span class="text-red-500 text-xs">[이미지 ${index}를 찾을 수 없습니다]</span>`;
    });

    // HTML 형식 (속성 순서 다름): <img alt="alt" src="img:0" />
    text = text.replace(/<img\s+alt=["']([^"']*)["']\s+src=["']img:(\d+)["']\s*\/?>/gi, (match, alt, indexStr) => {
      const index = parseInt(indexStr, 10);
      if (index >= 0 && index < imagesArray.length && imagesArray[index]) {
        return `<img src="${escapeHtml(imagesArray[index])}" alt="${escapeHtml(alt)}" class="max-w-full h-auto rounded-lg" />`;
      }
      return `<span class="text-red-500 text-xs">[이미지 ${index}를 찾을 수 없습니다]</span>`;
    });

    return text;
  };

  // 이미지 참조를 먼저 치환 (마크다운 변환 전에 처리)
  // 이렇게 하면 마크다운 변환 과정에서 img: 참조가 일반 URL로 변환되는 것을 방지
  let processed = replaceImageRefs(content);

  // HTML 태그가 있는지 확인
  const hasHtmlTags = /<[^>]+>/.test(processed);

  if (hasHtmlTags) {
    // HTML이 이미 포함되어 있으면 마크다운만 변환
    // 마크다운 이미지 문법을 HTML로 변환 (img: 참조는 이미 치환됨)
    processed = processed.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
      // img: 형식이 아닌 경우에만 직접 URL 사용
      if (url.startsWith("img:")) {
        return match; // 이미 치환되었어야 함
      }
      return `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" class="max-w-full h-auto rounded-lg" />`;
    });
    // 나머지 마크다운 문법도 변환
    processed = markdownToHtml(processed);
    return processed;
  } else {
    // 순수 마크다운만 있으면 전체 변환
    processed = markdownToHtml(processed);
    return processed;
  }
}
