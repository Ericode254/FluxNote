import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import usePresence from "@convex-dev/presence/react";
import FacePile from "@convex-dev/presence/facepile";
import { Id } from "../convex/_generated/dataModel";

interface PresenceIndicatorProps {
  roomId: Id<"documents">;
}

export function PresenceIndicator({ roomId }: PresenceIndicatorProps) {
  const userId = useQuery(api.presence.getUserId);

  if (!userId) return null;

  return <PresenceInner roomId={roomId} userId={userId} />;
}

function PresenceInner({ roomId, userId }: { roomId: string; userId: string }) {
  const presenceState = usePresence(api.presence, roomId, userId);

  if (!presenceState || presenceState.length <= 1) return null;

  // Filter out internal data like cursor positions from the FacePile tooltips
  const sanitizedPresence = presenceState.map(({ data, ...p }) => ({
    ...p,
    // Keep only what FacePile needs or nothing from data
  }));

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[#6B6455] dark:text-[#93876A] hidden sm:block">
        {presenceState.length} editing
      </span>
      <FacePile presenceState={sanitizedPresence} />
    </div>
  );
}
