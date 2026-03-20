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
    return await ctx.db.query("documents").order("desc").collect();
  },
});

export const get = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
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
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: args.title }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Start writing here..." }],
        },
      ],
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
