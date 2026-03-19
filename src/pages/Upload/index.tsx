import { Button, Card, Typography, Upload as AntUpload, message } from "antd";
import type { UploadProps } from "antd";
import { useParams } from "react-router-dom";
import { api } from "@/services/api";

export default function Upload() {
  const { lotId } = useParams();

  const props: UploadProps = {
    beforeUpload: async (file) => {
      try {
        const form = new FormData();
        form.append("file", file);
        if (lotId) form.append("lot_id", lotId);

        await api.lotDetails(form);
        message.success("Uploaded");
      } catch (e: any) {
        message.error(e?.response?.data?.detail ?? "Upload failed");
      }
      return false;
    },
    multiple: false,
    showUploadList: true,
  };

  return (
    <div className="space-y-4">
      <Typography.Title level={3} className="!mb-0">
        Upload {lotId ? `(${lotId})` : ""}
      </Typography.Title>

      <Card>
        <AntUpload.Dragger {...props}>
          <div className="py-6">
            <Typography.Text strong>Drop a file here</Typography.Text>
            <div className="text-slate-500 mt-1">or click to select</div>
            <div className="mt-4">
              <Button type="primary">Select file</Button>
            </div>
          </div>
        </AntUpload.Dragger>
      </Card>
    </div>
  );
}

