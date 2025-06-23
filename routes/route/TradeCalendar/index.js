/**
 * * 交易日历
 * @Function getTradeCalendar 获取交易日历数据
 * @Function saveTradeCalendar 将交易日历存入数据库
 * @Function isTradeCalendarStale 判断交易日历是否需要更新
 */

const axios = require("axios");
const { AKShareServiceURL } = require("../../../utils/constants");
const TradeCalendar = require("../../../models/TradeCalendar");


const getTradeCalendar = async () => {
    const Year = new Date().getFullYear();
    const nextYear = new Date().getFullYear() + 1;
    let tradeCalendar = [];
    try {
        const response = await axios.get(
            `${AKShareServiceURL}/tool_trade_date_hist_sina`
        );
        tradeCalendar.push(
            ...response.data.filter((item) => {
                item.trade_date = item.trade_date.split("T")[0];
                return (
                    item.trade_date.includes(Year) || item.trade_date.includes(nextYear)
                );
            })
        );
        saveTradeCalendar(tradeCalendar);
        return tradeCalendar;
    } catch (error) {
        console.error("获取交易日历数据失败:", error.message);
        return [];
    }
};

const saveTradeCalendar = async (tradeCalendar) => {
    try {
        try {
            // 先清空现有数据，避免重复
            const deleteResult = await TradeCalendar.deleteMany({});
            console.log(`已删除 ${deleteResult.deletedCount} 条交易日历数据`);

            // 使用bulkWrite批量插入，并处理可能的重复数据
            if (tradeCalendar && tradeCalendar.length > 0) {
                // 将数据转换为upsert操作
                const bulkOps = tradeCalendar.map(item => ({
                    updateOne: {
                        filter: { trade_date: item.trade_date },
                        update: { $set: item },
                        upsert: true
                    }
                }));

                const bulkResult = await TradeCalendar.bulkWrite(bulkOps);
                console.log(`交易日历数据已成功存入数据库，插入: ${bulkResult.insertedCount}, 更新: ${bulkResult.modifiedCount}, 匹配: ${bulkResult.matchedCount}`);
            } else {
                console.log("没有交易日历数据需要保存");
            }
        } catch (dbError) {
            console.error("数据库操作失败:", dbError.message);
            throw dbError; // 将错误向上抛出，以便外部catch捕获
        }
    } catch (error) {
        console.error("存入交易日历数据失败:", error.message);
    }
};

const isTradeCalendarStale = async () => {
    const lastRecord = await TradeCalendar.findOne().sort({ _id: -1 });
    if (lastRecord) {
        const lastDate = new Date(lastRecord.trade_date);
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
        return lastDate < thirtyDaysLater;
    }
    return true;
};


// * 判断现在是否是交易时段
const { tradeTimeService } = require("./tradeTimeService");
const eventBus = require("../../../utils/eventBus");
const logger = require("../../../utils/logger");

const {getTradeStatus,updateTradeStatus} = require("../../../store/state");
const tradeStatus = getTradeStatus();
logger.info(`交易状态监控已启动，初始状态: ${tradeStatus}`);

setInterval(async () => {
    try {
        const tempTradeStatus = await tradeTimeService(new Date().getTime());
        if (tempTradeStatus !== getTradeStatus()) {
            updateTradeStatus(tempTradeStatus);
            // 当交易状态发生变化时，发布事件通知所有订阅者
            const eventData = { 
                type: "tradeStatus", 
            };
            logger.info(`发布交易状态变化事件:`, JSON.stringify(eventData));
            eventBus.publish("getStatus", eventData);
        }
    } catch (error) {
        logger.error("交易状态检查失败:", error);
    }
}, 1000);

module.exports = {
    tradeStatus,
    getTradeCalendar,
    saveTradeCalendar,
    isTradeCalendarStale
};
