package middleware

import (
	"strconv"
	"time"
	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
)

/**
 * @file prometheus.go
 * @description Production-grade telemetry middleware for ION DEX.
 * Tracks throughput, latency, and error rates at the routing and plugin level.
 */

var (
	httpRequests = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "ion_api_requests_total",
			Help: "Total number of API requests processed by the ION DEX gateway.",
		},
		[]string{"path", "method", "status"},
	)
	
	httpDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name: "ion_api_duration_seconds",
			Help: "Duration of API requests in seconds, bucketed for latency heatmap analysis.",
			Buckets: []float64{.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10},
		},
		[]string{"path"},
	)
)

func init() {
	prometheus.MustRegister(httpRequests, httpDuration)
}

// MonitorMiddleware injects telemetry hooks into the Gin request lifecycle.
func MonitorMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		
		// Process request
		c.Next()
		
		duration := time.Since(start).Seconds()
		status := strconv.Itoa(c.Writer.Status())
		path := c.FullPath()
		method := c.Request.Method

		// Record metrics
		httpRequests.WithLabelValues(path, method, status).Inc()
		httpDuration.WithLabelValues(path).Observe(duration)
	}
}
