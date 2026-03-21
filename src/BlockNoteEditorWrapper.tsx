import { useBlockNoteSync } from "@convex-dev/prosemirror-sync/blocknote";
import { BlockNoteView } from "@blocknote/mantine";
import { BlockNoteEditor } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import usePresence from "@convex-dev/presence/react";
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { useEffect, useRef } from "react";

interface BlockNoteEditorWrapperProps {
  docId: Id<"documents">;
  darkMode: boolean;
  displayName: string;
}

const COLORS = [
  "#FF5F5F", // Red
  "#4F91FF", // Blue
  "#32D74B", // Green
  "#FF9500", // Orange
  "#AF52DE", // Purple
  "#FFCC00", // Yellow
  "#5AC8FA", // Sky Blue
  "#FF2D55", // Pink
];

function getColorForUser(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function BlockNoteEditorWrapper({ docId, darkMode, displayName }: BlockNoteEditorWrapperProps) {
  const userId = useQuery(api.presence.getUserId);
  const presence = usePresence(api.presence, docId, userId || "");
  const updatePresence = useMutation(api.presence.update);
  
  const presenceRef = useRef(presence);
  presenceRef.current = presence;

  const sync = useBlockNoteSync<BlockNoteEditor>(api.documents, docId as string, {
    editorOptions: {
      _tiptapOptions: {
        extensions: [
          Extension.create({
            name: "remote-cursors",
            addProseMirrorPlugins() {
              return [
                new Plugin({
                  key: new PluginKey("remote-cursors"),
                  state: {
                    init() {
                      return DecorationSet.empty;
                    },
                    apply(tr, set, oldState, newState) {
                      // 1. Map existing decorations forward so they stay with text as it's typed
                      set = set.map(tr.mapping, newState.doc);

                      // 2. If presence updated, rebuild decorations from the latest absolute positions
                      if (tr.getMeta("presenceUpdate")) {
                        const decorations: Decoration[] = [];
                        
                        presenceRef.current?.forEach((p) => {
                          // @ts-ignore
                          if (p.userId === userId || !p.data?.cursor) return;
                          
                          // @ts-ignore
                          let pos = p.data.cursor.pos;
                          if (pos < 0 || pos > newState.doc.content.size) return;

                          // Snap to textblock to avoid line-jumping
                          const $pos = newState.doc.resolve(pos);
                          if (!$pos.parent.isTextblock) {
                            if ($pos.nodeBefore?.isTextblock) pos = pos - 1;
                            else if ($pos.nodeAfter?.isTextblock) pos = pos + 1;
                            else return;
                          }

                          const color = getColorForUser(p.userId);
                          const name = p.name || "Anonymous";

                          const cursorEl = document.createElement("span");
                          cursorEl.className = "collaboration-cursor";
                          cursorEl.style.borderLeft = `2px solid ${color}`;
                          cursorEl.style.position = "relative";
                          cursorEl.style.pointerEvents = "none";
                          cursorEl.style.marginLeft = "-1px";
                          cursorEl.style.marginRight = "-1px";
                          cursorEl.style.height = "1.2em";
                          cursorEl.style.display = "inline";
                          cursorEl.style.verticalAlign = "text-bottom";
                          cursorEl.style.transition = "all 0.1s ease-out";

                          const labelEl = document.createElement("span");
                          labelEl.className = "collaboration-cursor__label";
                          labelEl.style.backgroundColor = color;
                          labelEl.style.color = "white";
                          labelEl.style.padding = "1px 4px";
                          labelEl.style.borderRadius = "3px 3px 3px 0";
                          labelEl.style.fontSize = "11px";
                          labelEl.style.fontWeight = "600";
                          labelEl.style.position = "absolute";
                          labelEl.style.top = "-16px";
                          labelEl.style.left = "-1px";
                          labelEl.style.whiteSpace = "nowrap";
                          labelEl.style.lineHeight = "1.2";
                          labelEl.style.zIndex = "10";
                          labelEl.style.pointerEvents = "none";
                          labelEl.textContent = name;
                          cursorEl.appendChild(labelEl);

                          decorations.push(
                            Decoration.widget(pos, cursorEl, {
                              key: p.userId,
                              side: 1,
                              stopEvent: () => true,
                            })
                          );
                        });
                        return DecorationSet.create(newState.doc, decorations);
                      }
                      return set;
                    },
                  },
                  props: {
                    decorations(state) {
                      return this.getState(state);
                    },
                  },
                }),
              ];
            },
          }),
        ],
      },
    } as any,
  });

  const editor = sync?.editor;

  // Signal to the plugin that presence has changed
  useEffect(() => {
    if (editor && editor.prosemirrorView) {
      const view = editor.prosemirrorView;
      requestAnimationFrame(() => {
        if (view.docView) { 
          view.dispatch(view.state.tr.setMeta("presenceUpdate", true));
        }
      });
    }
  }, [presence, editor]);

  // Update our own cursor position in presence
  useEffect(() => {
    if (!editor || !userId) return;

    let lastSentPos = -1;
    let throttleTimeout: any = null;

    const handleUpdate = () => {
      const selection = editor.prosemirrorState.selection;
      const pos = selection.from;
      
      if (pos === lastSentPos) return;
      lastSentPos = pos;

      if (throttleTimeout) return;

      throttleTimeout = setTimeout(() => {
        updatePresence({
          roomId: docId,
          data: { cursor: { pos } },
        }).finally(() => {
          throttleTimeout = null;
        });
      }, 50);
    };

    editor._tiptapEditor.on("update", handleUpdate);
    editor._tiptapEditor.on("selectionUpdate", handleUpdate);
    
    return () => {
      editor._tiptapEditor.off("update", handleUpdate);
      editor._tiptapEditor.off("selectionUpdate", handleUpdate);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [editor, userId, docId, updatePresence]);

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
