import React, { useRef, useState } from "react";
import { uploadCsv } from "../lib/api";
import { useQueryClient } from "@tanstack/react-query";

export function CsvUpload() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const queryClient = useQueryClient();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    try {
      const result = await uploadCsv(file);
      setMessage({
        type: "success",
        text: `导入成功: 共 ${result.total_rows} 行, 导入 ${result.imported_rows} 行${result.skipped_rows > 0 ? `, 跳过 ${result.skipped_rows} 行` : ""}`,
      });
      await queryClient.invalidateQueries({ queryKey: ["roiData"] });
      await queryClient.invalidateQueries({ queryKey: ["filters"] });
    } catch (err) {
      setMessage({
        type: "error",
        text: `导入失败: ${err instanceof Error ? err.message : "未知错误"}`,
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-lg text-muted-foreground">暂无数据</p>
      <label
        className={`inline-flex cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors
          ${
            uploading
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
      >
        {uploading ? "导入中..." : "上传 CSV 文件"}
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          disabled={uploading}
          onChange={handleUpload}
        />
      </label>
      {message && (
        <p
          className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-500"}`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
