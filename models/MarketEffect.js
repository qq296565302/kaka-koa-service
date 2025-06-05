const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MarketEffectSchema = new Schema({
    rise: { type: Number, required: true }, // 上涨
    limitUp: { type: Number, required: true }, // 涨停
    realLimitUp: { type: Number, required: true }, // 真实涨停
    stLimitUp: { type: Number, required: true }, // st st*涨停
    fall: { type: Number, required: true }, // 下跌
    limitDown: { type: Number, required: true }, // 跌停
    realLimitDown: { type: Number, required: true }, // 真实跌停
    stLimitDown: { type: Number, required: true }, // st st*跌停
    flat: { type: Number, required: true }, // 平盘
    suspended: { type: Number, required: true }, // 停牌
    activity: { type: String, required: true }, // 活跃度
    statisticsDate: { type: Date, required: true } // 统计日期
}, {
    timestamps: true // 添加 createdAt 和 updatedAt 字段
});

module.exports = mongoose.model('MarketEffect', MarketEffectSchema);