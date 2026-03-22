import apiClient from "@/services/apiClient";

type QueryParams = Record<string, unknown>;

async function get(url: string, params?: QueryParams) {
  const response = await apiClient.get(url, params ? { params } : undefined);
  return response.data;
}

async function post(url: string, payload?: unknown) {
  const response = await apiClient.post(url, payload ?? {});
  return response.data;
}

export const communicationsApi = {
  async loadWorkspace() {
    const settled = await Promise.allSettled([
      get("/api/communications/announcements/", { page: 1, page_size: 100 }),
      get("/api/communications/message-threads/", { page: 1, page_size: 100 }),
      get("/api/communications/message-participants/", { page: 1, page_size: 200 }),
      get("/api/communications/messages/", { page: 1, page_size: 300 }),
      get("/api/communications/notifications/", { page: 1, page_size: 100 }),
      get("/api/communications/notifications/unread-count/"),
    ]);

    const valueAt = <T,>(index: number, fallback: T) =>
      settled[index].status === "fulfilled"
        ? (settled[index] as PromiseFulfilledResult<T>).value
        : fallback;

    return {
      announcementsData: valueAt(0, [] as unknown[]),
      threadsData: valueAt(1, [] as unknown[]),
      participantsData: valueAt(2, [] as unknown[]),
      messagesData: valueAt(3, [] as unknown[]),
      notificationsData: valueAt(4, [] as unknown[]),
      unreadData: valueAt(5, { unread: 0, by_channel: [] }),
    };
  },
  sendMessage(payload: Record<string, unknown>) {
    return post("/api/communications/messages/", payload);
  },
  createThread(payload: Record<string, unknown>) {
    return post("/api/communications/message-threads/", payload);
  },
  addParticipant(payload: Record<string, unknown>) {
    return post("/api/communications/message-participants/", payload);
  },
  createAnnouncement(payload: Record<string, unknown>) {
    return post("/api/communications/announcements/", payload);
  },
  createNotification(payload: Record<string, unknown>) {
    return post("/api/communications/notifications/", payload);
  },
  async loadBulkCampaigns() {
    return get("/api/communications/bulk-campaigns/", { page: 1, page_size: 200 });
  },
  queueCampaign(id: number, dispatchNow: boolean) {
    return post(`/api/communications/bulk-campaigns/${id}/queue/`, { dispatch_now: dispatchNow });
  },
  retryFailedCampaign(id: number, dispatchNow: boolean) {
    return post(`/api/communications/bulk-campaigns/${id}/retry-failed/`, { dispatch_now: dispatchNow });
  },
  previewCampaignAudience(id: number) {
    return get(`/api/communications/bulk-campaigns/${id}/audience-preview/`);
  },
  refreshCampaignStatus(id: number) {
    return post(`/api/communications/bulk-campaigns/${id}/refresh-status/`, {});
  },
  getCampaignStats(id: number) {
    return get(`/api/communications/bulk-campaigns/${id}/stats/`);
  },
  getCampaignRecipients(id: number) {
    return get(`/api/communications/bulk-campaigns/${id}/recipients/`);
  },
  cancelCampaign(id: number) {
    return post(`/api/communications/bulk-campaigns/${id}/cancel/`, {});
  },
  createCampaign(payload: Record<string, unknown>) {
    return post("/api/communications/bulk-campaigns/", payload);
  },
};
