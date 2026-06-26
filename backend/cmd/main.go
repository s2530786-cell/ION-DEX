package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"

	"github.com/ion-dex-nuke/backend/indexer"
	"github.com/ion-dex-nuke/backend/security"
)

/**
 * @file main.go
 * @description ION DEX Backend entry point.
 * Connects Redis + PostgreSQL, starts health check, and waits for shutdown.
 */

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	log.Println("🚀 ION DEX Backend starting...")

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// ── Redis ──────────────────────────────────────────
	redisAddr := envOrDefault("REDIS_ADDR", "localhost:6379")
	rdb := redis.NewClient(&redis.Options{Addr: redisAddr})
	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Printf("⚠️  Redis unavailable at %s: %v (continuing without cache)", redisAddr, err)
	} else {
		log.Printf("✅ Redis connected: %s", redisAddr)
		defer rdb.Close()
	}

	// ── PostgreSQL ─────────────────────────────────────
	dbURL := envOrDefault("DATABASE_URL", "postgres://iondex:iondex_dev_2026@localhost:5432/iondex?sslmode=disable")
	db, err := sqlx.ConnectContext(ctx, "postgres", dbURL)
	if err != nil {
		log.Printf("⚠️  PostgreSQL unavailable: %v (continuing without DB)", err)
	} else {
		log.Println("✅ PostgreSQL connected")
		defer db.Close()
	}

	// ── Health Check ───────────────────────────────────
	scanner := indexer.NewHealthChecker(ctx, rdb, db)
	go scanner.Run(ctx)

	// ── Shadow Monitor ─────────────────────────────────
	_ = security.NewShadowMonitor(nil)

	log.Println("✅ ION DEX Backend initialized successfully")

	// ── Wait for shutdown ──────────────────────────────
	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
	<-sig
	log.Println("🛑 Shutting down...")
}

func envOrDefault(key, defaultVal string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultVal
}
