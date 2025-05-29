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
    },
    // 版本号，用来更新股票基本信息的判断
    version: {
        type: Number,
        default: 0,
        comment: '版本号'
    },
    // 前缀，根据symbol的前缀来判断是沪市还是深市
    prefix: {
        type: String,
        default: '',
        comment: '前缀'
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
