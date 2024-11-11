/*
 * @Description: 
 * @Usage: 
 * @Author: richen
 * @Date: 2024-11-08 09:54:42
 * @LastEditTime: 2024-11-11 11:45:41
 * @License: BSD (3-Clause)
 * @Copyright (c): <richenlin(at)gmail.com>
 */
import assert from 'assert';
import request from 'supertest';
import { App } from "./app";

let app: App;
describe("App", () => {
  beforeAll(() => {
    app = new App();
    app.use(async (ctx: any) => {
      ctx.body = 'Hello, World!';
    });
  })
  test("getMetaData", async () => {
    assert.equal(app.getMetaData("aa"), "bb")
  })

  test("setMetaData", async () => {
    app.setMetaData("aa", "11")
    assert.equal(app.getMetaData("aa"), "11")
  })

  test("use", async () => {
    app.use(() => {
      return (ctx: any, next: any) => {
        return null;
      }
    })
    assert.equal(app.middleware.length, 2)
  })

  test("config", async () => {
    app.setMetaData("_configs", { config: { "aa": 1 } })
    assert.equal(app.config("aa"), 1)
  })

  test("response", async () => {
    const res = await request(app.callback()).get('/'); // 发起 GET 请求
    // 测试响应
    expect(res.text).toBe('Hello, World!');
    expect(res.status).toBe(200);
  }, 600000)
})