import { useCallback, useEffect, useMemo, useState } from "react";
import {
  listFeedback,
  markAsViewed,
  openFeedbackDetails,
  updateFeedbackStatus,
  type Feedback,
  type FeedbackStatus,
} from "./api";

export function useFeedback(enabled: boolean) {
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listFeedback()
      .then((data) => setItems(data))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load feedback"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (enabled) load();
  }, [enabled, load]);

  const selected = useMemo(
    () => items.find((item) => item.feedbackId === selectedId) ?? null,
    [items, selectedId],
  );

  const replaceItem = useCallback((updated: Feedback) => {
    setItems((prev) => prev.map((i) => (i.feedbackId === updated.feedbackId ? updated : i)));
  }, []);

  const openDetails = useCallback(
    async (id: string) => {
      setSelectedId(id);
      try {
        const full = await openFeedbackDetails(id);
        replaceItem(full);
        if (!full.viewed) replaceItem(await markAsViewed(id));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to open feedback");
      }
    },
    [replaceItem],
  );

  const changeStatus = useCallback(
    async (id: string, status: FeedbackStatus) => {
      try {
        replaceItem(await updateFeedbackStatus(id, status));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update status");
      }
    },
    [replaceItem],
  );

  const markViewed = useCallback(
    async (id: string) => {
      try {
        replaceItem(await markAsViewed(id));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to mark as viewed");
      }
    },
    [replaceItem],
  );

  return {
    items,
    loading,
    error,
    setError,
    selectedId,
    selected,
    load,
    openDetails,
    changeStatus,
    markViewed,
  };
}
