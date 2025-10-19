const { randomUUID } = require('crypto')

const HEARTBEAT_INTERVAL = Number(process.env.SSE_HEARTBEAT_INTERVAL_MS || 30000)

const channelClients = new Map()
const userClients = new Map()
const clients = new Map()

const metrics = {
  startedAt: Date.now(),
  totalConnections: 0,
  peakConnections: 0,
  totalEvents: 0,
}

const ensureChannel = (channel) => {
  const key = channel.toLowerCase()
  if (!channelClients.has(key)) {
    channelClients.set(key, new Map())
  }
  return key
}

const addClientToChannel = (client, channel) => {
  const key = ensureChannel(channel)
  const channelMap = channelClients.get(key)
  channelMap.set(client.id, client)
  client.channels.add(key)
}

const removeClientFromChannel = (clientId, channel) => {
  const key = channel.toLowerCase()
  const channelMap = channelClients.get(key)
  if (channelMap) {
    channelMap.delete(clientId)
    if (channelMap.size === 0) {
      channelClients.delete(key)
    }
  }
}

const attachUserIndex = (client) => {
  if (!client.userId) return
  if (!userClients.has(client.userId)) {
    userClients.set(client.userId, new Set())
  }
  userClients.get(client.userId).add(client.id)
}

const detachUserIndex = (client) => {
  if (!client.userId) return
  const set = userClients.get(client.userId)
  if (!set) return
  set.delete(client.id)
  if (set.size === 0) {
    userClients.delete(client.userId)
  }
}

const sendEvent = (client, event, data) => {
  if (!client || client.res.writableEnded) {
    return
  }

  try {
    const payload =
      data === undefined || data === null
        ? '{}'
        : typeof data === 'string'
        ? data
        : JSON.stringify(data)

    client.res.write(`event: ${event}\ndata: ${payload}\n\n`)
    client.lastEventAt = Date.now()
    metrics.totalEvents += 1
  } catch (error) {
    removeClient(client.id)
  }
}

const setupSSEHeaders = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders()
  }

  if (req.socket) {
    req.socket.setTimeout(0)
    req.socket.setNoDelay(true)
    req.socket.setKeepAlive(true, HEARTBEAT_INTERVAL)
  }
}

const registerClient = (req, res, channels) => {
  setupSSEHeaders(req, res)

  const clientId = randomUUID()
  const client = {
    id: clientId,
    res,
    userId: req.user?.id ?? null,
    channels: new Set(),
    connectedAt: Date.now(),
    meta: {
      ip: req.ip,
      userAgent: req.get?.('user-agent') ?? null,
    },
  }

  clients.set(clientId, client)
  attachUserIndex(client)
  metrics.totalConnections += 1
  metrics.peakConnections = Math.max(metrics.peakConnections, clients.size)

  channels.forEach((channel) => addClientToChannel(client, channel))

  const heartbeat = setInterval(() => {
    sendEvent(client, 'heartbeat', { ts: Date.now() })
  }, HEARTBEAT_INTERVAL)

  client.heartbeat = heartbeat

  const cleanup = () => removeClient(clientId)
  req.on('close', cleanup)
  req.on('end', cleanup)
  res.on('close', cleanup)

  sendEvent(client, 'connected', {
    id: clientId,
    channels: Array.from(client.channels),
    ts: Date.now(),
  })

  return client
}

const removeClient = (clientId) => {
  const client = clients.get(clientId)
  if (!client) return

  if (client.heartbeat) {
    clearInterval(client.heartbeat)
  }

  client.channels.forEach((channel) => removeClientFromChannel(clientId, channel))
  detachUserIndex(client)

  try {
    if (!client.res.writableEnded) {
      client.res.end()
    }
  } catch (error) {
    // Ignore write errors during cleanup
  }

  clients.delete(clientId)
}

const streamChannel = (channel, req, res) => {
  const normalized = channel.toLowerCase()
  registerClient(req, res, [normalized])
}

const streamJobChannel = (jobId, req, res) => {
  const channel = `job:${jobId}`
  registerClient(req, res, [channel])
}

const streamMultiChannel = (req, res) => {
  const raw = req.query.channels
  const channels = Array.isArray(raw)
    ? raw
    : typeof raw === 'string'
    ? raw.split(',').map((c) => c.trim()).filter(Boolean)
    : ['dashboard']

  if (!channels.length) {
    channels.push('dashboard')
  }

  registerClient(req, res, channels)
}

const emitChannelEvent = (channel, event, payload) => {
  const key = channel.toLowerCase()
  const channelMap = channelClients.get(key)
  if (!channelMap || channelMap.size === 0) {
    return 0
  }

  let delivered = 0
  for (const client of channelMap.values()) {
    sendEvent(client, event, payload)
    delivered += 1
  }
  return delivered
}

const emitToAll = (event, payload) => {
  let delivered = 0
  for (const client of clients.values()) {
    sendEvent(client, event, payload)
    delivered += 1
  }
  return delivered
}

const emitToUser = (userId, event, payload) => {
  const set = userClients.get(userId)
  if (!set) return 0

  let delivered = 0
  for (const clientId of set.values()) {
    const client = clients.get(clientId)
    if (!client) continue
    sendEvent(client, event, payload)
    delivered += 1
  }
  return delivered
}

const emitSSEEvent = (userId, event, payload = {}) => {
  if (!userId) {
    return emitChannelEvent('jobs', event, payload)
  }

  const delivered = emitToUser(userId, event, payload)

  if (!delivered && payload.jobId) {
    emitChannelEvent(`job:${payload.jobId}`, event, payload)
  }

  return delivered
}

const emitForecastProgress = (payload) => {
  emitChannelEvent('forecast', 'forecast:progress', payload)
  emitChannelEvent('dashboard', 'forecast:progress', payload)
}

const emitForecastComplete = (payload) => {
  emitChannelEvent('forecast', 'forecast:complete', payload)
  emitChannelEvent('dashboard', 'forecast:complete', payload)
}

const emitForecastError = (payload) => {
  emitChannelEvent('forecast', 'forecast:error', payload)
  emitChannelEvent('dashboard', 'forecast:error', payload)
}

const emitInventoryUpdate = (payload) => {
  emitChannelEvent('inventory', 'inventory:update', payload)
  emitChannelEvent('dashboard', 'inventory:update', payload)
}

const emitWorkingCapitalUpdate = (payload) => {
  emitChannelEvent('working-capital', 'working_capital:update', payload)
  emitChannelEvent('dashboard', 'working_capital:update', payload)
}

const emitShopifySyncStarted = (payload) => {
  emitChannelEvent('sales', 'shopify:sync_started', payload)
  emitChannelEvent('dashboard', 'shopify:sync_started', payload)
}

const emitShopifyStoreSynced = (payload) => {
  emitChannelEvent('sales', 'shopify:store_synced', payload)
  emitChannelEvent('dashboard', 'shopify:store_synced', payload)
}

const emitShopifySyncCompleted = (payload) => {
  emitChannelEvent('sales', 'shopify:sync_completed', payload)
  emitChannelEvent('dashboard', 'shopify:sync_completed', payload)
}

const emitShopifySyncError = (payload) => {
  emitChannelEvent('sales', 'shopify:sync_error', payload)
  emitChannelEvent('dashboard', 'shopify:sync_error', payload)
}

const emitAdminBroadcast = (channel, event, payload, meta = {}) => {
  const target = channel === '*' ? null : channel
  const enriched = {
    ...payload,
    meta: {
      ...meta,
      broadcastedAt: new Date().toISOString(),
    },
  }

  if (!target) {
    emitToAll(event, enriched)
  } else {
    emitChannelEvent(target, event, enriched)
  }
}

const getStatusSummary = () => ({
  startedAt: metrics.startedAt,
  uptimeMs: Date.now() - metrics.startedAt,
  totalConnections: metrics.totalConnections,
  activeConnections: clients.size,
  peakConnections: metrics.peakConnections,
  totalEvents: metrics.totalEvents,
  channels: Array.from(channelClients.entries()).map(([channel, map]) => ({
    channel,
    clients: map.size,
  })),
})

module.exports = {
  streamChannel,
  streamJobChannel,
  streamMultiChannel,
  emitChannelEvent,
  emitToUser,
  emitSSEEvent,
  emitForecastProgress,
  emitForecastComplete,
  emitForecastError,
  emitInventoryUpdate,
  emitWorkingCapitalUpdate,
  emitShopifySyncStarted,
  emitShopifyStoreSynced,
  emitShopifySyncCompleted,
  emitShopifySyncError,
  emitAdminBroadcast,
  getStatusSummary,
}
