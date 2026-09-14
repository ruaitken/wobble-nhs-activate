"use client";

import { LIST_PAGE_SIZE, pageWindow } from "@/lib/portal/listPaging";

export default function ListPager({
  total,
  page,
  noun,
  onPageChange,
}: {
  total: number;
  page: number;
  noun: string;
  onPageChange: (page: number) => void;
}) {
  const { currentPage, pageCount, start, end } = pageWindow(total, page);
  if (total === 0) return null;

  return (
    <div className="flex flex-col gap-3 border-t border-black/10 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs text-[#25303B]/60">
        Showing {start}–{end} of {total} {noun}
        {total > LIST_PAGE_SIZE ? ` · ${LIST_PAGE_SIZE} per page` : ""}
      </span>
      {pageCount > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="rounded-lg bg-white px-3 py-2 text-xs font-extrabold ring-1 ring-black/10 transition hover:bg-[#A6D5CE]/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          {pageCount <= 8 ? (
            Array.from({ length: pageCount }, (_, index) => index + 1).map(
              (pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => onPageChange(pageNumber)}
                  className={[
                    "min-w-8 rounded-lg px-2.5 py-2 text-xs font-extrabold ring-1 transition",
                    pageNumber === currentPage
                      ? "bg-[#25303B] text-white ring-[#25303B]"
                      : "bg-white text-[#25303B] ring-black/10 hover:bg-[#A6D5CE]/20",
                  ].join(" ")}
                >
                  {pageNumber}
                </button>
              )
            )
          ) : (
            <span className="px-2 text-xs font-bold text-[#25303B]/65">
              Page {currentPage} of {pageCount}
            </span>
          )}
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === pageCount}
            className="rounded-lg bg-white px-3 py-2 text-xs font-extrabold ring-1 ring-black/10 transition hover:bg-[#A6D5CE]/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
