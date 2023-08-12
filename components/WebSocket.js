import { WebSocketServer } from 'ws';
import Config from './Config.js';
import Init from '../model/init.js';
import Log from '../utils/logs.js';

class WebSocket {
  constructor() {
    this.WebSocket()
  }

  async WebSocket() {
    const config = await Config.getConfig();
    try {
      Init.initConfig();
      const wsServer = new WebSocketServer({
        port: config.mc_qq_ws_port,
        path: config.mc_qq_ws_url,
      });

      wsServer.on('listening', () => {
        this.sendMsg(
          `[MC_QQ]丨WebSocket 服务器已启动，路由：${config.mc_qq_ws_url}，端口：${config.mc_qq_ws_port}`
        , config);
      });

      wsServer.on('connection', (ws) => {
        this.sendMsg('[MC_QQ]丨Minecraft 已连接至 WebSocket 服务器', config);
        this.wsHandler(ws, config);
      });
    } catch (error) {
      this.sendMsg('[MC_QQ]丨WebSocket服务启动失败，请检查控制台输出', config);
      Log.e(error);
      return false;
    }
  }

  wsHandler(ws, config) {
    ws.on('message', (message) => {
      let event;
      if (message instanceof Buffer) {
        const decodedMessage = message.toString('utf8');
        event = JSON.parse(decodedMessage);
      } else {
        event = JSON.parse(message);
      }
      switch (event.event_name) {
        case 'PlayerQuitEvent':
          this.sendMsg(`${event.player.nickname} 已退出游戏`, config);
          break;
        case 'PlayerJoinEvent':
          this.sendMsg(`${event.player.nickname} 已加入游戏`, config);
          break;
        case 'PlayerDeathEvent':
          this.sendMsg(`${event.player.nickname} ${event.death_message}`, config);
          break;
        case 'AsyncPlayerChatEvent':
          this.sendMsg(`${event.player.nickname} 说 ${event.message}`, config);
          break;
      }
    });

    ws.on('close', () => {
      this.sendMsg('[MC_QQ]丨Minecraft 已断开 WebSocket 服务器', config);
    });

    ws.on('error', (error) => {
      this.sendMsg('[MC_QQ]丨Minecraft WebSocket 出现异常：' + error, config);
      Log.e(error);
    });
  }

  sendMsg(msg, config) {
    for (let i = 0; i < config.group_list.length; i++) {
      Bot.pickGroup(config.group_list[i]).sendMsg(msg);
    }
  }
}

export default new WebSocket();