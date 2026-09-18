export function slugOrgId(name: string) {
  const slug = name
    .trim()
    .toUpperCase()
    .replace(/['’]/g, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return slug || "ORG";
}

export function nextUniqueId(base: string, existing: Iterable<string>) {
  const taken = new Set(existing);
  if (!taken.has(base)) return base;
  for (let index = 2; index < 1000; index += 1) {
    const candidate = `${base}_${index}`;
    if (!taken.has(candidate)) return candidate;
  }
  throw new Error("id_exhausted");
}
