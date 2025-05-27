const mongoose = require('mongoose');

// 定义交易日历的Schema
const tradeCalendarSchema = new mongoose.Schema({
  trade_date: {
    type: String,
    required: true,
    unique: true
  },
  weekday: {
    type: String
  }
}, {
  // 允许Schema包含其他字段
  strict: false,
  // 添加创建和更新时间戳
  timestamps: true
});

// 创建并导出模型
const TradeCalendar = mongoose.model('TradeCalendar', tradeCalendarSchema);

module.exports = TradeCalendar;
