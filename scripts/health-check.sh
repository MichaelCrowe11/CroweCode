#!/bin/bash

# CroweCode Platform - Enhanced Health Check Script
# Comprehensive health monitoring for all services

set -e

# Configuration
DOMAIN="${DOMAIN:-crowecode.com}"
API_URL="https://$DOMAIN"
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL}"
CHECK_INTERVAL=60  # seconds
MAX_RETRIES=3
ALERT_THRESHOLD=2  # consecutive failures before alert
TIMEOUT=10

# Health check results
declare -A check_results
declare -A failure_counts

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Send alert to Slack
send_alert() {
    local severity=$1
    local service=$2
    local message=$3
    
    if [ -n "$SLACK_WEBHOOK" ]; then
        local color="warning"
        case $severity in
            "critical") color="danger" ;;
            "warning") color="warning" ;;
            "ok") color="good" ;;
        esac
        
        curl -s -X POST "$SLACK_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d "{
                \"text\": \"Health Check Alert: ${service}\",
                \"attachments\": [{
                    \"color\": \"${color}\",
                    \"fields\": [
                        {\"title\": \"Service\", \"value\": \"${service}\", \"short\": true},
                        {\"title\": \"Status\", \"value\": \"${severity}\", \"short\": true},
                        {\"title\": \"Message\", \"value\": \"${message}\", \"short\": false},
                        {\"title\": \"Time\", \"value\": \"$(date)\", \"short\": false}
                    ]
                }]
            }" > /dev/null
    fi
}

# Check API health endpoint
check_api() {
    echo -n "Checking API health... "
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/api/health" --connect-timeout 5 --max-time 10)
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}OK${NC}"
        check_results["api"]="ok"
        failure_counts["api"]=0
        return 0
    else
        echo -e "${RED}FAILED${NC} (HTTP $response)"
        check_results["api"]="failed"
        ((failure_counts["api"]++))
        return 1
    fi
}

# Check database connection
check_database() {
    echo -n "Checking database... "
    
    if PGPASSWORD="${DB_PASSWORD}" psql \
        -h "${DB_HOST:-localhost}" \
        -p "${DB_PORT:-5432}" \
        -U "${DB_USER:-crowe}" \
        -d "${DB_NAME:-crowe_platform}" \
        -c "SELECT 1" > /dev/null 2>&1; then
        echo -e "${GREEN}OK${NC}"
        check_results["database"]="ok"
        failure_counts["database"]=0
        return 0
    else
        echo -e "${RED}FAILED${NC}"
        check_results["database"]="failed"
        ((failure_counts["database"]++))
        return 1
    fi
}

# Check Redis connection
check_redis() {
    echo -n "Checking Redis... "
    
    if redis-cli -h "${REDIS_HOST:-localhost}" -p "${REDIS_PORT:-6379}" ping > /dev/null 2>&1; then
        echo -e "${GREEN}OK${NC}"
        check_results["redis"]="ok"
        failure_counts["redis"]=0
        return 0
    else
        echo -e "${RED}FAILED${NC}"
        check_results["redis"]="failed"
        ((failure_counts["redis"]++))
        return 1
    fi
}

# Check Docker containers
check_docker() {
    echo -n "Checking Docker containers... "

    local containers=("crowe-app" "crowe-db" "crowe-cache" "crowe-proxy" "crowe-mcp" "crowe-websocket" "crowe-ai-worker" "crowe-analysis" "crowe-prometheus" "crowe-grafana")
    local all_running=true
    local failed_containers=()

    for container in "${containers[@]}"; do
        if ! docker ps | grep -q "$container"; then
            failed_containers+=("$container")
            all_running=false
        fi
    done

    if $all_running; then
        echo -e "${GREEN}OK${NC} (${#containers[@]} containers running)"
        check_results["docker"]="ok"
        failure_counts["docker"]=0
        return 0
    else
        echo -e "${RED}FAILED${NC} (${failed_containers[*]} not running)"
        check_results["docker"]="failed"
        ((failure_counts["docker"]++))
        send_alert "critical" "Docker Services" "Containers not running: ${failed_containers[*]}"
        return 1
    fi
}

# Check disk space
check_disk_space() {
    echo -n "Checking disk space... "
    
    local usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$usage" -lt 80 ]; then
        echo -e "${GREEN}OK${NC} (${usage}% used)"
        check_results["disk"]="ok"
        failure_counts["disk"]=0
        return 0
    elif [ "$usage" -lt 90 ]; then
        echo -e "${YELLOW}WARNING${NC} (${usage}% used)"
        check_results["disk"]="warning"
        return 0
    else
        echo -e "${RED}CRITICAL${NC} (${usage}% used)"
        check_results["disk"]="critical"
        ((failure_counts["disk"]++))
        return 1
    fi
}

# Check memory usage
check_memory() {
    echo -n "Checking memory... "
    
    local total=$(free -m | awk 'NR==2{print $2}')
    local used=$(free -m | awk 'NR==2{print $3}')
    local usage=$((used * 100 / total))
    
    if [ "$usage" -lt 80 ]; then
        echo -e "${GREEN}OK${NC} (${usage}% used)"
        check_results["memory"]="ok"
        failure_counts["memory"]=0
        return 0
    elif [ "$usage" -lt 90 ]; then
        echo -e "${YELLOW}WARNING${NC} (${usage}% used)"
        check_results["memory"]="warning"
        return 0
    else
        echo -e "${RED}CRITICAL${NC} (${usage}% used)"
        check_results["memory"]="critical"
        ((failure_counts["memory"]++))
        return 1
    fi
}

# Check CroweCode specific services
check_crowecode_services() {
    echo -n "Checking CroweCode services... "

    local services=(
        "MCP Server:$API_URL/mcp/health"
        "WebSocket:$API_URL/ws"
        "AI Worker:$API_URL/admin/queues"
        "Analysis Engine:$API_URL/analysis/health"
        "Grafana:$API_URL/grafana"
        "Prometheus:$API_URL/metrics"
    )

    local failed_services=()

    for service_url in "${services[@]}"; do
        IFS=':' read -r service_name url <<< "$service_url"

        response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 "$url" 2>/dev/null || echo "000")

        if [[ ! "$response" =~ ^(200|302|404)$ ]]; then
            failed_services+=("$service_name($response)")
        fi
    done

    if [ ${#failed_services[@]} -eq 0 ]; then
        echo -e "${GREEN}OK${NC} (All services responding)"
        check_results["crowecode_services"]="ok"
        failure_counts["crowecode_services"]=0
        return 0
    else
        echo -e "${RED}FAILED${NC} (${failed_services[*]})"
        check_results["crowecode_services"]="failed"
        ((failure_counts["crowecode_services"]++))
        send_alert "critical" "CroweCode Services" "Failed services: ${failed_services[*]}"
        return 1
    fi
}

# Check SSL certificate expiry
check_ssl() {
    echo -n "Checking SSL certificate... "

    local domain="$DOMAIN"
    local expiry=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null | grep notAfter | cut -d= -f2)
    
    if [ -z "$expiry" ]; then
        echo -e "${RED}FAILED${NC} (Could not check)"
        check_results["ssl"]="failed"
        return 1
    fi
    
    local expiry_epoch=$(date -d "$expiry" +%s)
    local current_epoch=$(date +%s)
    local days_left=$(( (expiry_epoch - current_epoch) / 86400 ))
    
    if [ "$days_left" -gt 30 ]; then
        echo -e "${GREEN}OK${NC} (${days_left} days left)"
        check_results["ssl"]="ok"
        failure_counts["ssl"]=0
        return 0
    elif [ "$days_left" -gt 7 ]; then
        echo -e "${YELLOW}WARNING${NC} (${days_left} days left)"
        check_results["ssl"]="warning"
        send_alert "warning" "SSL Certificate" "Certificate expires in ${days_left} days"
        return 0
    else
        echo -e "${RED}CRITICAL${NC} (${days_left} days left)"
        check_results["ssl"]="critical"
        send_alert "critical" "SSL Certificate" "Certificate expires in ${days_left} days!"
        return 1
    fi
}

# Check application logs for errors
check_logs() {
    echo -n "Checking application logs... "
    
    local error_count=$(tail -n 1000 /var/log/crowe-platform/app.log 2>/dev/null | grep -c ERROR || true)
    
    if [ "$error_count" -eq 0 ]; then
        echo -e "${GREEN}OK${NC} (No recent errors)"
        check_results["logs"]="ok"
        return 0
    elif [ "$error_count" -lt 10 ]; then
        echo -e "${YELLOW}WARNING${NC} (${error_count} errors in last 1000 lines)"
        check_results["logs"]="warning"
        return 0
    else
        echo -e "${RED}CRITICAL${NC} (${error_count} errors in last 1000 lines)"
        check_results["logs"]="critical"
        send_alert "warning" "Application Logs" "${error_count} errors detected in recent logs"
        return 1
    fi
}

# Main health check loop
run_health_checks() {
    echo "========================================="
    echo "Crowe Logic Platform Health Check"
    echo "Time: $(date)"
    echo "========================================="
    
    local overall_status="ok"
    
    # Run all checks
    check_api || overall_status="degraded"
    check_database || overall_status="degraded"
    check_redis || overall_status="degraded"
    check_docker || overall_status="degraded"
    check_crowecode_services || overall_status="degraded"
    check_disk_space || overall_status="degraded"
    check_memory || overall_status="degraded"
    check_ssl || true  # Don't affect overall status
    check_logs || true  # Don't affect overall status
    
    echo "========================================="
    
    # Check for consecutive failures
    for service in "${!failure_counts[@]}"; do
        if [ "${failure_counts[$service]}" -ge "$ALERT_THRESHOLD" ]; then
            send_alert "critical" "$service" "Service has failed ${failure_counts[$service]} consecutive checks"
            overall_status="critical"
        fi
    done
    
    # Summary
    if [ "$overall_status" = "ok" ]; then
        echo -e "Overall Status: ${GREEN}HEALTHY${NC}"
    elif [ "$overall_status" = "degraded" ]; then
        echo -e "Overall Status: ${YELLOW}DEGRADED${NC}"
    else
        echo -e "Overall Status: ${RED}CRITICAL${NC}"
    fi
    
    # Write status to file for monitoring
    cat > /var/run/health-status.json << EOF
{
    "timestamp": "$(date -Iseconds)",
    "overall_status": "$overall_status",
    "checks": {
        "api": "${check_results[api]:-unknown}",
        "database": "${check_results[database]:-unknown}",
        "redis": "${check_results[redis]:-unknown}",
        "docker": "${check_results[docker]:-unknown}",
        "disk": "${check_results[disk]:-unknown}",
        "memory": "${check_results[memory]:-unknown}",
        "ssl": "${check_results[ssl]:-unknown}",
        "logs": "${check_results[logs]:-unknown}"
    }
}
EOF
    
    echo ""
}

# Initialize failure counts
failure_counts["api"]=0
failure_counts["database"]=0
failure_counts["redis"]=0
failure_counts["docker"]=0
failure_counts["disk"]=0
failure_counts["memory"]=0

# Run once or continuously based on argument
if [ "$1" = "--continuous" ]; then
    echo "Starting continuous health monitoring (interval: ${CHECK_INTERVAL}s)"
    while true; do
        run_health_checks
        sleep "$CHECK_INTERVAL"
    done
else
    run_health_checks
fi
