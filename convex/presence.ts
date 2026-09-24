import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { v } from "convex/values";
import { Presence } from "@convex-dev/presence";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

export const presence = new Presence(components.presence);

export const getUserId = query({
  args: {},
  handler: async (ctx) => {
    return await getAuthUserId(ctx);
  },
});

export const heartbeat = mutation({
  args: {
    roomId: v.string(),
    userId: v.string(),
    sessionId: v.string(),
    interval: v.number(),
  },
  handler: async (ctx, { roomId, userId, sessionId, interval }) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      // Return a dummy token so the client doesn't crash; heartbeat is a no-op when unauthenticated
      return { roomToken: "", sessionToken: "" };
    }
    return await presence.heartbeat(ctx, roomId, authUserId, sessionId, interval);
  },
});

const COLORS = [
  "#B5502F", // Red
  "#5C6E4E", // Blue
  "#6B7F4F", // Green
  "#B98A3D", // Orange
  "#6B5B8C", // Purple
  "#C9A24A", // Yellow
  "#4A6670", // Sky Blue
  "#8C6E4A", // Pink
];

function getColorForUser(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export const list = query({
  args: { roomToken: v.string() },
  handler: async (ctx, { roomToken }) => {
    const presenceList = await presence.list(ctx, roomToken);

    const [users, profiles] = await Promise.all([
      Promise.all(
        presenceList.map((entry) => ctx.db.get(entry.userId as Id<"users">))
      ),
      Promise.all(
        presenceList.map((entry) =>
          ctx.db
            .query("userProfiles")
            .withIndex("by_user_id", (q) => q.eq("userId", entry.userId))
            .unique()
        )
      ),
    ]);

    return presenceList.map((entry, i) => {
      const user = users[i];
      const profile = profiles[i];
      const displayName =
        profile?.displayName ??
        user?.name ??
        user?.email ??
        "Anonymous";
      return {
        ...entry,
        name: displayName,
        image: user?.image,
        color: getColorForUser(entry.userId),
      };
    });
  },
});

export const disconnect = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    return await presence.disconnect(ctx, sessionToken);
  },
});

export const update = mutation({
  args: {
    roomId: v.string(),
    data: v.any(),
  },
  handler: async (ctx, { roomId, data }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    await presence.updateRoomUser(ctx, roomId, userId, data);
  },
});
