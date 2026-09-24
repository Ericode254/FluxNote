import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Doc } from "../convex/_generated/dataModel";
import { toast } from "sonner";

interface SidebarProps {
  documents: {
    owned: Doc<"documents">[];
    shared: (Doc<"documents"> & { role: "read" | "write" })[];
  };
  selectedDocId: Id<"documents"> | null;
  onSelectDoc: (id: Id<"documents">) => void;
  onCreateDoc: () => void;
}

function formatRelativeTime(ms: number | undefined): string {
  if (!ms) return "";
  const diff = Date.now() - ms;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "Just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function Sidebar({ documents, selectedDocId, onSelectDoc, onCreateDoc }: SidebarProps) {
  const removeDoc = useMutation(api.documents.remove);
  const [deletingId, setDeletingId] = useState<Id<"documents"> | null>(null);
  const [search, setSearch] = useState("");

  const handleDelete = async (e: React.MouseEvent, id: Id<"documents">) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await removeDoc({ id });
      toast.success("Document deleted");
    } catch {
      toast.error("Failed to delete document");
    } finally {
      setDeletingId(null);
    }
  };

  const query = search.trim().toLowerCase();
  const filteredOwned = useMemo(
    () => (query ? documents.owned.filter((d) => d.title.toLowerCase().includes(query)) : documents.owned),
    [documents.owned, query]
  );
  const filteredShared = useMemo(
    () => (query ? documents.shared.filter((d) => d.title.toLowerCase().includes(query)) : documents.shared),
    [documents.shared, query]
  );

  const hasAnyDocs = documents.owned.length > 0 || documents.shared.length > 0;

  return (
    <div className="h-full flex flex-col bg-[#F6F1E7] dark:bg-[#1A160F]">
      <div className="p-3 border-b border-[#EAE0C8] dark:border-[#3A3323] space-y-2">
        <button
          onClick={onCreateDoc}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#5C6E4E] hover:bg-[#4A5A3D] text-white rounded-lg text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Document
        </button>
        {hasAnyDocs && (
          <div className="relative">
            <svg className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B6455]/50 dark:text-[#93876A]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents…"
              className="font-mono w-full pl-8 pr-3 py-1.5 rounded-lg text-sm bg-[#F6F1E7] dark:bg-[#1A160F] border border-transparent focus:border-[#5C6E4E] outline-none transition-colors text-[#201C16] dark:text-[#EDE6D3] placeholder:text-[#6B6455]/50 dark:placeholder:text-[#93876A]/50"
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-6">
        {/* Owned Documents */}
        <div>
          <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#6B6455] dark:text-[#93876A] mb-2">
            My Documents
          </h3>
          {documents.owned.length === 0 ? (
            <EmptyDocs
              message="Nothing here yet"
              hint="Create your first document to start writing."
              actionLabel="Create a document"
              onAction={onCreateDoc}
            />
          ) : filteredOwned.length === 0 ? (
            <p className="px-3 text-xs text-[#6B6455] dark:text-[#93876A]">No documents match “{search}”</p>
          ) : (
            <ul className="space-y-0.5">
              {filteredOwned.map((doc) => (
                <DocumentItem
                  key={doc._id}
                  doc={doc}
                  isSelected={selectedDocId === doc._id}
                  onSelect={() => onSelectDoc(doc._id)}
                  onDelete={(e) => handleDelete(e, doc._id)}
                  deletingId={deletingId}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Shared Documents */}
        <div>
          <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#6B6455] dark:text-[#93876A] mb-2">
            Shared with Me
          </h3>
          {documents.shared.length === 0 ? (
            <EmptyDocs
              message="Nothing shared yet"
              hint="Documents others invite you to will show up here."
            />
          ) : filteredShared.length === 0 ? (
            <p className="px-3 text-xs text-[#6B6455] dark:text-[#93876A]">No documents match “{search}”</p>
          ) : (
            <ul className="space-y-0.5">
              {filteredShared.map((doc) => (
                <DocumentItem
                  key={doc._id}
                  doc={doc}
                  isSelected={selectedDocId === doc._id}
                  onSelect={() => onSelectDoc(doc._id)}
                  role={doc.role}
                />
              ))}
            </ul>
          )}
        </div>

      </div>

    </div>
  );
}

function EmptyDocs({
  message,
  hint,
  actionLabel,
  onAction,
}: {
  message: string;
  hint: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="px-3 py-4 text-center">
      <p className="text-sm font-medium text-[#201C16] dark:text-[#EDE6D3] mb-1">{message}</p>
      <p className="text-xs text-[#6B6455] dark:text-[#93876A] mb-3">{hint}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#5C6E4E]/10 hover:bg-[#5C6E4E]/20 text-[#5C6E4E] transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function DocumentItem({
  doc,
  isSelected,
  onSelect,
  onDelete,
  deletingId,
  role,
}: {
  doc: any;
  isSelected: boolean;
  onSelect: () => void;
  onDelete?: (e: React.MouseEvent) => void;
  deletingId?: Id<"documents"> | null;
  role?: "read" | "write";
}) {
  const relativeTime = formatRelativeTime(doc.updatedAt ?? doc._creationTime);
  return (
    <li>
      <div
        onClick={onSelect}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onSelect();
          }
        }}
        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors group cursor-pointer ${
          isSelected
            ? "bg-[#5C6E4E]/10 dark:bg-[#5C6E4E]/20 text-[#5C6E4E]"
            : "hover:bg-[#F6F1E7] dark:hover:bg-[#3A3323] text-[#201C16] dark:text-[#EDE6D3]"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <svg className="w-4 h-4 flex-shrink-0 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="truncate font-medium">{doc.title}</span>
            {role === "read" && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 uppercase font-bold flex-shrink-0">
                Read
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {relativeTime && (
              <span className={`font-mono text-[11px] whitespace-nowrap ${isSelected ? "text-[#5C6E4E]/70" : "text-[#6B6455]/60 dark:text-[#93876A]/60"}`}>
                {relativeTime}
              </span>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                disabled={deletingId === doc._id}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-[#B5502F]/10 hover:text-[#B5502F] transition-all"
                title="Delete document"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
        {doc.snippet && (
          <p className={`mt-0.5 ml-6 text-xs truncate ${isSelected ? "text-[#5C6E4E]/70" : "text-[#6B6455]/70 dark:text-[#93876A]/70"}`}>
            {doc.snippet}
          </p>
        )}
      </div>
    </li>
  );
}
