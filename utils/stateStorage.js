/**
 * 状态存储工具
 * 用于持久化应用状态到文件系统
 */
const fs = require('fs');
const path = require('path');

// 状态文件路径
const STATE_FILE_PATH = path.join(__dirname, '../data/appState.json');

// 确保目录存在
const ensureDirectoryExists = (filePath) => {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    fs.mkdirSync(dirname, { recursive: true });
};

/**
 * 保存状态到文件
 * @param {Object} state - 要保存的状态对象
 */
const saveState = (state) => {
    try {
        ensureDirectoryExists(STATE_FILE_PATH);
        fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2));
        return true;
    } catch (error) {
        console.error('保存状态失败:', error);
        return false;
    }
};

/**
 * 从文件加载状态
 * @returns {Object} 加载的状态对象，如果文件不存在则返回空对象
 */
const loadState = () => {
    try {
        if (fs.existsSync(STATE_FILE_PATH)) {
            const data = fs.readFileSync(STATE_FILE_PATH, 'utf8');
            return JSON.parse(data);
        }
        return {};
    } catch (error) {
        console.error('加载状态失败:', error);
        return {};
    }
};

module.exports = {
    saveState,
    loadState
};
