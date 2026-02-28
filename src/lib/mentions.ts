export function extractMentionUsernames(text: string, limit = 5) {
  const re = /@([a-zA-Z0-9_]{3,32})/g;
  const found: string[] = [];
  const seen = new Set<string>();

  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const username = m[1];
    if (seen.has(username)) continue;
    seen.add(username);
    found.push(username);
    if (found.length >= limit) break;
  }

  return found;
}

