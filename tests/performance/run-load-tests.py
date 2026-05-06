#!/usr/bin/env python3
"""
MobileShop Load Testing Script
Runs different load testing scenarios using Locust
"""

import argparse
import subprocess
import sys
import os
import time
from datetime import datetime

def run_locust_test(test_type, host, users=None, spawn_rate=None, run_time=None, locustfile="locustfile.py"):
    """Run Locust test with specified parameters"""
    
    # Default parameters
    if users is None:
        from locust.conf import get_test_config
        config = get_test_config(test_type)
        users = config["users"]
        spawn_rate = config["spawn_rate"]
        run_time = config["run_time"]
    
    print(f"🚀 Starting {test_type.upper()} load test...")
    print(f"📊 Users: {users}")
    print(f"⚡ Spawn Rate: {users}/second")
    print(f"⏱️  Run Time: {run_time}")
    print(f"🌐 Host: {host}")
    print(f"📁 Locustfile: {locustfile}")
    print("-" * 50)
    
    # Build Locust command
    cmd = [
        "locust",
        "-f", locustfile,
        "--host", host,
        "--users", str(users),
        "--spawn-rate", str(spawn_rate),
        "--run-time", run_time,
        "--html", f"reports/{test_type}_report.html",
        "--csv", f"reports/{test_type}_report",
        "--headless"
    ]
    
    # Create reports directory
    os.makedirs("reports", exist_ok=True)
    
    # Run the test
    start_time = datetime.now()
    try:
        result = subprocess.run(cmd, cwd=".", capture_output=True, text=True)
        
        end_time = datetime.now()
        duration = end_time - start_time
        
        print(f"\n✅ Test completed in {duration}")
        print(f"📄 Report saved to reports/{test_type}_report.html")
        
        if result.returncode != 0:
            print(f"❌ Locust failed with return code {result.returncode}")
            print(f"Error: {result.stderr}")
            return False
            
        return True
        
    except KeyboardInterrupt:
        print("\n⚠️  Test interrupted by user")
        return False
    except Exception as e:
        print(f"❌ Error running Locust: {e}")
        return False

def run_all_scenarios(host):
    """Run all load test scenarios"""
    
    scenarios = ["basic", "medium", "high", "stress"]
    
    print("🎯 Running all load test scenarios...")
    print("=" * 60)
    
    for scenario in scenarios:
        print(f"\n🔄 Running {scenario.upper()} scenario...")
        
        success = run_locust_test(scenario, host)
        
        if not success:
            print(f"❌ {scenario.upper()} scenario failed")
            return False
        
        # Wait between scenarios
        if scenario != scenarios[-1]:
            print("⏳ Waiting 30 seconds before next scenario...")
            time.sleep(30)
    
    print("\n🎉 All scenarios completed successfully!")
    return True

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="MobileShop Load Testing")
    parser.add_argument("--type", choices=["basic", "medium", "high", "stress", "soak", "all"],
                       default="basic", help="Type of load test to run")
    parser.add_argument("--host", default="http://localhost:3001",
                       help="Target host for load testing")
    parser.add_argument("--users", type=int, help="Number of users to simulate")
    parser.add_argument("--spawn-rate", type=int, help="Rate at which to spawn users")
    parser.add_argument("--run-time", help="Duration of the test (e.g., 5m, 1h)")
    parser.add_argument("--locustfile", default="locustfile.py",
                       help="Path to Locust file")
    
    args = parser.parse_args()
    
    print("🔧 MobileShop Load Testing Tool")
    print("=" * 40)
    
    if args.type == "all":
        success = run_all_scenarios(args.host)
    else:
        success = run_locust_test(
            args.type, 
            args.host, 
            args.users, 
            args.spawn_rate, 
            args.run_time,
            args.locustfile
        )
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
