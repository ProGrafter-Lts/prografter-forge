// Robust JSON extraction/repair for model output that may be wrapped in code
// fences, truncated by a token limit, or contain unescaped control characters
// inside string values.

function stripToJson(raw: string): string {
  let jsonText = raw.trim();
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  }
  const first = jsonText.indexOf("{");
  const last = jsonText.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) return jsonText.slice(first, last + 1);
  if (first !== -1) return jsonText.slice(first);
  return jsonText;
}

function repairTruncatedJson(s: string): string {
  let inStr = false;
  let esc = false;
  const stack: string[] = [];
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{" || c === "[") stack.push(c);
    else if (c === "}" || c === "]") stack.pop();
  }
  let out = s;
  if (inStr) out += '"';
  for (let i = stack.length - 1; i >= 0; i--) {
    out += stack[i] === "{" ? "}" : "]";
  }
  return out;
}

function escapeControlCharsInStrings(s: string): string {
  let out = "";
  let inStr = false;
  let esc = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) { esc = false; out += c; continue; }
      if (c === "\\") { esc = true; out += c; continue; }
      if (c === '"') { inStr = false; out += c; continue; }
      if (c === "\n") { out += "\\n"; continue; }
      if (c === "\r") { out += "\\r"; continue; }
      if (c === "\t") { out += "\\t"; continue; }
      out += c;
      continue;
    }
    if (c === '"') inStr = true;
    out += c;
  }
  return out;
}

/** Parse a model response into an object, applying progressive repairs. Returns
 *  null if every strategy fails. */
export function robustParseJson(raw: string): Record<string, unknown> | null {
  const jsonText = stripToJson(raw);
  const attempts: Array<() => unknown> = [
    () => JSON.parse(jsonText),
    () => JSON.parse(repairTruncatedJson(jsonText)),
    () => JSON.parse(escapeControlCharsInStrings(jsonText)),
    () => JSON.parse(repairTruncatedJson(escapeControlCharsInStrings(jsonText))),
  ];
  for (const attempt of attempts) {
    try {
      const parsed = attempt();
      if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
    } catch {
      // try next strategy
    }
  }
  return null;
}
