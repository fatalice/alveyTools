# 云托管实战示例

本项目是微信小程序纯前端项目，通过 `callContainer` 调用腾讯云开发 CloudRun 容器后端服务。

## 项目特点

- **纯前端**：无云函数目录，所有后端调用走 `callContainer` REST 接口
- **集中 API 管理**：`miniprogram/utils/api.js` 统一封装所有 `callContainer` 调用
- **展示真实后端能力**：麻将计分、用户画像、内容发布、文件上传

## 后端服务

- **服务名**：`fataliceenv`
- **envId**：`cloudenv1-d4gkp36fb4243e78c`
- **后端项目**：`../tencent-miniapp-templete`

## 功能模块

| 模块 | API | 说明 |
|---|---|---|
| 云托管 API | `/echo`, `/api/getWxContext` | callContainer 调用演示、获取用户标识 |
| 麻将计分 | `/api/mj/*` | 创建/加入房间、计分、结算 |
| 内容发布 | `/home/cards`, `/api/release` | 首页卡片、发布动态 |
| 文件上传 | `/api/upload` + `wx.cloud.uploadFile` | 双路径上传 |
| AI 接入 | Agent-UI 组件 | 大模型对话指引 |

## 参考文档

- [云托管 callContainer](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/openapi/openapi.html)
- [CloudBase 云托管](https://docs.cloudbase.net/cloudrun)
