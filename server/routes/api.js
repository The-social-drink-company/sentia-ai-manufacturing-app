/**
 * Consolidated API router
 * Wires feature routers under the /api namespace so the express server
 * can start without import errors and clients hit the intended handlers.
 */

import express from 'express'

import exportRouter from './export.js'
import forecastsRouter from './forecasts.js'
import importRouter from './import.js'
import inventoryRouter from './inventory.js'
import mlModelsRouter from './ml-models.js'
import onboardingRouter from './onboarding.js'
import productsRouter from './products.js'
import salesRouter from './sales.js'
import scenariosRouter from './scenarios.js'
import workingCapitalRouter from './working-capital.js'

const router = express.Router()

router.use('/export', exportRouter)
router.use('/forecasts', forecastsRouter)
router.use('/import', importRouter)
router.use('/inventory', inventoryRouter)
router.use('/ml', mlModelsRouter)
router.use('/onboarding', onboardingRouter)
router.use('/products', productsRouter)
router.use('/sales', salesRouter)
router.use('/scenarios', scenariosRouter)
router.use('/working-capital', workingCapitalRouter)

// Default handler for unmapped /api requests so clients are informed.
router.all('*', (req, res) => {
  res.status(404).json({
    error: 'api_endpoint_not_found',
    message: 'This API route is not implemented yet.',
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString(),
  })
})

export default router
