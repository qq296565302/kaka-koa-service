/**
 * 响应处理中间件
 * 该中间件用于统一处理 HTTP 请求的响应
 * @param {Object} ctx - Koa 上下文对象
 * @param {Function} next - 调用下一个中间件的函数
 * @returns {Promise} - 返回处理完成的 Promise
 */
module.exports = async (ctx, next) => {
  try {
    // 执行下一个中间件
    await next();

    // 判断返回内容是否已经设置
    if (ctx.body) {
      // 如果已经设置，则包装成统一的格式
      ctx.body = {
        code: 200, // 成功状态码
        message: 'success',
        data: ctx.body
      };
    } else {
      // 如果没有返回数据，则返回一个默认的响应
      ctx.body = {
        code: 0,
        message: 'no content',
        data: []
      };
    }
  } catch (err) {
    // 捕获异常并统一返回错误格式
    ctx.status = err.status || 500;
    ctx.body = {
      code: err.status || 500,
      message: err.message || 'Internal Server Error',
      data: null
    };
    // 将错误抛给全局处理
    ctx.app.emit('error', err, ctx);
  }
};
