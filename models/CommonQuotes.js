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

const CommonQuotesSchema = new Schema({
    代码: { type: String, required: true }, // 股票代码
    名称: { type: String, required: true }, // 股票名称
    最新价: { type: Number, required: true }, // 最新价格
    涨跌幅: { type: Number, required: true }, // 涨跌幅
    涨跌额: { type: Number, required: true }, // 涨跌额
    成交量: { type: Number, required: true }, // 成交量
    成交额: { type: Number, required: true }, // 成交额
    振幅: { type: Number, required: true }, // 振幅
    最高: { type: Number, required: true }, // 最高价
    最低: { type: Number, required: true }, // 最低价
    今开: { type: Number, required: true }, // 今日开盘价
    昨收: { type: Number, required: true }, // 昨日收盘价
    量比: { type: Number, required: true }, // 量比
    createdAt: {
        type: Date,
        default: getBeijingTime
    },
    updatedAt: {
        type: Date,
        default: getBeijingTime
    }
}, {
    timestamps: false // 使用自定义的时间字段
});

// 添加中间件确保更新时使用北京时间
CommonQuotesSchema.pre('save', function(next) {
    this.updatedAt = getBeijingTime();
    if (this.isNew) {
        this.createdAt = getBeijingTime();
    }
    next();
});

CommonQuotesSchema.pre(['updateOne', 'findOneAndUpdate'], function(next) {
    this.set('updatedAt', getBeijingTime());
    next();
});

module.exports = mongoose.model('CommonQuotes', CommonQuotesSchema);