package registry

import "sync"

/**
 * @file token.go
 * @description ION DEX 真实币种注册中心 (Registry Layer)。
 * 作为系统的唯一事实来源 (SSOT)，存储代币元数据，杜绝硬编码。
 */

type TokenInfo struct {
	Address  string `json:"address"`
	Symbol   string `json:"symbol"`
	Decimals int    `json:"decimals"`
	LogoURI  string `json:"logo_uri"`
	IsStable bool   `json:"is_stable"` // 辅助定价策略
}

type TokenRegistry struct {
	mu     sync.RWMutex
	tokens map[string]TokenInfo
}

func NewTokenRegistry() *TokenRegistry {
	return &TokenRegistry{
		tokens: make(map[string]TokenInfo),
	}
}

// GetToken 获取代币元数据
func (r *TokenRegistry) GetToken(symbol string) (TokenInfo, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	t, ok := r.tokens[symbol]
	return t, ok
}

// RegisterToken 动态注册新币种
func (r *TokenRegistry) RegisterToken(t TokenInfo) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.tokens[t.Symbol] = t
}
