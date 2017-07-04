module.exports = MiddlewareBase => class RequestMonitor extends MiddlewareBase {
  middleware () {
    return async (ctx, next) => {
      const util = require('util')

      /* first, inspect the request */
      const reqInfo = {
        socketId: ctx.req.socket.id,
        requestId: ctx.req.requestId,
        method: ctx.req.method,
        url: ctx.req.url,
        headers: ctx.req.headers
      }
      if (ctx.request.rawBody) reqInfo.data = ctx.request.rawBody
      const incomingBuffer = ctx.req._readableState.buffer
      if (!reqInfo.data && incomingBuffer.head && incomingBuffer.head.data.length) {
        reqInfo.data = '__INCOMING__'
        reqInfo.data[util.inspect.custom] = function (depth, options) {
          const byteSize = require('byte-size')
          const size = byteSize(incomingBuffer.head.data.length)
          return options.stylize(`[ incoming data (${size} so far) ]`, 'special')
        }
      }
      this.emit('verbose', 'server.request', reqInfo)

      /* next, inspect the response */
      await next()
      const resInfo = {
        socketId: ctx.req.socket.id,
        requestId: ctx.req.requestId,
        statusCode: ctx.res.statusCode
      }
      const headers = (ctx.res.getHeaders && ctx.res.getHeaders()) || ctx.res._headers
      if (headers) resInfo.headers = headers
      if (ctx.body) resInfo.data = ctx.body

      const stream = require('stream')
      if (resInfo.data instanceof stream.Readable) {
        resInfo.data[util.inspect.custom] = function (depth, options) {
          return options.stylize(`[ Readable Stream: ${resInfo.data.path} ]`, 'special')
        }
      }
      this.emit('verbose', 'server.response', resInfo)
    }
  }
}
