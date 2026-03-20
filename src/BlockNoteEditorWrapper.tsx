import { useBlockNoteSync } from "@convex-dev/prosemirror-sync/blocknote";
import { BlockNoteView } from "@blocknote/mantine";
import { BlockNoteEditor } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

interface BlockNoteEditorWrapperProps {
  docId: Id<"documents">;
  darkMode: boolean;
  displayName: string;
}

export function BlockNoteEditorWrapper({ docId, darkMode, displayName }: BlockNoteEditorWrapperProps) {
  const sync = useBlockNoteSync<BlockNoteEditor>(api.documents, docId as string);

  if (sync.isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4F91FF]"></div>
      </div>
    );
  }

  if (!sync.editor) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <p className="text-[#555555] dark:text-[#AAAAAA]">Document not initialized</p>
        <button
          onClick={() => sync.create({ type: "doc", content: [] })}
          className="px-4 py-2 bg-[#4F91FF] hover:bg-[#3a7de8] text-white rounded-lg font-medium transition-colors"
        >
          Initialize Document
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bn-container" data-color-scheme={darkMode ? "dark" : "light"}>
      <BlockNoteView
        editor={sync.editor}
        theme={darkMode ? "dark" : "light"}
        style={{ minHeight: "100%", background: "transparent" }}
      />
    </div>
  );
}
