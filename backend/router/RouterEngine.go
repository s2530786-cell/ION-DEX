package router

import (
	"context"
	"fmt"
	"math/big"
	"sync"

	"github.com/ion-dex-nuke/backend/plugin"
	"golang.org/x/sync/errgroup"
)

/**
 * @file engine.go
 * @description ION DEX 核心路由聚合引擎 (P0 攻坚版)。
 * 实现了基于贪心策略的多源并发报价聚合算法,确保在高频狙击场景下的极速响应。
 */

type RouterEngine struct {
	sources []plugin.LiquiditySource
	mu      sync.RWMutex
}

func NewRouterEngine() *RouterEngine {
	return &RouterEngine{
		sources: make([]plugin.LiquiditySource, 0),
	}
}

// RegisterSource 允许动态注入不同的流动性适配器 (UniV2, UniV3, Balancer等)
func (re *RouterEngine) RegisterSource(s plugin.LiquiditySource) {
	re.mu.Lock()
	defer re.mu.Unlock()
	re.sources = append(re.sources, s)
}

// FindBestPath 核心聚合算法:并发穿透所有源,找出最优执行计划
func (re *RouterEngine) FindBestPath(ctx context.Context, amount *big.Int) (plugin.ExecutionPlan, error) {
	re.mu.RLock()
	sources := re.sources
	re.mu.RUnlock()

	if len(sources) == 0 {
		return plugin.ExecutionPlan{}, fmt.Errorf("ROUTER_ERR: No liquidity sources registered")
	}

	// 1. 并发报价聚合 (Parallel Quoting)
	// 使用 errgroup 限制上下文生命周期,确保任意一个 Source 超时不会拉垮全局
	g, ctx := errgroup.WithContext(ctx)

	type QuoteResult struct {
		SourceID string
		Output   *big.Int
		Error    error
	}

	results := make([]QuoteResult, len(sources))

	for i, source := range sources {
		i, source := i, source // 闭包陷阱处理
		g.Go(func() error {
			output, err := source.GetQuote(ctx, amount)
			results[i] = QuoteResult{
				SourceID: source.ID(),
				Output:   output,
				Error:    err,
			}
			// 我们不向上层抛出单个 Source 的错误,仅在结果中标记,确保部分成功
			return nil
		})
	}

	// 等待所有报价完成或上下文超时
	if err := g.Wait(); err != nil {
		return plugin.ExecutionPlan{}, fmt.Errorf("ROUTER_ERR: Parallel execution failure: %w", err)
	}

	// 2. 最优路径筛选 (Greedy Selection)
	// 在 V1 贪心模型中,我们选择 Output 最大的单一路径
	// 在 V2 中将引入拉格朗日乘子法进行多路径 Split
	var bestResult *QuoteResult
	for i := range results {
		if results[i].Error != nil || results[i].Output == nil {
			continue
		}
		if bestResult == nil || results[i].Output.Cmp(bestResult.Output) > 0 {
			bestResult = &results[i]
		}
	}

	if bestResult == nil {
		return plugin.ExecutionPlan{}, fmt.Errorf("ROUTER_ERR: Insufficient liquidity across all %d sources", len(sources))
	}

	// 3. 构建执行计划
	plan := plugin.ExecutionPlan{
		Steps: []plugin.RouteStep{
			{
				Source:      plugin.LiquiditySource{Name: bestResult.SourceID},
				AmountIn:    new(big.Int).Set(amount),
			},
		},
		TotalOutput: bestResult.Output,
		// 预留：Slippage 计算逻辑应在 Adapter 层 GetMetadata 中获取深度后在此计算
		Slippage: 0.0,
	}

	return plan, nil
}
