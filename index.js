module.exports = MiddlewareBase => class RequestMonitor extends MiddlewareBase {
  middleware () {
    let requestId = 1
    return async (ctx, next) => {
      ctx.state.requestId = requestId++
      const reqInfo = {
        socketId: ctx.req.socket.id,
        requestId: ctx.state.requestId,
        method: ctx.req.method,
        url: ctx.req.url,
        headers: ctx.req.headers
      }
      if (ctx.request.body) reqInfo.data = ctx.request.body
      this.emit('verbose', 'server.request', reqInfo)

      await next()
      const resInfo = {
        socketId: ctx.req.socket.id,
        requestId: ctx.state.requestId,
        statusCode: ctx.res.statusCode
      }
      const headers = (ctx.res.getHeaders && ctx.res.getHeaders()) || ctx.res._headers
      if (headers) resInfo.headers = headers
      if (ctx.body) resInfo.data = ctx.body

      const stream = require('stream')
      const util = require('util')
      if (resInfo.data instanceof stream.Readable) {
        resInfo.data[util.inspect.custom] = function (depth, options) {
          return options.stylize(`[ Readable Stream: ${resInfo.data.path} ]`, 'special')
        }
      }
      this.emit('verbose', 'server.response', resInfo)
    }
  }
}
