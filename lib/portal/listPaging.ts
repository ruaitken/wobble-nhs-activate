export const LIST_PAGE_SIZE = 10;

export function pageWindow(
  total: number,
  page: number,
  pageSize = LIST_PAGE_SIZE
) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(page, 1), pageCount);
  const startIndex = (currentPage - 1) * pageSize;
  return {
    currentPage,
    pageCount,
    start: total === 0 ? 0 : startIndex + 1,
    end: Math.min(startIndex + pageSize, total),
  };
}

export function slicePage<T>(
  items: T[],
  page: number,
  pageSize = LIST_PAGE_SIZE
) {
  const window = pageWindow(items.length, page, pageSize);
  const startIndex = window.start === 0 ? 0 : window.start - 1;
  return {
    ...window,
    items: items.slice(startIndex, window.end),
  };
}

export function matchesSearch(value: string, query: string) {
  const search = query.trim().toLowerCase();
  if (!search) return true;
  return value.toLowerCase().includes(search);
}
