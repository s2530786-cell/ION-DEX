package orchestrator

import (
	"context"
	"fmt"
	"sync"

	"github.com/your-project/pkg/ion/plugin"
)

/**
 * @file registry.go
 * @description Central Plugin Registry for ION-Flow.
 * Implements the Factory Pattern to map YAML plugin identifiers to 
 * concrete execution logic (Native Go or Wasm-shimmed).
 */

type PluginRegistry struct {
	mu      sync.RWMutex
	plugins map[string]plugin.IonPlugin
}

func NewPluginRegistry() *PluginRegistry {
	return &PluginRegistry{
		plugins: make(map[string]plugin.IonPlugin),
	}
}

func (r *PluginRegistry) Register(name string, p plugin.IonPlugin) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.plugins[name] = p
}

func (r *PluginRegistry) Get(name string) (plugin.IonPlugin, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	p, ok := r.plugins[name]
	if !ok {
		return nil, fmt.Errorf("PLUGIN_NOT_FOUND: %s", name)
	}
	return p, nil
}

// PipelineCommand encapsulates an executable step with its specific parameters
type PipelineCommand struct {
	Name     string
	Executor plugin.IonPlugin
	Params   map[string]interface{}
}

func (c *PipelineCommand) Execute(ctx context.Context, input []byte) ([]byte, error) {
	// In production, params would be serialized and passed via the Process interface
	return c.Executor.Process(ctx, input)
}
