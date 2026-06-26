package main

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/spf13/cobra"
	"github.com/your-project/internal/scanner"
	"github.com/your-project/internal/execution"
	"github.com/your-project/pkg/ion/logger"
)

/**
 * @file main.go
 * @description The 'Gatekeeper' entry point for ION DEX.
 * Integrates the SystemScanner pre-flight check into the execution pipeline.
 */

var dryRun bool

func init() {
	// Add the --dry-run safety flag to the run command
	runCmd.Flags().BoolVar(&dryRun, "dry-run", false, "Scan config and environment health without starting trading loop")
}

var runCmd = &cobra.Command{
	Use:   "run",
	Short: "Start the ION Sniper Engine",
	Run: func(cmd *cobra.Command, args []string) {
		// 1. Initialize Context and Audit Logger
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		logger.InitAuditLogger()

		// 2. Load System Configuration (Implicitly defined for integration)
		config := loadConfigFromEnv()

		// 3. Mandatory Pre-flight Diagnostic: SystemScanner
		// Acts as the 'Security Gate' protecting capital from misconfiguration.
		scannerObj := scanner.NewSystemScanner(ctx, logger.Logger)
		if err := scannerObj.PerformHealthCheck(config); err != nil {
			logger.Logger.Error("System pre-flight check failed! Aborting launch.", "error", err)
			os.Exit(1) 
		}
		
		logger.Logger.Info("✅ System health check passed. Dependencies verified.")

		// 4. Mode Determination
		if dryRun {
			logger.Logger.Info("🚀 LATCH PERMITTED: System ready for Mainnet latch. Mode: DRY_RUN.")
			return
		}

		// 5. Production Latch
		logger.Logger.Info("📡 INITIATING MAINNET LATCH...")
		engine := execution.NewSniperEngine(config)
		if err := engine.Start(ctx); err != nil {
			logger.Logger.Error("CRITICAL: Engine failure post-latch", "error", err)
			os.Exit(1)
		}
	},
}

func loadConfigFromEnv() scanner.Config {
	return scanner.Config{
		RedisAddr: os.Getenv("REDIS_ADDR"),
		RPCUrl:    os.Getenv("ION_RPC_URL"),
		DBUrl:     os.Getenv("DATABASE_URL"),
		AuthKey:   os.Getenv("HOT_WALLET_KEY"),
	}
}

func main() {
	var rootCmd = &cobra.Command{Use: "ion"}
	rootCmd.AddCommand(runCmd)
	rootCmd.Execute()
}
