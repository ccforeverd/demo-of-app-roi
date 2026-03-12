CREATE DATABASE IF NOT EXISTS app_roi
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE app_roi;

CREATE TABLE IF NOT EXISTS roi_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL COMMENT '数据日期',
  app VARCHAR(50) NOT NULL COMMENT '应用名称',
  bid_type VARCHAR(20) NOT NULL COMMENT '出价类型 (CPI等)',
  country VARCHAR(50) NOT NULL COMMENT '国家地区',
  install_channel VARCHAR(50) NOT NULL DEFAULT 'Apple' COMMENT '用户安装渠道',
  install_count INT NOT NULL DEFAULT 0 COMMENT '应用安装总次数',

  -- ROI 各维度: NULL 表示日期不足无数据, 0 表示真实的 0%
  roi_d0  DECIMAL(10,4) NULL COMMENT '当日ROI (百分比值, 如 6.79 表示 6.79%)',
  roi_d1  DECIMAL(10,4) NULL COMMENT '1日ROI',
  roi_d3  DECIMAL(10,4) NULL COMMENT '3日ROI',
  roi_d7  DECIMAL(10,4) NULL COMMENT '7日ROI',
  roi_d14 DECIMAL(10,4) NULL COMMENT '14日ROI',
  roi_d30 DECIMAL(10,4) NULL COMMENT '30日ROI',
  roi_d60 DECIMAL(10,4) NULL COMMENT '60日ROI',
  roi_d90 DECIMAL(10,4) NULL COMMENT '90日ROI',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_date_app_bid_country_channel (date, app, bid_type, country, install_channel),
  INDEX idx_app (app),
  INDEX idx_country (country),
  INDEX idx_date (date),
  INDEX idx_bid_type (bid_type),
  INDEX idx_install_channel (install_channel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='应用 ROI 数据表';
