package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
)

// GetUserMarks 返回特定用户在图表上的买卖标记
func GetUserMarks(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		pool := r.URL.Query().Get("symbol")
		userAddress := r.URL.Query().Get("user_address")
		from, _ := strconv.ParseInt(r.URL.Query().Get("from"), 10, 64)
		to, _ := strconv.ParseInt(r.URL.Query().Get("to"), 10, 64)

		if userAddress == "" {
			json.NewEncoder(w).Encode([]interface{}{}) // 匿名用户返回空数组
			return
		}

		// 假设 amount_in 为正表示买入，为负(或另一列)表示卖出。此处设定 is_buy 逻辑标志
		rows, err := db.Query(`
			SELECT EXTRACT(EPOCH FROM time)::BIGINT, transaction_hash, is_buy, price 
			FROM dex_swaps 
			WHERE pool_address = $1 AND user_address = $2 AND time >= to_timestamp($3) AND time <= to_timestamp($4)`, 
			pool, userAddress, from, to)
			
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var marks []map[string]interface{}
		for rows.Next() {
			var time int64
			var txHash string
			var isBuy bool
			var price float64
			rows.Scan(&time, &txHash, &isBuy, &price)

			color := "#F23645" // Sell (Red)
			label := "S"
			if isBuy {
				color = "#089981" // Buy (Green)
				label = "B"
			}

			marks = append(marks, map[string]interface{}{
				"id":             txHash,
				"time":           time,
				"color":          color,
				"label":          label,
				"labelFontColor": "#FFFFFF",
				"minSize":        14,
			})
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(marks)
	}
}
