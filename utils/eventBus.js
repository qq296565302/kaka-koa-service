class EventBus {
  constructor() {
    // 使用对象来存储订阅者，键是事件类型，值是该事件的回调函数数组
    this.subscribers = {};
    // 通讯录：每个人名（事件类型）对应一组电话号码（回调函数）
  }


  subscribe(eventType, callback) {
    // 如果还没有人订阅过这类事件，先初始化一个空数组
    if (!this.subscribers[eventType]) {
      this.subscribers[eventType] = [];
      // 通讯录里新增一个联系人
    }
    
    // 把回调函数加入对应事件类型的数组
    this.subscribers[eventType].push(callback);
    // 这个联系人添加一个新的电话号码
    
    // 返回一个取消订阅的函数
    return () => {
      this.subscribers[eventType] = this.subscribers[eventType].filter(
        subscriber => subscriber !== callback
      );
      // 从通讯录里删除这个电话号码
    };
  }


  publish(eventType, data) {
    // 如果没人订阅这类事件，直接返回
    if (!this.subscribers[eventType]) {
      return;
      // 打电话发现这个联系人不存在
    }
    
    // 遍历所有订阅了该事件的回调函数
    this.subscribers[eventType].forEach(callback => {
      try {
        // 执行回调并传入数据
        callback(data);
        // 给这个联系人的每个电话号码都打一遍
      } catch (error) {
        // 优雅的错误处理，一个回调出错不影响其他回调
        console.error(`事件处理器错误 (${eventType}):`, error);
        // 就像某个电话打不通，但其他电话还能继续打
      }
    });
  }


  clear(eventType) {
    // 清除特定事件类型的所有订阅
    if (eventType) {
      delete this.subscribers[eventType];
      // 删除整个联系人
    } else {
      // 或者清除所有订阅
      this.subscribers = {};
      // 清空整个通讯录
    }
  }
}


// 创建单例实例
const eventBus = new EventBus();

module.exports = eventBus;
