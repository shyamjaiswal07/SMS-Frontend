import apiClient from "@/services/apiClient";

export type UploadedFileAsset = {
  id: number;
  file_url?: string;
  original_name?: string;
  mime_type?: string;
  size_bytes?: number;
};

type UploadOptions = {
  purpose: string;
  file: File;
  onProgress?: (percent: number) => void;
};

export async function uploadFileAsset({ purpose, file, onProgress }: UploadOptions) {
  const formData = new FormData();
  formData.append("purpose", purpose);
  formData.append("file", file);

  const response = await apiClient.post("/api/common/file-assets/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (!event.total || !onProgress) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    },
  });

  return response.data as UploadedFileAsset;
}
