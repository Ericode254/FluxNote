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
import { useEffect, useRef, useState } from "react";

interface BlockNoteEditorWrapperProps {
  docId: Id<"documents">;
  darkMode: boolean;
  displayName: string;
}

const COLORS = [
  "#FF5F5F", "#4F91FF", "#32D74B", "#FF9500", "#AF52DE", "#FFCC00", "#5AC8FA", "#FF2D55",
];

interface PresenceData {
  cursor?: {
    pos: number;
  };
}

const SMOOTH_TEXT_KEY = new PluginKey("smooth-text");
const REMOTE_CURSORS_KEY = new PluginKey("remote-cursors");



function getColorForUser(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

// ─── Stale cursor thresholds ────────────────────────────────────────
const STALE_FADE_MS = 5_000;    // fade to 30% opacity after 5s inactivity
const STALE_REMOVE_MS = 10_000; // remove cursor entirely after 10s

export function BlockNoteEditorWrapper({ docId, darkMode, displayName }: BlockNoteEditorWrapperProps) {
  const userId = useQuery(api.presence.getUserId);
  const presence = usePresence(api.presence, docId, userId || "");
  const updatePresence = useMutation(api.presence.update);

  // Use refs so the ProseMirror plugin closure always sees current values
  // (the plugin is created once and never re-created, so bare variables
  //  would be stale — e.g. userId starts as `undefined` before the query resolves)
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const presenceRef = useRef(presence);
  presenceRef.current = presence;

  // Track when we last received a presence update per remote user
  const lastSeenRef = useRef<Record<string, number>>({});

  // Update lastSeen timestamps whenever presence data changes
  useEffect(() => {
    if (!presence) return;
    const now = Date.now();
    const activeIds = new Set<string>();
    presence.forEach((p) => {
      activeIds.add(p.userId);
      const data = p.data as PresenceData;
      // Update timestamp whenever we see fresh cursor data
      if (data?.cursor) {
        lastSeenRef.current[p.userId] = now;
      } else if (!lastSeenRef.current[p.userId]) {
        lastSeenRef.current[p.userId] = now;
      }
    });
    // Clean up entries for users who left entirely
    for (const uid of Object.keys(lastSeenRef.current)) {
      if (!activeIds.has(uid)) {
        delete lastSeenRef.current[uid];
      }
    }
  }, [presence]);

  const sync = useBlockNoteSync<BlockNoteEditor>(api.documents, docId as string, {
    editorOptions: {
      _tiptapOptions: {
        extensions: [
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
                      
                      // Identify remote changes and mark them for animation
                      // Remote transactions from prosemirror-sync/collab have addToHistory = false
                      if (tr.docChanged && tr.getMeta("addToHistory") === false) {
                        tr.steps.forEach((step, i) => {
                          const map = tr.mapping.maps[i];
                          map.forEach((_oldStart, _oldEnd, newStart, newEnd) => {
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

                      // Cleanup on next interaction or manual meta
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
                          // Schedule cleanup
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
                      // Map positions
                      cursors = cursors.map(c => ({
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
                            isStale: now - lastSeen >= STALE_FADE_MS
                          });
                        });
                        return { cursors: newCursors };
                      }
                      return { cursors };
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

  // ── Trigger decoration rebuild when presence data changes ──────────
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

  // ── Periodic stale-cursor check ────────────────────────────────────
  useEffect(() => {
    if (!editor?.prosemirrorView) return;
    const view = editor.prosemirrorView;
    const interval = setInterval(() => {
      if (!view.isDestroyed) {
        view.dispatch(view.state.tr.setMeta("presenceUpdate", true));
      }
    }, 3_000);
    return () => clearInterval(interval);
  }, [editor]);

  // ── Cursor position broadcasting ──────────────────────────────────
  useEffect(() => {
    if (!editor || !userId) return;

    let lastSentPos = -1;
    let lastSentTime = 0;
    let throttleTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleTransaction = (props: { transaction: any }) => {
      const pos = editor.prosemirrorState.selection.from;
      const isLocalTyping =
        props.transaction.docChanged &&
        props.transaction.getMeta("addToHistory") !== false;
      const now = Date.now();

      if (pos === lastSentPos) return;
      const throttleMs = isLocalTyping ? 1000 : 80;

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
      updatePresence({ roomId: docId, data: { cursor: { pos } } });
    };

    editor._tiptapEditor.on("transaction", handleTransaction);
    return () => {
      editor._tiptapEditor.off("transaction", handleTransaction);
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
    <div className="h-full overflow-y-auto bn-container relative" data-color-scheme={darkMode ? "dark" : "light"}>
      <BlockNoteView
        editor={sync.editor}
        theme={darkMode ? "dark" : "light"}
        style={{ minHeight: "100%", background: "transparent" }}
      />
      <RemoteCursorsOverlay editor={sync.editor} />
    </div>
  );
}

// ── Remote Cursors Overlay ───────────────────────────────────────────
// Calculates coordinates for remote cursors and renders them as absolute
// positioned elements, allowing smooth CSS transitions on move.
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
        // Simple optimization to avoid unnecessary re-renders if nothing moved
        if (JSON.stringify(prev) === JSON.stringify(newCoords)) return prev;
        return newCoords;
      });
    };

    // Update on animation frames for smooth visual feedback
    let rafId: number;
    const loop = () => {
      updateCoords();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafId);
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
