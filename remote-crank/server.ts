import express from 'express'

const app = express()

app.get('/', (req, res) => {
  res.send('All your base belong to us.')
})

const port = process?.env?.PORT ?? 3000
app.listen(port, () => {
  console.log(`GFX Suite Remote Crank Server is running on port http://localhost:${port}`)
})

export default app
