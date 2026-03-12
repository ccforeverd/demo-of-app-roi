import fs from "fs";
import csvParser from "csv-parser";
import pool from "../db/pool";
import { DEFAULT_INSTALL_CHANNEL, ROI_PERIODS } from "@demo-of-app-roi/shared";
import type { ImportResult } from "@demo-of-app-roi/shared";

interface CsvRow {
  日期: string;
  app: string;
  出价类型: string;
  国家地区: string;
  "应用安装.总次数": string;
  当日ROI: string;
  "1日ROI": string;
  "3日ROI": string;
  "7日ROI": string;
  "14日ROI": string;
  "30日ROI": string;
  "60日ROI": string;
  "90日ROI": string;
}

/** 解析日期: "2025-04-13(日)" → "2025-04-13" */
function parseDate(raw: string): string {
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!match) throw new Error(`无法解析日期: ${raw}`);
  return match[1];
}

/** 解析百分比: "6.79%" → 6.79, "1,280.47%" → 1280.47 */
function parsePercent(raw: string): number {
  const cleaned = raw.replace(/,/g, "").replace(/%$/, "").trim();
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

/** 读取并解析 CSV 文件 */
function readCsv(filePath: string): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    const rows: CsvRow[] = [];
    fs.createReadStream(filePath)
      .pipe(
        csvParser({
          mapHeaders: ({ header }: { header: string }) =>
            header.replace(/^\uFEFF/, ""),
        }),
      )
      .on("data", (row: CsvRow) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

/**
 * 判断某个 ROI 维度是否为"日期不足导致的0%"
 * 规则: install_count > 0 且 roi == 0 且 date + period > maxDate
 */
function isInsufficientData(
  date: string,
  period: number,
  roiValue: number,
  installCount: number,
  maxDate: string,
): boolean {
  if (installCount === 0) return false; // 安装量=0 时, 0% 是真实的
  if (roiValue !== 0) return false; // 非零值一定是真实数据
  const d = new Date(date);
  d.setDate(d.getDate() + period);
  return d > new Date(maxDate);
}

/** 导入 CSV 文件到数据库 */
export async function importCsv(filePath: string): Promise<ImportResult> {
  const rows = await readCsv(filePath);
  if (rows.length === 0) {
    return { total_rows: 0, imported_rows: 0, skipped_rows: 0, errors: [] };
  }

  // 获取数据集中的最大日期
  const dates = rows.map((r) => parseDate(r.日期));
  const maxDate = dates.reduce((a, b) => (a > b ? a : b));

  const roiFields = [
    "当日ROI",
    "1日ROI",
    "3日ROI",
    "7日ROI",
    "14日ROI",
    "30日ROI",
    "60日ROI",
    "90日ROI",
  ] as const;
  const errors: string[] = [];
  let imported = 0;
  let skipped = 0;

  const sql = `
    INSERT INTO roi_data (date, app, bid_type, country, install_channel, install_count,
      roi_d0, roi_d1, roi_d3, roi_d7, roi_d14, roi_d30, roi_d60, roi_d90)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      install_count = VALUES(install_count),
      roi_d0 = VALUES(roi_d0), roi_d1 = VALUES(roi_d1),
      roi_d3 = VALUES(roi_d3), roi_d7 = VALUES(roi_d7),
      roi_d14 = VALUES(roi_d14), roi_d30 = VALUES(roi_d30),
      roi_d60 = VALUES(roi_d60), roi_d90 = VALUES(roi_d90)
  `;

  // 批量插入, 每 100 行一批
  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const row of batch) {
        try {
          const date = parseDate(row.日期);
          const installCount =
            parseInt(row["应用安装.总次数"].replace(/,/g, ""), 10) || 0;
          const roiValues = roiFields.map((field, idx) => {
            const val = parsePercent(row[field]);
            const period = ROI_PERIODS[idx];
            return isInsufficientData(date, period, val, installCount, maxDate)
              ? null
              : val;
          });

          await conn.execute(sql, [
            date,
            row.app,
            row.出价类型,
            row.国家地区,
            DEFAULT_INSTALL_CHANNEL,
            installCount,
            ...roiValues,
          ]);
          imported++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`Row ${i + batch.indexOf(row) + 1}: ${msg}`);
          skipped++;
        }
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Batch ${i / batchSize + 1}: ${msg}`);
      skipped += batch.length;
    } finally {
      conn.release();
    }
  }

  return {
    total_rows: rows.length,
    imported_rows: imported,
    skipped_rows: skipped,
    errors,
  };
}
