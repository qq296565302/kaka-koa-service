const mongoose = require('mongoose');

/**
 * 市场异动数据模型
 * 用于存储股票市场异动信息
 */
const marketActivitySchema = new mongoose.Schema({
    // 时间
    time: {
        type: String,
        required: true,
        comment: '异动时间，格式如：10:14:43'
    },
    // 代码
    code: {
        type: String,
        required: true,
        comment: '股票代码'
    },
    // 名称
    name: {
        type: String,
        required: true,
        comment: '股票名称'
    },
    // 板块
    sector: {
        type: String,
        required: true,
        comment: '板块信息，如：60日新高'
    },
    // 相关信息
    relatedInfo: {
        type: String,
        comment: '相关信息，如价格等数据'
    },
    // 创建时间
    createTime: {
        type: Date,
        default: Date.now,
        comment: '数据创建时间'
    },
    // 数据日期（用于按日期查询）
    dataDate: {
        type: String,
        required: true,
        comment: '数据日期，格式：YYYY-MM-DD'
    }
});

// 创建复合索引，用于去重判断（代码、时间、板块三者组合唯一）
marketActivitySchema.index({ code: 1, time: 1, sector: 1 }, { unique: true });

// 创建其他索引以提高查询性能
marketActivitySchema.index({ dataDate: 1 });
marketActivitySchema.index({ code: 1 });
marketActivitySchema.index({ sector: 1 });

// 创建并导出模型
const MarketActivity = mongoose.model('MarketActivity', marketActivitySchema);

module.exports = MarketActivity;