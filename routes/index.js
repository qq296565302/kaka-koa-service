const Router = require("koa-router");
const router = new Router();
const path = require("path");
const context = require("../utils/AutoLoadFile");

/**
 * @param {Array} arr 需要注册路由的文件列表
 */
function importAll(arr) {
  arr.forEach((key) => {
    try {
      // 处理不同的导出格式
      if (key.data && typeof key.data.routes === 'function' && typeof key.data.allowedMethods === 'function') {
        // 直接导出包含 routes 和 allowedMethods 方法的对象
        router.use("/api", key.data.routes(), key.data.allowedMethods());
      } else if (key.data && typeof key.data === 'object' && key.data.routes) {
        // 导出的对象中包含 routes 属性
        router.use("/api", key.data.routes(), key.data.allowedMethods());
      } else if (key.data && typeof key.data.routes === 'function') {
        // 导出的对象中包含 routes 方法
        router.use("/api", key.data.routes());
      } else if (key.data && typeof key.data.prefix === 'string' && typeof key.data.routes === 'function') {
        // 导出的对象中包含 prefix 和 routes 属性
        router.use("/api" + key.data.prefix, key.data.routes(), key.data.allowedMethods());
      } else if (key.data && typeof key.data.routes === 'function' && !key.data.allowedMethods) {
        // 导出的对象中只有 routes 方法
        router.use("/api", key.data.routes());
      } else {
        // 跳过不符合格式的路由文件
      }
    } catch (err) {
      console.error(`加载路由文件 ${key.path} 时出错:`, err);
    }
  });
}
importAll(context(path.join(__dirname, "./route"), true));

module.exports = router;
