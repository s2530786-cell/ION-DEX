package plugin

/**
 * @file plugin.go
 * @package plugin
 * @description Base Plugin interface for the ION plugin system.
 */

// Plugin is the base interface that all ION plugins must implement.
type Plugin interface {
	// Name returns the unique identifier for this plugin.
	Name() string
	// Version returns the semantic version of this plugin.
	Version() string
}
