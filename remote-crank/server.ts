import express from 'express'
import packageJson from './package.json' assert { type: 'json' }

const app = express()

const status = {
  state: 'running',
  version: packageJson?.version ?? '0.0.0',
  uptime: 0
}

function updateServer (): void {
  status.uptime = process.uptime()
  setTimeout(updateServer, 1000)
}

app.get('/', (req, res) => {
  res.json({
    message: 'All your base belong to us.',
    status
  })
})

const port = process?.env?.PORT ?? 3000
app.listen(port, () => {
  console.log(`GFX Suite Remote Crank Server is running on port http://localhost:${port}`)
  updateServer()
})

export default app
