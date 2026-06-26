package logger

import (
	"log/slog"
	"os"
)

/**
 * @file audit.go
 * @description Structured Transaction Audit Logger (Black Box).
 * Utilizes Go 1.21 slog for high-efficiency JSON logging, enabling 
 * seamless integration with ELK or Grafana Loki for trade replay.
 */

// AuditEntry defines the canonical structure for transaction lifecycle logs.
type AuditEntry struct {
	TraceID string         `json:"trace_id"`
	Stage   string         `json:"stage"` // e.g., START, ROUTING, SIMULATION, EXECUTION
	Action  string         `json:"action"`
	Success bool           `json:"success"`
	Details map[string]any `json:"details"`
}

var Logger *slog.Logger

func InitAuditLogger() {
	// Standard JSON handler for machine readability and ingestion performance.
	Logger = slog.New(slog.NewJSONHandler(os.Stdout, nil))
}

func LogAction(entry AuditEntry) {
	if Logger == nil {
		InitAuditLogger()
	}
	
	Logger.Info("transaction_audit",
		slog.String("trace_id", entry.TraceID),
		slog.String("stage", entry.Stage),
		slog.String("action", entry.Action),
		slog.Bool("success", entry.Success),
		slog.Any("details", entry.Details),
	)
}
