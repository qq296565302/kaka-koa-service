const state = {
    tradeStatus: 0, // * 0: "休市",1: "正在交易",2: "已收盘",3: "未开盘",4: "午间休市"
}

module.exports = {
    getTradeStatus: () => {
        return state.tradeStatus;
    },
    updateTradeStatus: (status) => {
        console.log(`交易状态更新: ${state.tradeStatus} -> ${status}`);
        state.tradeStatus = status;
    }
}