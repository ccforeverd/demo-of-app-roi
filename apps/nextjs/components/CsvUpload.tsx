import React, { useRef } from "react";
import { uploadCsv } from "../lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useToastStore } from "../store/useToastStore";
import { useState } from "react";

export function CsvUpload() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const result = await uploadCsv(file);
      addToast(
        `数据已加载！共 ${result.total_rows} 行, 导入 ${result.imported_rows} 行${result.skipped_rows > 0 ? `, 跳过 ${result.skipped_rows} 行` : ""}`,
        "success",
      );
      await queryClient.invalidateQueries({ queryKey: ["roiData"] });
      await queryClient.invalidateQueries({ queryKey: ["filters"] });
    } catch (err) {
      addToast(
        `导入失败: ${err instanceof Error ? err.message : "未知错误"}`,
        "error",
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors
          ${
            uploading
              ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
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
    </div>
  );
}
