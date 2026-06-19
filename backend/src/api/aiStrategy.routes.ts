import { Router, type Request, type Response } from 'express';
import {
  getAllStrategies,
  getStrategyById,
  createStrategy,
  updateStrategy,
  deleteStrategy,
  simulateStrategy,
  type CreateStrategyInput,
} from '../services/aiStrategy.js';

const router = Router();

// GET /api/ai/strategies
router.get('/', (_req: Request, res: Response) => {
  try {
    const strategies = getAllStrategies();
    res.json({ data: strategies, total: strategies.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch strategies' });
  }
});

// POST /api/ai/strategies
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, type, params } = req.body as CreateStrategyInput;
    if (!name?.trim()) {
      res.status(400).json({ error: 'Strategy name is required' });
      return;
    }
    if (!['grid', 'trend', 'arbitrage', 'market_making'].includes(type)) {
      res.status(400).json({ error: `Invalid strategy type: ${type}` });
      return;
    }
    if (!params?.fundAmount || params.fundAmount <= 0) {
      res.status(400).json({ error: 'Fund amount must be positive' });
      return;
    }
    if (!params?.stopLoss || params?.stopLoss <= 0) {
      res.status(400).json({ error: 'Stop loss must be positive' });
      return;
    }
    if (!params?.takeProfit || params?.takeProfit <= 0) {
      res.status(400).json({ error: 'Take profit must be positive' });
      return;
    }
    if (params.stopLoss >= params.takeProfit) {
      res.status(400).json({ error: 'Stop loss must be less than take profit' });
      return;
    }
    if (!params?.maxSlippage || params.maxSlippage <= 0) {
      res.status(400).json({ error: 'Max slippage must be positive' });
      return;
    }

    const strategy = createStrategy({ name: name.trim(), type, params });
    res.status(201).json({ data: strategy });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create strategy' });
  }
});

// GET /api/ai/strategies/:id
router.get('/:id', (req: Request, res: Response) => {
  try {
    const strategy = getStrategyById(req.params.id);
    if (!strategy) {
      res.status(404).json({ error: 'Strategy not found' });
      return;
    }
    res.json({ data: strategy });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch strategy' });
  }
});

// PUT /api/ai/strategies/:id
router.put('/:id', (req: Request, res: Response) => {
  try {
    const updates = req.body as Record<string, unknown>;
    const allowed = ['name', 'type', 'params', 'status'] as const;

    const filtered: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in updates) filtered[key] = updates[key];
    }

    if (filtered.type && !['grid', 'trend', 'arbitrage', 'market_making'].includes(filtered.type as string)) {
      res.status(400).json({ error: `Invalid strategy type` });
      return;
    }
    if (filtered.status && !['draft', 'running', 'paused', 'closed'].includes(filtered.status as string)) {
      res.status(400).json({ error: `Invalid status` });
      return;
    }

    const updated = updateStrategy(req.params.id, filtered as any);
    if (!updated) {
      res.status(404).json({ error: 'Strategy not found' });
      return;
    }
    res.json({ data: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update strategy' });
  }
});

// DELETE /api/ai/strategies/:id
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const deleted = deleteStrategy(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Strategy not found' });
      return;
    }
    res.json({ data: { id: req.params.id, deleted: true } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete strategy' });
  }
});

// POST /api/ai/strategies/:id/simulate
router.post('/:id/simulate', (req: Request, res: Response) => {
  try {
    const strategy = getStrategyById(req.params.id);
    if (!strategy) {
      res.status(404).json({ error: 'Strategy not found' });
      return;
    }
    const result = simulateStrategy(req.params.id);
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to simulate strategy' });
  }
});

export default router;
