import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const applicationTables = {
  documents: defineTable({
    title: v.string(),
    ownerId: v.optional(v.string()),
    inviteCode: v.optional(v.string()),
    // Legacy fields kept for migration compatibility
    content: v.optional(v.string()),
    lastEditedBy: v.optional(v.string()),
  }).index("by_invite_code", ["inviteCode"])
    .index("by_owner_id", ["ownerId"]),

  userProfiles: defineTable({
    userId: v.string(),
    displayName: v.string(),
  }).index("by_user_id", ["userId"]),
  documentAccess: defineTable({
    documentId: v.id("documents"),
    userId: v.string(),
  })
    .index("by_user_id", ["userId"])
    .index("by_document_id", ["documentId"])
    .index("by_document_and_user", ["documentId", "userId"]),
};


export default defineSchema({
  ...authTables,
  ...applicationTables,
});
