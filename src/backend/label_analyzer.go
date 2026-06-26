package intelligence

import (
	"context"
	"encoding/json"
)

/**
 * @file label_analyzer.go
 * @description Decision-making logic for the ION Label Engine.
 * Automatically calculates address reputations based on profitable trade history.
 */

type TradeRecord struct {
	Profit float64 `json:"profit"`
	Amount float64 `json:"amount"`
}

// AnalyzeAndLabel runs the reputation algorithm on historical trade data.
func (e *LabelEngine) AnalyzeAndLabel(ctx context.Context, address string, history []TradeRecord) error {
	totalTrades := len(history)
	if totalTrades < 10 {
		return nil // Insufficient data for reliable labeling
	}

	wins := 0
	for _, trade := range history {
		if trade.Profit > 0 {
			wins++
		}
	}
	
	winRate := float64(wins) / float64(totalTrades)
	
	newLabel := AddressLabel{
		Tag:       "NORMAL",
		WinRate:   winRate,
		RiskScore: 0,
	}

	// Heuristic thresholds for ION DEX participants
	if winRate > 0.8 {
		newLabel.Tag = "SMART_MONEY"
	} else if winRate < 0.3 {
		newLabel.Tag = "RETAIL_TRADER"
	}

	// Persist to L2 (Redis)
	data, _ := json.Marshal(newLabel)
	err := e.rdb.HSet(ctx, "labels:address", address, data).Err()
	if err != nil {
		return err
	}

	// Synchronize L1 (Local Cache)
	e.mu.Lock()
	e.cache[address] = newLabel
	e.mu.Unlock()

	return nil
}
