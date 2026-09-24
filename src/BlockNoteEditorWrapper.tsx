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
import { Plugin, PluginKey, Selection } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { sendableSteps } from "prosemirror-collab";
import { useEffect, useRef, useState, useImperativeHandle, forwardRef, useMemo } from "react";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { all, createLowlight } from "lowlight";

export interface BlockNoteEditorWrapperHandle {
  downloadMarkdown: (title: string) => void;
}

export type SyncStatus = "saved" | "saving";

interface BlockNoteEditorWrapperProps {
  docId: Id<"documents">;
  darkMode: boolean;
  displayName: string;
  readOnly?: boolean;
  onSyncStatusChange?: (status: SyncStatus) => void;
}

const COLORS = [
  "#B5502F", "#5C6E4E", "#6B7F4F", "#B98A3D", "#6B5B8C", "#C9A24A", "#4A6670", "#8C6E4A",
];

interface PresenceData {
  cursor?: {
    pos: number;
  };
  selection?: {
    from: number;
    to: number;
  };
}

const SMOOTH_TEXT_KEY = new PluginKey("smooth-text");
const REMOTE_CURSORS_KEY = new PluginKey("remote-cursors");
const REMOTE_SELECTIONS_KEY = new PluginKey("remote-selections");

const lowlight = createLowlight(all);


function getColorForUser(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

const STALE_FADE_MS = 5_000;
const STALE_REMOVE_MS = 10_000;

export const BlockNoteEditorWrapper = forwardRef<BlockNoteEditorWrapperHandle, BlockNoteEditorWrapperProps>(({
  docId,
  darkMode,
  displayName,
  readOnly = false,
  onSyncStatusChange,
}, ref) => {
  const userId = useQuery(api.presence.getUserId);
  const presence = usePresence(api.presence, docId, userId || "");
  const updatePresence = useMutation(api.presence.update);

  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const presenceRef = useRef(presence);
  presenceRef.current = presence;

  const lastSeenRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!presence) return;
    const now = Date.now();
    const activeIds = new Set<string>();
    presence.forEach((p) => {
      activeIds.add(p.userId);
      const data = p.data as PresenceData;
      if (data?.cursor) {
        lastSeenRef.current[p.userId] = now;
      } else if (!lastSeenRef.current[p.userId]) {
        lastSeenRef.current[p.userId] = now;
      }
    });
    for (const uid of Object.keys(lastSeenRef.current)) {
      if (!activeIds.has(uid)) {
        delete lastSeenRef.current[uid];
      }
    }
  }, [presence]);

  const editorOptions = useMemo(() => ({
    _tiptapOptions: {
      extensions: [
        CodeBlockLowlight.extend({
          group: "blockContent",
        }).configure({
          lowlight,
        }),
        Extension.create({
          name: "smooth-text",
          addProseMirrorPlugins() {
            return [
              new Plugin({
                key: SMOOTH_TEXT_KEY,
                state: {
                  init() { return DecorationSet.empty; },
                  apply(tr, set) {
                    set = set.map(tr.mapping, tr.doc);
                    if (tr.docChanged && tr.getMeta("addToHistory") === false) {
                      tr.steps.forEach((step: any, i: number) => {
                        const map = tr.mapping.maps[i];
                        map.forEach((_oldStart: any, _oldEnd: any, newStart: any, newEnd: any) => {
                          if (newEnd > newStart) {
                            set = set.add(tr.doc, [
                              Decoration.inline(newStart, newEnd, {
                                class: "smooth-text-insertion",
                              }),
                            ]);
                          }
                        });
                      });
                    }
                    if (tr.getMeta("smooth-text-cleanup")) {
                       return DecorationSet.empty;
                    }
                    return set;
                  },
                },
                props: {
                  decorations(state) { return this.getState(state); },
                },
                view(view) {
                  return {
                    update() {
                      const set = SMOOTH_TEXT_KEY.getState(view.state);
                      if (set && set.find().length > 0) {
                        setTimeout(() => {
                          if (!view.isDestroyed) {
                            view.dispatch(view.state.tr.setMeta("smooth-text-cleanup", true));
                          }
                        }, 1000);
                      }
                    }
                  };
                }
              }),
            ];
          }
        }),
        Extension.create({
          name: "remote-cursors",
          addProseMirrorPlugins() {
            return [
              new Plugin({
                key: REMOTE_CURSORS_KEY,
                state: {
                  init() { return { cursors: [] as any[] }; },
                  apply(tr, value, oldState, newState) {
                    let { cursors } = value;
                    cursors = cursors.map((c: any) => ({
                      ...c,
                      pos: tr.mapping.map(c.pos)
                    }));
                    if (tr.getMeta("presenceUpdate") || tr.docChanged) {
                      const now = Date.now();
                      const newCursors: any[] = [];
                      presenceRef.current?.forEach((p) => {
                        const data = p.data as PresenceData;
                        if (p.userId === userIdRef.current || !data?.cursor) return;
                        const lastSeen = lastSeenRef.current[p.userId] ?? now;
                        if (now - lastSeen >= STALE_REMOVE_MS) return;
                        let pos = data.cursor.pos;
                        const existing = cursors.find((c: any) => c.userId === p.userId);
                        if (existing && !tr.getMeta("presenceUpdate")) {
                          pos = existing.pos;
                        }
                        if (pos < 0 || pos > newState.doc.content.size) return;
                        const $pos = newState.doc.resolve(pos);
                        if (!$pos.parent.isTextblock) {
                          pos = Selection.near($pos, -1).from;
                        }
                        newCursors.push({
                          userId: p.userId,
                          pos,
                          name: p.name || "Anonymous",
                          color: getColorForUser(p.userId),
                          isStale: now - lastSeen >= STALE_FADE_MS,
                          selection: data.selection ? {
                            from: tr.mapping.map(data.selection.from),
                            to: tr.mapping.map(data.selection.to)
                          } : null
                        });
                      });
                      return { cursors: newCursors };
                    }
                    return { cursors };
                  },
                },
                props: {
                  decorations(state) {
                    const pluginState = this.getState(state);
                    if (!pluginState || !pluginState.cursors) return DecorationSet.empty;
                    
                    const { cursors } = pluginState;
                    const decos: Decoration[] = [];
                    cursors.forEach((c: any) => {

                      if (c.selection && c.selection.from !== c.selection.to && !c.isStale) {
                        const from = Math.min(c.selection.from, c.selection.to);
                        const to = Math.max(c.selection.from, c.selection.to);
                        if (from >= 0 && to <= state.doc.content.size) {
                          decos.push(Decoration.inline(from, to, {
                            style: `background-color: ${c.color}33; transition: background-color 0.2s;`,
                            class: "remote-selection-highlight"
                          }));
                        }
                      }
                    });
                    return DecorationSet.create(state.doc, decos);
                  }
                }
              }),
            ];
          },

        }),
      ],
    },
  }), []);

  const sync = useBlockNoteSync<BlockNoteEditor>(api.documents, docId as string, {
    editorOptions,
  });

  const editor = sync?.editor;

  useEffect(() => {
    if (!editor || readOnly) return;
    const report = () => {
      const hasUnconfirmedSteps = !!sendableSteps(editor.prosemirrorState);
      onSyncStatusChange?.(hasUnconfirmedSteps ? "saving" : "saved");
    };
    report();
    editor._tiptapEditor.on("transaction", report);
    return () => {
      editor._tiptapEditor.off("transaction", report);
    };
  }, [editor, readOnly, onSyncStatusChange]);

  useEffect(() => {
    if (editor?.prosemirrorView) {
      const view = editor.prosemirrorView;
      requestAnimationFrame(() => {
        if (!view.isDestroyed) {
          view.dispatch(view.state.tr.setMeta("presenceUpdate", true));
        }
      });
    }
  }, [presence, editor]);

  useEffect(() => {
    if (!editor?.prosemirrorView) return;
    const view = editor.prosemirrorView;
    // Only needed to age cursors into "stale"/removed once the heartbeat
    // stops updating them; skip the tick entirely when nobody else is present.
    const interval = setInterval(() => {
      if (view.isDestroyed) return;
      if (!presenceRef.current || presenceRef.current.length <= 1) return;
      view.dispatch(view.state.tr.setMeta("presenceUpdate", true));
    }, 3_000);
    return () => clearInterval(interval);
  }, [editor]);

  useEffect(() => {
    if (!editor || !userId || readOnly) return;

    let lastSentPos = -1;
    let lastSentTime = 0;
    let throttleTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleTransaction = (props: { transaction: any }) => {
      const selection = editor.prosemirrorState.selection;
      const pos = selection.from;
      const isLocalTyping =
        props.transaction.docChanged &&
        props.transaction.getMeta("addToHistory") !== false;
      const now = Date.now();

      // Only skip if both pos and selection range same
      if (pos === lastSentPos) {
        const lastData = presenceRef.current?.find(p => p.userId === userId)?.data as PresenceData;
        if (lastData?.selection?.from === selection.from && lastData?.selection?.to === selection.to) {
          return;
        }
      }

      const throttleMs = isLocalTyping ? 150 : 80;


      if (now - lastSentTime < throttleMs) {
        if (!throttleTimeout) {
          throttleTimeout = setTimeout(() => {
            lastSentTime = Date.now();
            lastSentPos = editor.prosemirrorState.selection.from;
            updatePresence({
              roomId: docId,
              data: { cursor: { pos: editor.prosemirrorState.selection.from } },
            });
            throttleTimeout = null;
          }, throttleMs - (now - lastSentTime));
        }
        return;
      }

      lastSentTime = now;
      lastSentPos = pos;
      updatePresence({ 
        roomId: docId, 
        data: { 
          cursor: { pos },
          selection: { from: selection.from, to: selection.to }
        } 
      });

    };

    editor._tiptapEditor.on("transaction", handleTransaction);
    return () => {
      editor._tiptapEditor.off("transaction", handleTransaction);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [editor, userId, docId, updatePresence, readOnly]);

  useImperativeHandle(ref, () => ({
    downloadMarkdown: async (title: string) => {
      if (!editor) return;
      const markdown = await editor.blocksToMarkdownLossy(editor.document);
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title || "Untitled"}.md`;
      link.click();
      URL.revokeObjectURL(url);
    }
  }), [editor]);

  if (sync.isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5C6E4E]"></div>
      </div>
    );
  }

  if (!sync.editor) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <p className="text-[#6B6455] dark:text-[#93876A]">Document not initialized</p>
        <button
          onClick={() => sync.create({ type: "doc", content: [] })}
          className="px-4 py-2 bg-[#5C6E4E] hover:bg-[#4A5A3D] text-white rounded-lg font-medium transition-colors"
        >
          Initialize Document
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bn-container relative" data-color-scheme={darkMode ? "dark" : "light"}>
      <BlockNoteView
        editor={sync.editor}
        theme={darkMode ? "dark" : "light"}
        editable={!readOnly}
        style={{ minHeight: "100%", background: "transparent" }}
      />
      <RemoteCursorsOverlay editor={sync.editor} />
    </div>
  );
});

function RemoteCursorsOverlay({ editor }: { editor: BlockNoteEditor | null }) {
  const [cursorCoords, setCursorCoords] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editor?.prosemirrorView) return;
    const view = editor.prosemirrorView;

    const updateCoords = () => {
      const pluginState = REMOTE_CURSORS_KEY.getState(view.state);
      if (!pluginState || !pluginState.cursors) return;

      const viewportRect = view.dom.getBoundingClientRect();
      const parentRect = containerRef.current?.getBoundingClientRect() || viewportRect;

      const newCoords = pluginState.cursors.map((c: any) => {
        try {
          const coords = view.coordsAtPos(c.pos);
          return {
            ...c,
            top: coords.top - parentRect.top,
            left: coords.left - parentRect.left,
          };
        } catch (e) {
          return null;
        }
      }).filter(Boolean);

      setCursorCoords((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(newCoords)) return prev;
        return newCoords;
      });
    };

    // Recompute only when something that could move a cursor actually
    // happens, instead of an always-on 60fps loop that forces a layout
    // read (coordsAtPos) every frame even when nothing changed.
    let rafId: number | null = null;
    const scheduleUpdate = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        updateCoords();
      });
    };

    scheduleUpdate();
    view.dom.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    // Covers both local edits and remote presence/cursor transactions,
    // since every dispatch (docChanged or metadata-only) fires this event.
    editor._tiptapEditor.on("transaction", scheduleUpdate);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      view.dom.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      editor._tiptapEditor.off("transaction", scheduleUpdate);
    };
  }, [editor]);

  return (
    <div 
      ref={containerRef}
      style={{ 
        position: "absolute", 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        pointerEvents: "none",
        zIndex: 50,
        overflow: "hidden"
      }}
    >
      {cursorCoords.map((c) => (
        <div
          key={c.userId}
          className={`collaboration-cursor ${c.isStale ? "collaboration-cursor--stale" : ""}`}
          style={{
            transform: `translate3d(${c.left}px, ${c.top}px, 0)`,
            transition: "transform 0.12s cubic-bezier(0.165, 0.84, 0.44, 1.0), opacity 0.5s ease",
            color: c.color,
          }}
        >
          <div 
            className="collaboration-cursor__caret" 
            style={{ 
              backgroundColor: c.color,
              height: "1.2em",
              width: "2px"
            }} 
          />
          <div
            className="collaboration-cursor__label"
            style={{ 
              backgroundColor: c.color,
              color: "white",
              padding: "2px 6px",
              borderRadius: "4px 4px 4px 0px",
              fontSize: "10px",
              fontWeight: "600",
              whiteSpace: "nowrap",
              transform: "translateY(-100%)",
              marginTop: "-2px",
              display: c.isStale ? "none" : "block"
            }}
          >
            {c.name}
          </div>
        </div>
      ))}
    </div>
  );
}
