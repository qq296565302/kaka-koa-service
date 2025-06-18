const TradeCalendar = require("../../../models/TradeCalendar");


/**
 * * 判断当前时间是否是交易时间
 * @param {number} currentTimestamp - 当前时间戳（毫秒）
 * @returns {Promise<Number>} 0 休市 1 正在交易 2 已收盘 3 未开盘 4 午间休市
 */
const tradeTimeService = async (currentTimestamp) => {
    // * 判断今天是否是交易日 *
    const isTradingDay = await isTodayTradingDay();
    if (!isTradingDay) {
        return 0; // 非交易日，休市
    }

    return isInTradeTime(currentTimestamp);
}

/**
 * 判断今天是否是交易日
 * @returns {Promise<boolean>} 是否为交易日
 */
const isTodayTradingDay = async () => {
    const today = new Date().toISOString().split("T")[0];
    const record = await TradeCalendar.findOne({ trade_date: today });
    return record !== null;
};

const dayjs = require("dayjs");

/**
 * 判断当前时间是否在交易时段内
 * A股交易时段：上午9:30-11:30，下午13:00-15:00
 * 交易状态逻辑：
 * 1. 判断当前日期是否为交易日
 *    - 不是交易日：状态设为'0'（今日休市），并更新最近交易日信息
 *    - 是交易日：继续判断当前时间
 *
 * 2. 对于交易日，根据时间判断具体状态：
 *    - 早于9:30：状态设为'3'（未到开盘时间）
 *    - 在交易时段内(9:30-11:30或13:00-15:00)：状态设为'1'（正在交易中）
 *    - 中午休市时段(11:30-13:00)：状态设为'4'（午间休市）
 *    - 其他时间：状态设为'2'（当日已收盘），并记录最近一次交易结束时间
 * @param {number} currentTimestamp - 当前时间戳（毫秒）
 * @returns {Number} 0 休市 1 正在交易 2 已收盘 3 未开盘 4 午间休市
 */
const isInTradeTime = (currentTimestamp) => {
    const currentTime = dayjs(currentTimestamp);
    
    // 定义当日的交易时间段
    const morningStart = dayjs(currentTimestamp).hour(9).minute(30).second(0).millisecond(0);
    const morningEnd = dayjs(currentTimestamp).hour(11).minute(30).second(0).millisecond(0);
    const afternoonStart = dayjs(currentTimestamp).hour(13).minute(0).second(0).millisecond(0);
    const afternoonEnd = dayjs(currentTimestamp).hour(15).minute(0).second(0).millisecond(0);

    // 按时间顺序判断交易状态
    if (currentTime.isBefore(morningStart)) {
        // 早于9:30，未开盘
        return 3;
    } else if (
        (currentTime.isSame(morningStart) || currentTime.isAfter(morningStart)) &&
        currentTime.isBefore(morningEnd)
    ) {
        // 上午交易时段：9:30-11:30（包含9:30，不包含11:30）
        return 1;
    } else if (
        (currentTime.isSame(morningEnd) || currentTime.isAfter(morningEnd)) &&
        currentTime.isBefore(afternoonStart)
    ) {
        // 中午休市时段：11:30-13:00（包含11:30，不包含13:00）
        return 4;
    } else if (
        (currentTime.isSame(afternoonStart) || currentTime.isAfter(afternoonStart)) &&
        currentTime.isBefore(afternoonEnd)
    ) {
        // 下午交易时段：13:00-15:00（包含13:00，不包含15:00）
        return 1;
    } else {
        // 15:00之后，当日已收盘
        return 2;
    }
};
module.exports = {
    tradeTimeService,
    isInTradeTime
};