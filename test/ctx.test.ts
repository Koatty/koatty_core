import assert from "assert";
import { IncomingMessage, ServerResponse } from "http";
import { KoattyContext } from "../src/IContext";
import { App } from "./app";
let app = new App();

let ctx: KoattyContext;
describe("Context", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    const request = {
      method: 'GET',
      url: '/',
      // query: {},
      headers: {},
    } as IncomingMessage;
    ctx = app.createContext(request, new ServerResponse(request));
    // koatty context
    ctx.setMetaData("aa", "bb")
  })

  afterAll(() => {
    jest.clearAllMocks();
  })
  test("protocol", async () => {
    assert.equal(ctx.protocol, "http")
  })

  test("throw", async () => {
    assert.equal(typeof ctx.throw, "function")
  })

  test("getMetaData", async () => {
    assert.equal(ctx.getMetaData("aa"), "bb")
  })

  test("setMetaData", async () => {
    ctx.setMetaData("aa", "11")
    assert.equal(ctx.getMetaData("aa"), "11")
  })

  test("sendMetadata", async () => {
    ctx.sendMetadata();
    assert.equal(ctx.get("aa"), "11")
  })
})