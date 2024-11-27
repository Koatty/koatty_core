import assert from "assert";
import { KoattyContext } from "../src/IContext";
import { App } from "./app";
const http = require('http');

describe("Context", () => {
  let app = new App();
  let ctx: KoattyContext;
  beforeAll(() => {
    jest.useFakeTimers();
    // Mock IncomingMessage
    jest.mock('http', () => ({
      IncomingMessage: jest.fn().mockImplementation(() => ({
        url: '/',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        on: jest.fn(),  // mock event handler
        setEncoding: jest.fn(),
      })),
    }));
    const request = new http.IncomingMessage();
    ctx = app.createContext(request, new http.ServerResponse(request));
    // ctx.set = jest.fn();
    // koatty context
    ctx.setMetaData("aa", "bb")
  })

  afterAll(done => {
    done();
    jest.clearAllMocks();
  });
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
    ctx.setMetaData("bb", "11")
    assert.equal(ctx.getMetaData("bb"), "11")
  })

  test("sendMetadata", async () => {
    ctx.sendMetadata();
    assert.equal(ctx.res.getHeader("aa"), "bb")
  })

  test("throw", async () => {
    expect(() => ctx.throw(404, 'Not Found')).toThrow('Not Found');
  })
})