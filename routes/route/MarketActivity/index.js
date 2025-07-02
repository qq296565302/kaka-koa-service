/**
 * * 市场异动
 */
const axios = require("axios");
const { AKShareServiceURL } = require("../../../utils/constants");
const MarketActivity = require("../../../models/MarketActivity");
const Router = require("koa-router");
const router = new Router();
router.prefix("/market-activity");
const activityArray = ['火箭发射', '快速反弹', '大笔买入', '60日新高', '封涨停板', '高台跳水', '加速下跌', '大笔卖出', '60日新低', '封跌停板']

/**
 * * 保存市场异动数据到数据库
 * @param {Array} marketData 市场异动数据数组
 * @returns {Object} 保存结果统计
 */
const saveMarketActivityToDb = async (marketData) => {
    let savedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    // 获取当前日期作为数据日期
    const today = new Date().toISOString().split('T')[0];

    for (const item of marketData) {
        try {
            // 构造数据库记录对象
            const activityRecord = {
                time: item['时间'],
                code: item['代码'],
                name: item['名称'],
                sector: item['板块'],
                relatedInfo: item['相关信息'],
                dataDate: today
            };

            // 检查是否存在重复数据（代码、时间、板块三者全都一致）
            const existingRecord = await MarketActivity.findOne({
                code: activityRecord.code,
                time: activityRecord.time,
                sector: activityRecord.sector
            });

            if (existingRecord) {
                duplicateCount++;
            } else {
                // 保存新数据
                await MarketActivity.create(activityRecord);
                savedCount++;
            }
        } catch (error) {
            errorCount++;
            console.error(`保存数据失败:`, error.message, item);
        }
    }

    return {
        total: marketData.length,
        saved: savedCount,
        duplicate: duplicateCount,
        error: errorCount
    };
};

/**
 * * 获取市场异动并存储到数据库
 * @param {*} symbol 
 * @returns 
 * * 数据结构：
 * {
    "时间": "10:14:43",
    "代码": "300931",
    "名称": "通用电梯",
    "板块": "60日新高",
    "相关信息": "7.490000,7.49000,0.019048"
 * }
 */
const getMarketActivity = async (symbol) => {
    try {
        const response = await axios.get(
            `${AKShareServiceURL}/stock_changes_em?symbol=${symbol}`
        );
        const marketData = response.data;

        // 如果有数据，则保存到数据库
        if (marketData && marketData.length > 0) {
            const saveResult = await saveMarketActivityToDb(marketData);
            console.log(`市场异动数据保存结果:`, saveResult);
        }

        return marketData;
    } catch (error) {
        console.error("获取市场异动数据失败:", error.message);
        return {
            data: [],
            pagination: {
                page: 1,
                limit: 20,
                total: 0,
                totalPages: 0,
                hasNextPage: false,
                hasPrevPage: false
            }
        };
    }
}

/**
 * * 根据板块查询当天的市场异动数据（支持分页）
 * * @param {string} symbol 板块名称，支持多个值用逗号分隔，如："60日新高,涨速榜"
 * * @param {number} page 页码，从1开始，默认为1
 * * @param {number} limit 每页数量，默认为20
 * * @returns {Object} 包含数据和分页信息的对象
 */
const findMarketActivity = async (symbol, page = 1, limit = 20) => {
    try {
        let query = {};

        // 获取当天日期字符串（东八区时间）
        const now = new Date();
        const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // 转换为东八区时间
        const todayDateString = beijingTime.toISOString().split('T')[0]; // 格式：YYYY-MM-DD

        // 添加日期过滤条件，只查询当天的数据（使用dataDate字段）
        query.dataDate = todayDateString;

        if (symbol && symbol.trim() !== '') {
            // 检查symbol是否包含逗号分隔的多个值
            if (symbol.includes(',')) {
                // 分割字符串并去除空格
                const sectors = symbol.split(',').map(s => s.trim()).filter(s => s !== '');
                // 使用$in操作符查询多个sector值
                query.sector = { $in: sectors };
                console.log(`查询当天多个板块: ${sectors.join(', ')}`);
            } else {
                // 单个值查询
                query.sector = symbol.trim();
                console.log(`查询当天单个板块: ${symbol.trim()}`);
            }
        } else {
            // 如果symbol为空，返回当天所有数据
            console.log('查询当天所有市场异动数据');
        }

        // 计算分页参数
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.max(1, parseInt(limit) || 20);
        const skip = (pageNum - 1) * limitNum;

        console.log(`查询当天日期: ${todayDateString}, 页码: ${pageNum}, 每页: ${limitNum}`);
        
        // 获取总数
        const total = await MarketActivity.countDocuments(query);
        
        // 分页查询数据
        const marketData = await MarketActivity.find(query)
            .sort({ createTime: -1 })
            .skip(skip)
            .limit(limitNum);
        
        // 计算分页信息
        const totalPages = Math.ceil(total / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;
        
        console.log(`找到 ${total} 条当天市场异动数据，当前页 ${pageNum}/${totalPages}，返回 ${marketData.length} 条`);
        
        return {
            data: marketData,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: total,
                totalPages: totalPages,
                hasNextPage: hasNextPage,
                hasPrevPage: hasPrevPage
            }
        };
    } catch (error) {
        console.error("获取市场异动数据失败:", error.message);
        return [];
    }
}


async function processMarketActivity(array) {
    for (const item of array) {
        try {
            await getMarketActivity(item);
        } catch (error) {
            console.error(`请求失败: ${item}`, error);
        }
    }
}

/**
 * * 定时获取和保存市场异动数据
 * * 每0.5分钟获取一次
 */
const { getTradeStatus } = require("../../../store/state");
setInterval(async () => {
    const state = getTradeStatus();
    if (state === 1) {
        await processMarketActivity(activityArray);
    }
}, 1000 * 60 * 0.5); // 每0.5分钟获取一次


router.get("/list", async (ctx) => {
    const { symbol, page, limit } = ctx.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    const result = await findMarketActivity(symbol, pageNum, limitNum);
    
    ctx.body = {
        code: 200,
        data: result.data,
        count: result.data.length,
        pagination: result.pagination
    };
});


// 导出函数
module.exports = {
    getMarketActivity,
    saveMarketActivityToDb,
    findMarketActivity,
    routes: function () {
        return router.routes();
    },
    allowedMethods: function () {
        return router.allowedMethods();
    }
};
