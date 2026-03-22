import { UploadOutlined } from "@ant-design/icons";
import { Button, Progress, Typography, Upload, message } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import { useState } from "react";
import { uploadFileAsset } from "@/features/files/fileAssetsApi";
import { parseApiError } from "@/utils/platform";

type UploadedAsset = {
  id: number;
  file_url?: string;
  original_name?: string;
  mime_type?: string;
  size_bytes?: number;
};

type Props = {
  purpose: string;
  onUploaded: (asset: UploadedAsset) => void;
  accept?: string;
  buttonLabel?: string;
  helperText?: string;
};

export default function FileAssetUploader({
  purpose,
  onUploaded,
  accept = ".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.txt",
  buttonLabel = "Upload File",
  helperText,
}: Props) {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  return (
    <div className="space-y-3">
      <Upload
        maxCount={1}
        accept={accept}
        beforeUpload={(file) => {
          setFileList([
            {
              uid: file.uid,
              name: file.name,
              status: "done",
              originFileObj: file,
            },
          ]);
          return false;
        }}
        onRemove={() => {
          setFileList([]);
          setProgress(0);
        }}
        fileList={fileList}
      >
        <Button icon={<UploadOutlined />} className="!rounded-2xl">
          {buttonLabel}
        </Button>
      </Upload>

      {helperText ? <Typography.Text className="!text-white/55 !text-sm">{helperText}</Typography.Text> : null}

      {uploading ? <Progress percent={progress} strokeColor="#f97316" trailColor="rgba(255,255,255,0.1)" /> : null}

      <Button
        type="primary"
        className="!rounded-2xl !bg-[var(--cv-accent)] !border-0"
        disabled={!fileList[0]?.originFileObj}
        loading={uploading}
        onClick={async () => {
          const file = fileList[0]?.originFileObj;
          if (!file) return;

          setUploading(true);
          setProgress(0);

          try {
            const response = await uploadFileAsset({
              purpose,
              file,
              onProgress: (percent) => {
                setProgress(percent);
              },
            });

            onUploaded(response as UploadedAsset);
            message.success("File uploaded");
            setFileList([]);
            setProgress(100);
          } catch (error) {
            message.error(parseApiError(error, "File upload failed"));
          } finally {
            setUploading(false);
          }
        }}
      >
        Save Upload
      </Button>
    </div>
  );
}
