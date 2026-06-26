import redis
import json
import uuid
import time
import random

/**
 * @file mock_producer.py
 * @description High-frequency social data simulator for ION DEX stress testing.
 * Injects simulated tweets/messages into the Redis Stream to test NLP inference throughput.
 */

r = redis.Redis(host='redis', port=6379)

topics = [
    "$ION is mooning! 🚀", 
    "Sell all #ION, panic! 📉", 
    "ION network is slow today...", 
    "Bullish on #ION ecosystem", 
    "The market looks scary, stay safe",
    "New institutional liquidity flowing into ION DEX",
    "GIVEAWAY! Just kidding, filtering this noise.",
    "Whale accumulation detected on ION/USDC pair"
]

print("🚀 ION DEX Stress-Test Data Generator Active...")
print("Target: stream:raw_social | Rate: ~100 msgs/sec")

while True:
    try:
        msg = {
            'id': str(uuid.uuid4()),
            'text': random.choice(topics),
            'timestamp': time.time()
        }
        # Latch to the social stream for NLP worker consumption
        r.xadd('stream:raw_social', msg)
        
        # Adjustable injection rate (0.01s = 100 TPS)
        time.sleep(0.01) 
    except Exception as e:
        print(f"❌ Injection error: {e}")
        time.sleep(1)