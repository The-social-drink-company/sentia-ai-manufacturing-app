import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useClerk, useAuth, SignIn } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';

const INITIAL_STAGE_STATE = {
  status: 'pending',
  attempts: 0,
  durationMs: null,
  error: null,
  summary: ''
};

const StageIndicator = ({ status }) => {
  const base = 'h-3 w-3 rounded-full border border-slate-600';
  const variant = {
    pending: 'opacity-40 border-dashed border-slate-500',
    running: 'border-blue-500 animate-pulse',
    success: 'bg-green-500 border-green-500',
    error: 'bg-red-500 border-red-500 animate-pulse'
  }[status] || 'opacity-40';

  return <span className={`${base} ${variant}`} />;
};

const EnterpriseBootstrapLoader = ({ children, onComplete, onError, onAuthReady, publishableKey: publishableKeyProp }) => {
  const clerk = useClerk();
  const auth = useAuth();
  const { isLoaded: authLoaded, isSignedIn } = auth;
  const publishableKey = publishableKeyProp ?? import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  const stageContextRef = useRef({
    results: {},
    metrics: {},
    clerk: null,
    auth: { isLoaded: false, isSignedIn: false },
    cleanups: [],
    publishableKey: publishableKey || null
  });

  useEffect(() => {
    stageContextRef.current.clerk = clerk;
    stageContextRef.current.auth = { isLoaded: authLoaded, isSignedIn };
    stageContextRef.current.publishableKey = publishableKey || null;
  }, [clerk, authLoaded, isSignedIn, publishableKey]);

  const stageDefinitions = useMemo(() => ([
    {
      id: 'observability',
      label: 'Observability & Telemetry',
      description: 'Activating web vitals, telemetry sinks, and baseline reporting.',
      run: async (ctx) => {
        const module = await import('../../services/monitoring/webVitals.js');
        let report = null;
        if (module.generatePerformanceReport) {
          report = module.generatePerformanceReport();
        }
        ctx.results.observability = report;
        const score = report?.summary?.performanceScore ?? null;
        return {
          summary: score !== null ? `Performance score ${score}` : 'Telemetry online',
          metrics: { performanceScore: score }
        };
      }
    },
    {
      id: 'clerk',
      label: 'Clerk Authentication',
      description: 'Establishing real Clerk authentication and session handshake.',
      run: async (ctx) => {
        const effectiveKey = ctx.publishableKey ?? import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
        if (!effectiveKey) {
          throw new Error('VITE_CLERK_PUBLISHABLE_KEY is not set. Provision a real Clerk publishable key.');
        }
        const instance = ctx.clerk;
        if (!instance) {
          throw new Error('Clerk provider is not available in the component tree.');
        }

        const start = performance.now();
        if (typeof instance.load === 'function' && !instance.loaded) {
          await instance.load();
        }
        if (!instance.loaded) {
          throw new Error('Clerk failed to load within the expected window.');
        }

        let sessionStatus = 'no-session';
        if (instance.session) {
          try {
            await instance.session.getToken({ skipCache: true });
            sessionStatus = 'token-ready';
          } catch (tokenError) {
            const message = tokenError instanceof Error ? tokenError.message : String(tokenError);
            sessionStatus = `token-error: ${message}`;
          }
        }

        ctx.results.clerk = {
          publishableKeySuffix: effectiveKey.slice(-6),
          loaded: instance.loaded,
          sessionStatus,
          userId: instance.user?.id ?? null,
          user: instance.user
            ? { id: instance.user.id, email: instance.user.primaryEmailAddress?.emailAddress || null }
            : null
        };

        const durationMs = Math.round(performance.now() - start);
        return {
          summary: `Clerk ready in ${durationMs}ms (${sessionStatus})`,
          metrics: {
            clerkLoadMs: durationMs,
            sessionPresent: instance.session ? 1 : 0
          }
        };
      }
    },
    {
      id: 'access-control',
      label: 'Access Control Guardrails',
      description: 'Priming enterprise RBAC and ABAC policies.',
      run: async (ctx) => {
        const module = await import('../../services/security/accessControl.ts');
        const accessControl = module.default ?? module.AccessControlService?.getInstance?.();
        if (!accessControl) {
          throw new Error('Access control service failed to initialize.');
        }

        const userId = ctx.results.clerk?.userId || 'bootstrap';
        accessControl.clearCache(userId);

        const evaluation = accessControl.evaluateAccess({
          user: { id: userId, role: module.Role?.ADMIN ?? 'admin' },
          resource: {
            type: module.ResourceType?.SYSTEM_CONFIG ?? module.ResourceType?.FINANCIAL_DATA ?? 'system_config',
            ownerId: userId
          },
          action: module.Action?.READ ?? 'read',
          environment: {
            location: 'bootstrap',
            time: new Date(),
            device: navigator.userAgent
          }
        });

        ctx.results.accessControl = { evaluation };

        const permissions = Array.from(accessControl.getUserPermissions(userId) || []);
        return {
          summary: `Access policies active (${permissions.length} permissions)`,
          metrics: {
            permissionCount: permissions.length,
            evaluation: evaluation ? 1 : 0
          }
        };
      }
    },
    {
      id: 'cache-layer',
      label: 'Cache & Offline Layer',
      description: 'Preparing distributed cache, storage quotas, and service worker.',
      run: async (ctx) => {
        const module = await import('../../lib/cacheManager.ts');
        const stats = module.cacheManager.getStats();
        const status = await module.cacheUtils.getCacheStatus();
        const entries = typeof stats?.totalEntries === 'number' ? stats.totalEntries : 0;
        const hitRate = typeof status?.performance?.hitRate === 'number' && Number.isFinite(status.performance.hitRate)
          ? status.performance.hitRate
          : 0;
        let registration = null;
        try {
          registration = await module.registerServiceWorker();
        } catch (error) {
          ctx.results.cacheWarning = error instanceof Error ? error.message : String(error);
        }

        ctx.results.cache = { stats, status, registration: Boolean(registration) };
        return {
          summary: `Cache ready (${entries} entries, hit rate ${(hitRate * 100).toFixed(1)}%)`,
          metrics: {
            cacheEntries: entries,
            cacheHitRate: hitRate,
            serviceWorker: registration ? 1 : 0
          }
        };
      }
    },
    {
      id: 'data-client',
      label: 'Data Client & Sync',
      description: 'Wiring React Query persistence, offline sync, and network listeners.',
      run: async (ctx) => {
        const module = await import('../../lib/queryClient.ts');
        const cleanup = module.initializeNetworkHandling();
        if (cleanup) {
          ctx.cleanups.push(cleanup);
        }

        const cacheSize = module.cacheUtils.getCacheSize();
        await module.prefetchers.foundation();

        ctx.results.queryClient = { cacheSize };
        return {
          summary: `Data client online (${cacheSize.queries} queries cached)`,
          metrics: {
            cachedQueries: cacheSize.queries,
            cacheBytes: cacheSize.size
          }
        };
      }
    },
    {
      id: 'live-data',
      label: 'Live Data Channels',
      description: 'Booting live data feeds across ERP and commerce integrations.',
      run: async () => {
        const module = await import('../../services/liveDataService.js');
        const service = module.default || module.liveDataService || module;
        await service.initialize();
        const inventory = await service.getInventoryData();
        if (!inventory || inventory.status?.startsWith('NO_')) {
          throw new Error('Live data sources are not connected. Configure ERP/commerce credentials.');
        }

        return {
          summary: `Inventory feed ready (${inventory.status})`,
          metrics: {
            inventoryValue: inventory.stockValue ?? 0,
            skuCount: inventory.totalSkus ?? 0
          },
          details: inventory
        };
      }
    },
    {
      id: 'data-integration',
      label: 'Enterprise Data Integration',
      description: 'Fetching unified metrics across finance, production, and commerce.',
      run: async () => {
        const module = await import('../../services/dataIntegrationService.js');
        const metrics = await module.dataIntegrationService.fetchCurrentMetrics();
        return {
          summary: 'Enterprise metrics fetched from live endpoints',
          metrics: {
            sources: Object.keys(metrics || {}).length
          },
          details: metrics
        };
      }
    },
    {
      id: 'real-data-aggregation',
      label: 'Real Data Aggregation',
      description: 'Aggregating KPIs from external integrations via secure APIs.',
      run: async () => {
        const module = await import('../../services/realDataIntegration.js');
        const service = module.default || module.realDataIntegrationService || module;
        const kpis = await service.getDashboardKPIs();
        if (!kpis || Object.keys(kpis).length === 0) {
          throw new Error('Dashboard KPIs unavailable. Verify integration endpoints.');
        }
        return {
          summary: `Dashboard KPIs ready (revenue ${kpis.revenue ?? 0})`,
          metrics: {
            totalRevenue: kpis.revenue ?? 0,
            totalOrders: kpis.orders ?? 0
          },
          details: kpis
        };
      }
    },
    {
      id: 'performance-baseline',
      label: 'Performance Baseline',
      description: 'Running performance monitor and pushing baseline analytics.',
      run: async (ctx) => {
        const module = await import('../../services/performance/PerformanceMonitor.js');
        const score = module.default.getPerformanceScore();
        module.default.reportMetrics();
        ctx.results.performance = { score };
        return {
          summary: `Performance baseline computed (score ${score})`,
          metrics: { performanceScore: score }
        };
      }
    },
    {
      id: 'real-data-health',
      label: 'Real Data Health',
      description: 'Running end-to-end health checks on all production data services.',
      run: async () => {
        const module = await import('../../services/realDataService.js');
        const health = await module.checkHealth();
        if (!Array.isArray(health) || health.length === 0) {
          throw new Error('No health information returned from real data service.');
        }
        const unhealthy = health.filter((item) => item?.status !== 'healthy');
        if (unhealthy.length > 0) {
          throw new Error(`Detected degraded services: ${unhealthy.map((item) => item?.name || 'unknown').join(', ')}`);
        }
        return {
          summary: 'All data services healthy',
          metrics: { healthyServices: health.length },
          details: health
        };
      }
    }
  ]), []);

  const [stageStates, setStageStates] = useState(() => stageDefinitions.map(() => ({ ...INITIAL_STAGE_STATE })));
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const runningRef = useRef(false);
  const startedRef = useRef(false);

  useEffect(() => () => {
    stageContextRef.current.cleanups.forEach((cleanup) => {
      try {
        cleanup();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    });
  }, []);

  const runStage = useCallback(async (stage, index) => {
    setStageStates((prev) => prev.map((state, idx) => (
      idx === index
        ? {
            ...state,
            status: 'running',
            attempts: state.attempts + 1,
            error: null
          }
        : state
    )));

    const start = performance.now();
    try {
      const result = await stage.run(stageContextRef.current);
      const durationMs = Math.round(performance.now() - start);

      if (result?.metrics) {
        stageContextRef.current.metrics[stage.id] = {
          ...(stageContextRef.current.metrics[stage.id] || {}),
          ...result.metrics,
          durationMs
        };
      } else {
        stageContextRef.current.metrics[stage.id] = {
          ...(stageContextRef.current.metrics[stage.id] || {}),
          durationMs
        };
      }

      if (result?.details) {
        stageContextRef.current.results[stage.id] = result.details;
      }

      if (typeof result?.cleanup === 'function') {
        stageContextRef.current.cleanups.push(result.cleanup);
      }

      setStageStates((prev) => prev.map((state, idx) => (
        idx === index
          ? {
              ...state,
              status: 'success',
              durationMs,
              summary: result?.summary || state.summary,
              error: null
            }
          : state
      )));

      if (stage.id === 'clerk' && typeof onAuthReady === 'function') {
        onAuthReady(stageContextRef.current.results.clerk?.user || null);
      }

      return true;
    } catch (error) {
      const durationMs = Math.round(performance.now() - start);
      stageContextRef.current.metrics[stage.id] = {
        ...(stageContextRef.current.metrics[stage.id] || {}),
        durationMs,
        failed: true
      };

      setStageStates((prev) => prev.map((state, idx) => (
        idx === index
          ? {
              ...state,
              status: 'error',
              durationMs,
              error: error instanceof Error ? error.message : String(error)
            }
          : state
      )));
      throw error;
    }
  }, [onAuthReady]);

  const runSequentialFrom = useCallback(async (startIndex = 0) => {
    if (runningRef.current) {
      return;
    }
    runningRef.current = true;
    try {
      for (let index = startIndex; index < stageDefinitions.length; index += 1) {
        const stage = stageDefinitions[index];
        setCurrentStageIndex(index);
        await runStage(stage, index);
      }
      setCompleted(true);
      if (typeof onComplete === 'function') {
        onComplete(stageContextRef.current);
      }
    } catch (error) {
      console.error('Bootstrap stage failure:', error);
      setCompleted(false);
      if (typeof onError === 'function') {
        const normalized = error instanceof Error ? error : new Error(String(error));
        onError(normalized);
      }
    } finally {
      runningRef.current = false;
    }
  }, [runStage, stageDefinitions, onComplete, onError]);

  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      runSequentialFrom().catch((error) => console.error(error));
    }
  }, [runSequentialFrom]);

  const retryFrom = useCallback((index) => {
    if (runningRef.current) {
      return;
    }
    setCompleted(false);

    setStageStates((prev) => prev.map((state, idx) => (
      idx >= index
        ? {
            ...state,
            status: 'pending',
            durationMs: null,
            error: null,
            summary: idx === index ? '' : state.summary
          }
        : state
    )));

    stageDefinitions.slice(index).forEach((stage) => {
      delete stageContextRef.current.metrics[stage.id];
      delete stageContextRef.current.results[stage.id];
    });

    runSequentialFrom(index).catch((error) => console.error(error));
  }, [runSequentialFrom, stageDefinitions]);

  const completedCount = stageStates.filter((stage) => stage.status === 'success').length;
  const progress = Math.round((completedCount / stageDefinitions.length) * 100);
  const activeStage = stageDefinitions[currentStageIndex];
  const activeState = stageStates[currentStageIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Enterprise Bootstrap</p>
          <h1 className="text-3xl font-semibold text-white">Initialising Sentia enterprise systems</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
            Each stage executes production-grade operations with live services. The loader captures timing, health,
            and failures so you can remediate issues before the dashboard goes live.
          </p>
        </header>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-slate-900/20">
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-800">
              <motion.div
                className="h-2 rounded-full bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-400"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
            <div className="space-y-4">
              {stageDefinitions.map((stage, index) => {
                const state = stageStates[index] || INITIAL_STAGE_STATE;
                const isActive = index === currentStageIndex;
                return (
                  <motion.button
                    key={stage.id}
                    type="button"
                    onClick={() => state.status === 'error' && retryFrom(index)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                      isActive
                        ? 'border-blue-500/70 bg-blue-500/10'
                        : state.status === 'success'
                        ? 'border-slate-800 bg-slate-900/80'
                        : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700'
                    }`}
                    whileHover={{ scale: state.status === 'error' ? 1.01 : 1 }}
                  >
                    <StageIndicator status={state.status} />
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="text-sm font-semibold text-slate-100">{stage.label}</span>
                        <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                          {state.status === 'pending' && 'Pending'}
                          {state.status === 'running' && 'Running'}
                          {state.status === 'success' && 'Complete'}
                          {state.status === 'error' && 'Needs Attention'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">{stage.description}</span>
                      {state.summary ? (
                        <span className="mt-1 text-xs text-slate-300">{state.summary}</span>
                      ) : null}
                      {typeof state.durationMs === 'number' ? (
                        <span className="mt-1 text-[10px] uppercase tracking-[0.3em] text-slate-500">
                          {state.durationMs}ms · attempt {state.attempts}
                        </span>
                      ) : null}
                      {state.status === 'error' && state.error ? (
                        <span className="mt-1 rounded bg-red-500/10 px-2 py-1 text-xs text-red-300">
                          {state.error} — click to retry
                        </span>
                      ) : null}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <div className="space-y-6">
              <AnimatePresence mode="wait">
                {activeStage ? (
                  <motion.div
                    key={activeStage.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6"
                  >
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Active Stage</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">{activeStage.label}</h2>
                    <p className="mt-3 text-sm leading-relaxed text-slate-300">{activeStage.description}</p>

                    {activeState?.status === 'error' && activeState.error ? (
                      <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
                        <p className="font-semibold uppercase tracking-[0.2em]">Stage blocked</p>
                        <p className="mt-2 text-red-100">{activeState.error}</p>
                        <button
                          type="button"
                          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-400/60 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-100 hover:bg-red-500/20"
                          onClick={() => retryFrom(currentStageIndex)}
                        >
                          Retry stage
                        </button>
                      </div>
                    ) : null}

                    {activeState?.status === 'running' ? (
                      <div className="mt-6 flex items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
                        <span className="h-2 w-2 animate-ping rounded-full bg-blue-300" />
                        Executing live operations...
                      </div>
                    ) : null}

                    <div className="mt-6 space-y-3 text-xs text-slate-400">
                      <div className="flex justify-between">
                        <span>Attempts</span>
                        <span className="font-semibold text-slate-200">{activeState?.attempts}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Elapsed</span>
                        <span className="font-semibold text-slate-200">
                          {typeof activeState?.durationMs === 'number' ? `${activeState.durationMs}ms` : '—'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {stageStates[1]?.status === 'success' && !isSignedIn ? (
                <div className="rounded-2xl border border-blue-500/40 bg-blue-500/5 p-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-blue-200">Secure Sign-In Required</p>
                  <p className="mt-3 text-sm text-blue-100">
                    Clerk authentication is live. Sign in with your enterprise credentials to unblock downstream data
                    stages.
                  </p>
                  <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/80 p-4">
                    <SignIn />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Stage Metrics</h3>
          <div className="mt-4 grid gap-4 text-xs text-slate-300 sm:grid-cols-2 lg:grid-cols-3">
            {stageDefinitions.map((stage, idx) => {
              const metrics = stageContextRef.current.metrics[stage.id];
              const state = stageStates[idx];
              return (
                <div key={stage.id} className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-4">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">{stage.label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{state?.summary || 'Pending'}</p>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    Duration: {metrics?.durationMs ? `${metrics.durationMs}ms` : '—'}
                  </p>
                  {metrics ? (
                    <div className="mt-2 space-y-1 text-[11px] text-slate-400">
                      {Object.entries(metrics)
                        .filter(([key]) => key !== 'durationMs')
                        .map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="uppercase tracking-[0.2em] text-slate-500">{key}</span>
                            <span className="text-slate-200">
                              {typeof value === 'number' && Number.isFinite(value) ? value.toString() : String(value)}
                            </span>
                          </div>
                        ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {completed ? (
          <AnimatePresence>
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6 text-emerald-100"
            >
              <p className="text-xs uppercase tracking-[0.3em]">Bootstrap Complete</p>
              <p className="mt-2 text-sm">
                All enterprise systems are online. Proceeding to the dashboard will maintain live telemetry and health
                monitoring.
              </p>
            </motion.div>
          </AnimatePresence>
        ) : null}

        <AnimatePresence mode="wait">
          {completed ? (
            <motion.div
              key="children"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              {children}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EnterpriseBootstrapLoader;

