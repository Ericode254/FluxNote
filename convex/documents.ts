import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { components } from "./_generated/api";
import { ProsemirrorSync } from "@convex-dev/prosemirror-sync";
import { Id } from "./_generated/dataModel";


const prosemirrorSync = new ProsemirrorSync(components.prosemirrorSync);

export const {
  getSnapshot,
  submitSnapshot,
  latestVersion,
  getSteps,
  submitSteps,
} = prosemirrorSync.syncApi({});

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10);
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { owned: [], shared: [] };

    const owned = await ctx.db
      .query("documents")
      .withIndex("by_owner_id", (q) => q.eq("ownerId", userId))
      .collect();

    const accessRecords = await ctx.db
      .query("documentAccess")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();

    const shared = await Promise.all(
      accessRecords.map(async (a) => {
        const doc = await ctx.db.get(a.documentId);
        return doc ? { ...doc, role: a.role ?? "write" } : null;
      })

    );

    return {
      owned: owned.sort((a, b) => b._creationTime - a._creationTime),
      shared: shared
        .filter((d): d is NonNullable<typeof d> => d !== null)
        .sort((a, b) => b._creationTime - a._creationTime),
    };
  },
});


export const get = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const doc = await ctx.db.get(args.id);
    if (!doc) return null;

    if (doc.ownerId === userId) return { ...doc, role: "write" as const, isOwner: true };

    const access = await ctx.db
      .query("documentAccess")
      .withIndex("by_document_and_user", (q) => q.eq("documentId", args.id).eq("userId", userId))
      .unique();

    return access ? { ...doc, role: access.role ?? "write", isOwner: false } : null;

  },
});



export const create = mutation({
  args: { title: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const readInviteCode = generateInviteCode();
    const writeInviteCode = generateInviteCode();
    const id = await ctx.db.insert("documents", {
      title: args.title,
      ownerId: userId ?? undefined,
      readInviteCode,
      writeInviteCode,
    });
    // Initialize the prosemirror document
    await prosemirrorSync.create(ctx, id, {
      type: "doc",
      content: [],
    });
    return id;
  },
});


export const updateTitle = mutation({
  args: { id: v.id("documents"), title: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { title: args.title });
  },
});

export const resetDocument = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    // Clear and re-initialize the prosemirror document
    await prosemirrorSync.create(ctx, args.id, {
      type: "doc",
      content: [],
    });
  },
});

export const remove = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const regenerateInviteCode = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.ownerId !== userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.id, {
      readInviteCode: generateInviteCode(),
      writeInviteCode: generateInviteCode(),
      inviteCode: undefined, // Clear legacy code if it exists
    });
  },
});


export const joinByInviteCode = mutation({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let doc = await ctx.db
      .query("documents")
      .withIndex("by_write_invite_code", (q) => q.eq("writeInviteCode", args.inviteCode))
      .unique();
    let role: "read" | "write" = "write";

    if (!doc) {
      doc = await ctx.db
        .query("documents")
        .withIndex("by_read_invite_code", (q) => q.eq("readInviteCode", args.inviteCode))
        .unique();
      role = "read";
    }

    // Fallback to legacy inviteCode
    if (!doc) {
      doc = await ctx.db
        .query("documents")
        .withIndex("by_invite_code", (q) => q.eq("inviteCode", args.inviteCode))
        .unique();
      role = "write";
    }

    if (!doc) throw new Error("Invalid invite code");
    if (doc.ownerId === userId) return doc._id;

    const existing = await ctx.db
      .query("documentAccess")
      .withIndex("by_document_and_user", (q) =>
        q.eq("documentId", doc._id).eq("userId", userId)
      )
      .unique();

    if (!existing) {
      await ctx.db.insert("documentAccess", {
        documentId: doc._id,
        userId,
        role,
      });
    } else if (existing.role === "read" && role === "write") {
      await ctx.db.patch(existing._id, { role: "write" });
    }

    return doc._id;
  },
});

export const removeAccess = mutation({
  args: { documentId: v.id("documents"), userId: v.string() },
  handler: async (ctx, args) => {
    const ownerId = await getAuthUserId(ctx);
    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.ownerId !== ownerId) throw new Error("Unauthorized");

    const access = await ctx.db
      .query("documentAccess")
      .withIndex("by_document_and_user", (q) => q.eq("documentId", args.documentId).eq("userId", args.userId))
      .unique();

    if (access) {
      await ctx.db.delete(access._id);
    }
  },
});

export const listAccess = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const ownerId = await getAuthUserId(ctx);
    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.ownerId !== ownerId) return [];

    const access = await ctx.db
      .query("documentAccess")
      .withIndex("by_document_id", (q) => q.eq("documentId", args.documentId))
      .collect();

    return await Promise.all(
      access.map(async (a) => {
        const user = await ctx.db.get(a.userId as Id<"users">);

        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user_id", (q) => q.eq("userId", a.userId))
          .unique();
        return {
          userId: a.userId,
          name: profile?.displayName || user?.name || "Anonymous",
          role: a.role ?? "write",
        };

      })
    );
  },
});


