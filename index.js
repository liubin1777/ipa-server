const router = require('koa-route')
const serve = require('koa-static')
const Koa = require('koa')
const app = new Koa()
const config = require('./config')
const { createPlistBody } = require('./libs/plist')
const ipaManager = require('./libs/ipa-manager')
const upload = require('./middle/upload')

app.use(serve('./public'))
app.use(serve('./upload', {maxage: 1000 * 3600 * 24 * 365}))

// 获取app列表
app.use(router.get('/api/list', async ctx => {
  ctx.body = ipaManager.list()
}))

app.use(router.get('/api/info/:id', async (ctx, id) => {
  ctx.body = ipaManager.list().find(row => row.id === id)
}))

// 导入ipa
app.use(router.post('/api/upload', upload({
  defExt: 'ipa',
}, async (ctx, files) => {
  try {
    await ipaManager.add(files[0])
    ctx.body = { meg: '上传成功' }
  } catch (err) {
    console.log(err)
    ctx.body = { err: '上传失败' }
  }
})))

// 获取安装信息
app.use(router.get('/plist/:id.plist', async (ctx, id) => {
  const info = ipaManager.find(id)
  ctx.set('Content-disposition', `attachment; filename=${info.name}.plist`)
  ctx.body = createPlistBody(info)
}))

// 捕获错误
app.on('error', err => {
  console.error('*** SERVER ERROR ***\n', err)
  err.status !== 400 && config.debug && require('child_process').spawn('say', ['oh my god,崩溃了'])
})

// 启动服务
app.listen(config.port, config.host, ()=>{
  console.log(`Server started: http://${config.host}:${config.port}`)
})
