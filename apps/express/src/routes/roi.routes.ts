import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { importCsv } from "../services/import.service";
import {
  queryRoiData,
  applyLinearPrediction,
  getFilterOptions,
  clearAllData,
} from "../services/roi.service";
import type {
  ApiResponse,
  RoiQueryParams,
  RoiDataPoint,
  FilterOptions,
  ImportResult,
} from "@demo-of-app-roi/shared";

const router = Router();

const isDev = process.env.NODE_ENV === "development";

/** 生产环境返回通用错误信息，开发环境返回真实 message */
function safeErrorMsg(err: unknown): string {
  if (isDev) {
    return err instanceof Error ? err.message : String(err);
  }
  console.error("[Error]", err);
  return "内部服务器错误，请稍后再试";
}

/** 日期格式校验：YYYY-MM-DD */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** 字符串字段最大长度 */
const MAX_STR_LEN = 100;

function validateQueryParams(params: Partial<RoiQueryParams>): string | null {
  for (const key of [
    "app",
    "country",
    "bid_type",
    "install_channel",
  ] as const) {
    const val = params[key];
    if (val !== undefined && val.length > MAX_STR_LEN) {
      return `参数 ${key} 长度不能超过 ${MAX_STR_LEN} 个字符`;
    }
  }
  for (const key of ["start_date", "end_date"] as const) {
    const val = params[key];
    if (val !== undefined && !DATE_RE.test(val)) {
      return `参数 ${key} 格式应为 YYYY-MM-DD`;
    }
  }
  return null;
}

const devOnly = (_req: Request, res: Response, next: NextFunction): void => {
  if (!isDev) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: "该接口仅在开发环境可用",
    };
    res.status(403).json(response);
    return;
  }
  next();
};

const upload = multer({
  dest: path.join(process.cwd(), "uploads"),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("仅支持 CSV 文件"));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

/**
 * @swagger
 * /api/roi/filters:
 *   get:
 *     summary: 获取筛选器选项
 *     tags: [ROI]
 *     responses:
 *       200:
 *         description: 筛选器选项列表
 */
router.get("/filters", async (_req: Request, res: Response) => {
  try {
    const options = await getFilterOptions();
    const response: ApiResponse<FilterOptions> = {
      success: true,
      data: options,
      error: null,
    };
    res.json(response);
  } catch (err) {
    res
      .status(500)
      .json({ success: false, data: null, error: safeErrorMsg(err) });
  }
});

/**
 * @swagger
 * /api/roi/data:
 *   get:
 *     summary: 查询 ROI 数据
 *     tags: [ROI]
 *     parameters:
 *       - in: query
 *         name: app
 *         schema: { type: string }
 *         description: 应用名称
 *       - in: query
 *         name: country
 *         schema: { type: string }
 *         description: 国家地区
 *       - in: query
 *         name: bid_type
 *         schema: { type: string }
 *         description: 出价类型
 *       - in: query
 *         name: install_channel
 *         schema: { type: string }
 *         description: 安装渠道
 *       - in: query
 *         name: start_date
 *         schema: { type: string, format: date }
 *         description: 起始日期
 *       - in: query
 *         name: end_date
 *         schema: { type: string, format: date }
 *         description: 结束日期
 *       - in: query
 *         name: predict
 *         schema: { type: boolean }
 *         description: 是否返回预测数据
 *     responses:
 *       200:
 *         description: ROI 数据列表
 */
router.get("/data", async (req: Request, res: Response) => {
  try {
    const params: RoiQueryParams = {
      app: req.query.app as string | undefined,
      country: req.query.country as string | undefined,
      bid_type: req.query.bid_type as string | undefined,
      install_channel: req.query.install_channel as string | undefined,
      start_date: req.query.start_date as string | undefined,
      end_date: req.query.end_date as string | undefined,
    };

    const validationError = validateQueryParams(params);
    if (validationError) {
      res
        .status(400)
        .json({ success: false, data: null, error: validationError });
      return;
    }

    let data = await queryRoiData(params);
    if (req.query.predict === "true") {
      data = applyLinearPrediction(data);
    }

    const response: ApiResponse<RoiDataPoint[]> = {
      success: true,
      data,
      error: null,
    };
    res.json(response);
  } catch (err) {
    res
      .status(500)
      .json({ success: false, data: null, error: safeErrorMsg(err) });
  }
});

/**
 * @swagger
 * /api/roi/import:
 *   post:
 *     summary: 导入 CSV 文件
 *     tags: [ROI]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: file
 *         type: file
 *         required: true
 *         description: CSV 文件
 *     responses:
 *       200:
 *         description: 导入结果
 */
router.post(
  "/import",
  upload.single("file"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: "请上传 CSV 文件",
      };
      res.status(400).json(response);
      return;
    }

    try {
      const result = await importCsv(req.file.path);
      const response: ApiResponse<ImportResult> = {
        success: true,
        data: result,
        error: null,
      };
      res.json(response);
    } catch (err) {
      res
        .status(500)
        .json({ success: false, data: null, error: safeErrorMsg(err) });
    } finally {
      // 清理上传的临时文件
      if (req.file?.path) {
        fs.unlink(req.file.path, () => {});
      }
    }
  },
);

/**
 * @swagger
 * /api/roi/clear:
 *   delete:
 *     summary: 清空所有 ROI 数据（仅开发环境）
 *     tags: [ROI]
 *     responses:
 *       200:
 *         description: 清空结果
 *       403:
 *         description: 非开发环境禁止访问
 */
router.delete("/clear", devOnly, async (_req: Request, res: Response) => {
  try {
    const deleted_rows = await clearAllData();
    const response: ApiResponse<{ deleted_rows: number }> = {
      success: true,
      data: { deleted_rows },
      error: null,
    };
    res.json(response);
  } catch (err) {
    res
      .status(500)
      .json({ success: false, data: null, error: safeErrorMsg(err) });
  }
});

export default router;
