const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * 获取东八区时间
 * @returns {Date} 东八区时间
 */
const getBeijingTime = () => {
    const now = new Date();
    // 获取UTC时间戳
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    // 东八区时间 = UTC时间 + 8小时
    return new Date(utc + (8 * 3600000));
};

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
    statisticsDate: {
        type: String,
        required: true,
        default: getBeijingTime // 默认使用东八区时间
    }, // 统计日期
}, {
    timestamps: true
});

module.exports = mongoose.model('MarketEffect', MarketEffectSchema);