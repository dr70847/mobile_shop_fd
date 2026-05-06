import os
from locust import HttpUser, between
from locust.env import Environment
from locust.stats import stats_printer, stats_history

class LoadTestConfig:
    """Configuration for load testing scenarios"""
    
    # Basic load test - 100 users
    BASIC_USERS = 100
    BASIC_SPAWN_RATE = 10
    BASIC_RUN_TIME = "5m"
    
    # Medium load test - 500 users
    MEDIUM_USERS = 500
    MEDIUM_SPAWN_RATE = 25
    MEDIUM_RUN_TIME = "10m"
    
    # High load test - 1000+ users
    HIGH_USERS = 1000
    HIGH_SPAWN_RATE = 50
    HIGH_RUN_TIME = "15m"
    
    # Stress test - 2000 users
    STRESS_USERS = 2000
    STRESS_SPAWN_RATE = 100
    STRESS_RUN_TIME = "5m"
    
    # Soak test - 200 users for extended period
    SOAK_USERS = 200
    SOAK_SPAWN_RATE = 20
    SOAK_RUN_TIME = "1h"

def get_test_config(test_type="basic"):
    """Get test configuration based on test type"""
    configs = {
        "basic": {
            "users": LoadTestConfig.BASIC_USERS,
            "spawn_rate": LoadTestConfig.BASIC_SPAWN_RATE,
            "run_time": LoadTestConfig.BASIC_RUN_TIME
        },
        "medium": {
            "users": LoadTestConfig.MEDIUM_USERS,
            "spawn_rate": LoadTestConfig.MEDIUM_SPAWN_RATE,
            "run_time": LoadTestConfig.MEDIUM_RUN_TIME
        },
        "high": {
            "users": LoadTestConfig.HIGH_USERS,
            "spawn_rate": LoadTestConfig.HIGH_SPAWN_RATE,
            "run_time": LoadTestConfig.HIGH_RUN_TIME
        },
        "stress": {
            "users": LoadTestConfig.STRESS_USERS,
            "spawn_rate": LoadTestConfig.STRESS_SPAWN_RATE,
            "run_time": LoadTestConfig.STRESS_RUN_TIME
        },
        "soak": {
            "users": LoadTestConfig.SOAK_USERS,
            "spawn_rate": LoadTestConfig.SOAK_SPAWN_RATE,
            "run_time": LoadTestConfig.SOAK_RUN_TIME
        }
    }
    
    return configs.get(test_type, configs["basic"])

# Performance thresholds
class PerformanceThresholds:
    """Performance thresholds for monitoring"""
    
    # Response time thresholds (in milliseconds)
    FAST_RESPONSE = 200  # Excellent
    ACCEPTABLE_RESPONSE = 500  # Good
    SLOW_RESPONSE = 1000  # Acceptable
    CRITICAL_RESPONSE = 2000  # Poor
    
    # Error rate thresholds (in percentage)
    ERROR_RATE_OK = 0.1  # 0.1%
    ERROR_RATE_WARNING = 1.0  # 1%
    ERROR_RATE_CRITICAL = 5.0  # 5%
    
    # Throughput thresholds (requests per second)
    MIN_THROUGHPUT = 50  # Minimum acceptable
    GOOD_THROUGHPUT = 100  # Good throughput
    EXCELLENT_THROUGHPUT = 200  # Excellent throughput

# Target endpoints for testing
class TargetEndpoints:
    """Critical endpoints to test"""
    
    API_ENDPOINTS = [
        "/api/v1/products",
        "/api/v1/products/1",
        "/api/v1/auth/login",
        "/api/v1/auth/register",
        "/api/v1/orders/my",
        "/api/v1/orders/checkout"
    ]
    
    WEB_ENDPOINTS = [
        "/",
        "/#catalog",
        "/login",
        "/signup",
        "/orders"
    ]
