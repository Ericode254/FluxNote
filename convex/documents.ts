import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { components } from "./_generated/api";
import { ProsemirrorSync } from "@convex-dev/prosemirror-sync";

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
    if (!userId) return [];

    const owned = await ctx.db
      .query("documents")
      .withIndex("by_owner_id", (q) => q.eq("ownerId", userId))
      .collect();

    const access = await ctx.db
      .query("documentAccess")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();

    const shared = await Promise.all(
      access.map((a) => ctx.db.get(a.documentId))
    );

    const all = [...owned, ...shared.filter((d): d is NonNullable<typeof d> => d !== null)];
    // De-duplicate by ID
    const unique = Array.from(new Map(all.map((d) => [d._id, d])).values());

    return unique.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const get = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const doc = await ctx.db.get(args.id);
    if (!doc) return null;

    if (doc.ownerId === userId) return doc;

    const access = await ctx.db
      .query("documentAccess")
      .withIndex("by_document_and_user", (q) => q.eq("documentId", args.id).eq("userId", userId))
      .unique();

    return access ? doc : null;
  },
});


export const getByInviteCode = query({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", args.inviteCode))
      .unique();
  },
});

export const create = mutation({
  args: { title: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const inviteCode = generateInviteCode();
    const id = await ctx.db.insert("documents", {
      title: args.title,
      ownerId: userId ?? undefined,
      inviteCode,
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
    const inviteCode = generateInviteCode();
    await ctx.db.patch(args.id, { inviteCode });
    return inviteCode;
  },
});

export const joinByInviteCode = mutation({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const doc = await ctx.db
      .query("documents")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", args.inviteCode))
      .unique();

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
      });
    }

    return doc._id;
  },
});

