const mongoose = require('mongoose');

// 定义股票信息的Schema
const stockInfoSchema = new mongoose.Schema({
  // 股票代码
  symbol: {
    type: String,
    required: true,
    unique: true,
    comment: '股票代码'
  },
  // 股票名称
  name: {
    type: String,
    required: true,
    comment: '股票名称'
  },
  // 最新价
  latestPrice: {
    type: Number,
    comment: '最新价格'
  },
  // 涨跌幅
  changePercent: {
    type: Number,
    comment: '涨跌幅(%)'
  },
  // 涨跌额
  changeAmount: {
    type: Number,
    comment: '涨跌额'
  },
  // 成交量
  volume: {
    type: Number,
    comment: '成交量(手)'
  },
  // 成交额
  turnover: {
    type: Number,
    comment: '成交额(元)'
  },
  // 振幅
  amplitude: {
    type: Number,
    comment: '振幅(%)'
  },
  // 最高价
  highPrice: {
    type: Number,
    comment: '最高价'
  },
  // 最低价
  lowPrice: {
    type: Number,
    comment: '最低价'
  },
  // 今日开盘价
  openPrice: {
    type: Number,
    comment: '今日开盘价'
  },
  // 昨日收盘价
  prevClosePrice: {
    type: Number,
    comment: '昨日收盘价'
  },
  // 量比
  volumeRatio: {
    type: Number,
    comment: '量比'
  },
  // 换手率
  turnoverRate: {
    type: Number,
    comment: '换手率(%)'
  },
  // 市盈率(动态)
  peDynamic: {
    type: Number,
    comment: '市盈率(动态)'
  },
  // 市净率
  pbRatio: {
    type: Number,
    comment: '市净率'
  },
  // 总市值
  totalMarketValue: {
    type: Number,
    comment: '总市值(元)'
  },
  // 流通市值
  circulationMarketValue: {
    type: Number,
    comment: '流通市值(元)'
  },
  // 涨速
  changeSpeed: {
    type: Number,
    comment: '涨速(%)'
  },
  // 5分钟涨跌
  fiveMinuteChange: {
    type: Number,
    comment: '5分钟涨跌(%)'
  },
  // 60日涨跌幅
  sixtyDayChange: {
    type: Number,
    comment: '60日涨跌幅(%)'
  },
  // 年初至今涨跌幅
  ytdChange: {
    type: Number,
    comment: '年初至今涨跌幅(%)'
  },
  // 更新时间
  updateTime: {
    type: Date,
    default: Date.now,
    comment: '数据更新时间'
  }
}, {
  // 允许Schema包含其他字段
  strict: false,
  // 添加创建和更新时间戳
  timestamps: true
});

// 创建索引以提高查询性能
// symbol字段已通过unique: true自动创建索引
stockInfoSchema.index({ name: 1 });

// 创建并导出模型
const StockInfo = mongoose.model('StockInfo', stockInfoSchema);

module.exports = StockInfo;
