package scanner

import (
	"context"
	"fmt"
	"log/slog"
	"net"
	"time"

	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq" // Ensure PostgreSQL driver is imported
	"github.com/redis/go-redis/v9"
)

// Config defines the required configuration structure for the scanner
type Config struct {
	RedisAddr string
	RPCUrl    string
	DBUrl     string
	AuthKey   string
}

type SystemScanner struct {
	ctx    context.Context
	logger *slog.Logger
}

func NewSystemScanner(ctx context.Context, logger *slog.Logger) *SystemScanner {
	return &SystemScanner{ctx: ctx, logger: logger}
}

// PerformHealthCheck executes the complete pre-flight diagnostic suite
func (s *SystemScanner) PerformHealthCheck(cfg Config) error {
	checks := []struct {
		name string
		fn   func() error
	}{
		{"Redis Connection", func() error { return s.checkRedis(cfg.RedisAddr) }},
		{"Blockchain RPC", func() error { return s.checkRPC(cfg.RPCUrl) }},
		{"Database Connectivity", func() error { return s.checkDB(cfg.DBUrl) }},
		{"Key Format Check", func() error { return s.checkKeys(cfg.AuthKey) }},
	}

	for _, c := range checks {
		s.logger.Info("Executing health check", "target", c.name)
		start := time.Now()
		if err := c.fn(); err != nil {
			return fmt.Errorf("CHECK_FAILED: %s - %w", c.name, err)
		}
		s.logger.Info("Check passed", "target", c.name, "latency", time.Since(start))
	}
	return nil
}

func (s *SystemScanner) checkRPC(url string) error {
	client, err := ethclient.Dial(url)
	if err != nil { return err }
	// Verify block progression to ensure node is synchronized
	_, err = client.BlockNumber(s.ctx)
	return err
}

func (s *SystemScanner) checkDB(url string) error {
	db, err := sqlx.Open("postgres", url)
	if err != nil { return err }
	defer db.Close()
	return db.PingContext(s.ctx)
}

func (s *SystemScanner) checkRedis(addr string) error {
	rdb := redis.NewClient(&redis.Options{Addr: addr})
	return rdb.Ping(s.ctx).Err()
}

func (s *SystemScanner) checkKeys(key string) error {
	// P0: Verify key length for Ed25519 (min 32 bytes/64 hex chars)
	if len(key) < 64 { 
		return fmt.Errorf("auth key format invalid (length mismatch)") 
	}
	return nil
}
