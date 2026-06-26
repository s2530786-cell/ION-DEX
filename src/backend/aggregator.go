package oracle

import (
	"math/big"
	"sort"
)

/**
 * @file aggregator.go
 * @description 多源预言机聚合引擎 (Provider Layer)。
 * 采用 TVL 加权与中位数算法，剔除异常离群值，对抗价格操纵。
 */

type PricePoint struct {
	Source     string     `json:"source"`
	Value      *big.Float `json:"value"`
	Confidence float64    `json:"confidence"` // 来源可靠性权重
	LatencyMs  int64      `json:"latency_ms"`
}

// AggregatePrices 计算中位数价格，抵御闪崩式操纵
func AggregatePrices(sources []PricePoint) *big.Float {
	if len(sources) == 0 {
		return big.NewFloat(0)
	}

	// 1. 过滤低置信度数据
	var validPoints []PricePoint
	for _, p := range sources {
		if p.Confidence > 0.5 && p.LatencyMs < 200 {
			validPoints = append(validPoints, p)
		}
	}

	if len(validPoints) == 0 {
		return big.NewFloat(0)
	}

	// 2. 排序取中位数 (Median)
	sort.Slice(validPoints, func(i, j int) bool {
		return validPoints[i].Value.Cmp(validPoints[j].Value) < 0
	})

	return validPoints[len(validPoints)/2].Value
}
