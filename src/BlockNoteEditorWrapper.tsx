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
import { useEffect, useRef } from "react";

interface BlockNoteEditorWrapperProps {
  docId: Id<"documents">;
  darkMode: boolean;
  displayName: string;
}

const COLORS = [
  "#FF5F5F", "#4F91FF", "#32D74B", "#FF9500", "#AF52DE", "#FFCC00", "#5AC8FA", "#FF2D55",
];

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
      // @ts-ignore — update timestamp whenever we see fresh cursor data
      if (p.data?.cursor) {
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
            name: "remote-cursors",
            addProseMirrorPlugins() {
              return [
                new Plugin({
                  key: new PluginKey("remote-cursors"),
                  state: {
                    init() { return DecorationSet.empty; },
                    apply(tr, set, oldState, newState) {
                      // Map existing decorations so they "stick" to the text
                      // — this is what makes remote cursors follow edits smoothly
                      // without needing a fresh presence broadcast every keystroke.
                      set = set.map(tr.mapping, newState.doc);

                      if (tr.getMeta("presenceUpdate") || tr.docChanged) {
                        const decorations: Decoration[] = [];
                        const now = Date.now();

                        presenceRef.current?.forEach((p) => {
                          // @ts-ignore
                          if (p.userId === userIdRef.current || !p.data?.cursor) return;

                          // ── Stale cursor cleanup ───────────────────────
                          const lastSeen = lastSeenRef.current[p.userId] ?? now;
                          const staleness = now - lastSeen;

                          // Remove cursor entirely if unseen for 10s
                          if (staleness >= STALE_REMOVE_MS) return;

                          const isStale = staleness >= STALE_FADE_MS;

                          // @ts-ignore
                          let pos = p.data.cursor.pos;

                          // Prefer the mapped position during document changes to keep it fluid, 
                          // BUT trust the Presence data if this is an explicit presence broadcast.
                          const existing = set.find(undefined, undefined, (spec) => spec.key === p.userId);
                          if (existing.length > 0 && !tr.getMeta("presenceUpdate")) {
                            pos = existing[0].from;
                          }

                          if (pos < 0 || pos > newState.doc.content.size) return;

                          const $pos = newState.doc.resolve(pos);
                          if (!$pos.parent.isTextblock) {
                            // Boundary case (e.g. between blocks) — find nearest valid text position
                            pos = Selection.near($pos, -1).from;
                          }

                          const color = getColorForUser(p.userId);
                          const name = p.name || "Anonymous";

                          const cursorEl = document.createElement("span");
                          cursorEl.className = "collaboration-cursor"
                            + (isStale ? " collaboration-cursor--stale" : "");
                          cursorEl.style.borderLeft = `2px solid ${color}`;
                          cursorEl.style.position = "relative";
                          cursorEl.style.pointerEvents = "none";
                          cursorEl.style.height = "1.2em";
                          cursorEl.style.display = "inline";
                          cursorEl.style.verticalAlign = "text-bottom";
                          cursorEl.style.transition = "all 0.15s ease-out";

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
                          labelEl.textContent = name;
                          cursorEl.appendChild(labelEl);

                          decorations.push(Decoration.widget(pos, cursorEl, { 
                            key: p.userId, 
                            handleBuffer: true,
                            side: 10 // Stays to the right of inserted text
                          }));
                        });
                        return DecorationSet.create(newState.doc, decorations);
                      }
                      return set;
                    },
                  },
                  props: {
                    decorations(state) { return this.getState(state); },
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
  // Re-dispatch every 3s so stale cursors visually fade and eventually
  // get removed, even when no doc changes are happening.
  // NOTE: This ONLY sets the "presenceUpdate" meta — the apply() function
  // still prefers the mapped position from existing decorations, so this
  // won't snap cursors back to stale positions.
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
  // Presence updates are SEPARATE from content — cursor moves don't
  // block or wait for document sync, reducing perceived lag.
  //
  // Strategy:
  //  • Cursor-only moves (click, arrow keys): throttle with leading edge
  //    at 80ms — feels near-instant.
  //  • While typing: throttle at 2s — ProseMirror decoration mapping
  //    keeps the remote cursor visually accurate between broadcasts,
  //    so we don't waste bandwidth on per-keystroke position updates.
  useEffect(() => {
    if (!editor || !userId) return;

    let lastSentPos = -1;
    let lastSentTime = 0;
    let throttleTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleTransaction = (props: { transaction: any }) => {
      const pos = editor.prosemirrorState.selection.from;
      // Distinguish local typing from remote updates.
      // Remote transactions from prosemirror-collab have addToHistory = false.
      // We only want the long throttle for our OWN typing.
      const isLocalTyping =
        props.transaction.docChanged &&
        props.transaction.getMeta("addToHistory") !== false;
      const now = Date.now();

      if (pos === lastSentPos) return;

      // Choose throttle window: short for cursor moves/remote updates (80ms), 
      // moderate while the local user is typing (1s).
      const throttleMs = isLocalTyping ? 1000 : 80;

      if (now - lastSentTime < throttleMs) {
        // Within throttle window — schedule a trailing-edge send
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

      // Outside throttle window — send immediately (leading edge)
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
    <div className="h-full overflow-y-auto bn-container" data-color-scheme={darkMode ? "dark" : "light"}>
      <BlockNoteView
        editor={sync.editor}
        theme={darkMode ? "dark" : "light"}
        style={{ minHeight: "100%", background: "transparent" }}
      />
    </div>
  );
}
