import apiClient from "@/services/apiClient";

export const uploadApi = {
  async uploadLotDetail(file: File, lotId?: string) {
    const form = new FormData();
    form.append("file", file);
    if (lotId) form.append("lot_id", lotId);

    const response = await apiClient.post("/accounts/lot-details/", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data;
  },
};
