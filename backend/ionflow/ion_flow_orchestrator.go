package ionflow

import (
	"context"
	"fmt"
	"sync"
)

/**
 * @file orchestrator.go
 * @description The "Neural Center" of ION-Flow.
 * Implements a thread-safe, sequential pipeline execution engine that 
 * converts YAML-defined intents into atomic transaction chains.
 */

// PipelineContext manages shared state and telemetry across the execution chain.
type PipelineContext struct {
	Ctx      context.Context
	Data     map[string]interface{}
	mu       sync.RWMutex
	Metadata map[string]string // Telemetry tags (e.g. execution_id, shard_id)
}

func NewPipelineContext(ctx context.Context) *PipelineContext {
	return &PipelineContext{
		Ctx:  ctx,
		Data: make(map[string]interface{}),
		Metadata: make(map[string]string),
	}
}

// Set stores a value in the shared context (thread-safe).
func (c *PipelineContext) Set(key string, val interface{}) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.Data[key] = val
}

// Get retrieves a value from the shared context.
func (c *PipelineContext) Get(key string) (interface{}, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	val, ok := c.Data[key]
	return val, ok
}

// IONFlowStep defines the interface for all pluggable modules.
type IONFlowStep interface {
	Name() string
	Execute(pCtx *PipelineContext, params map[string]interface{}) error
}

// Orchestrator handles the assembly and execution of modular pipelines.
type Orchestrator struct {
	registry map[string]IONFlowStep
	mu       sync.RWMutex
}

func NewOrchestrator() *Orchestrator {
	return &Orchestrator{
		registry: make(map[string]IONFlowStep),
	}
}

func (o *Orchestrator) Register(step IONFlowStep) {
	o.mu.Lock()
	defer o.mu.Unlock()
	o.registry[step.Name()] = step
}

// ExecuteFlow sequences the YAML-defined steps into an atomic execution unit.
func (o *Orchestrator) ExecuteFlow(ctx context.Context, steps []StepDefinition) error {
	pCtx := NewPipelineContext(ctx)

	for i, stepDef := range steps {
		o.mu.RLock()
		plugin, ok := o.registry[stepDef.Plugin]
		o.mu.RUnlock()

		if !ok {
			return fmt.Errorf("PLUGIN_NOT_FOUND: step[%d] requires %s", i, stepDef.Plugin)
		}

		// Atomic Logic: Any step failure halts the entire chain to prevent stale execution.
		if err := plugin.Execute(pCtx, stepDef.Params); err != nil {
			return fmt.Errorf("PIPELINE_ERROR: step [%s] failed: %w", stepDef.Name, err)
		}
	}

	return nil
}

type StepDefinition struct {
	Name   string                 `yaml:"name"`
	Plugin string                 `yaml:"plugin"`
	Params map[string]interface{} `yaml:"params"`
}
