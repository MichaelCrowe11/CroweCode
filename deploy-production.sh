#!/bin/bash

# CroweCode Platform - Production Deployment Script
# Deploy to VPS at crowecode.com with enhanced AI features

set -e

echo "🚀 Deploying CroweCode Platform to Production"
echo "=============================================="

# Check prerequisites
check_requirements() {
    echo "📋 Checking requirements..."
    
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose is not installed"
        exit 1
    fi
    
    echo "✅ All requirements met"
}

# Build the application
build_app() {
    echo "🔨 Building Next.js application..."
    npm install
    npm run build
    echo "✅ Build complete"
}

# Set up environment variables
setup_env() {
    echo "🔐 Setting up environment variables..."
    
    if [ ! -f .env.production ]; then
        cp .env.example .env.production
        echo "⚠️  Please update .env.production with your credentials"
    fi
    
    # Generate secure passwords if not set
    if [ -z "$CODE_SERVER_PASSWORD" ]; then
        export CODE_SERVER_PASSWORD=$(openssl rand -base64 32)
        echo "Generated CODE_SERVER_PASSWORD: $CODE_SERVER_PASSWORD"
    fi
    
    if [ -z "$DB_PASSWORD" ]; then
        export DB_PASSWORD=$(openssl rand -base64 32)
        echo "Generated DB_PASSWORD: $DB_PASSWORD"
    fi
}

# Deploy with Docker Compose
deploy_docker() {
    echo "🐳 Starting Docker containers..."
    
    # Create necessary directories
    mkdir -p workspace config extensions ssl
    
    # Pull latest images
    docker-compose pull
    
    # Start services
    docker-compose up -d
    
    echo "✅ Docker containers started"
}

# Install VSCode extensions
install_extensions() {
    echo "📦 Installing VSCode extensions..."
    
    docker exec crowe-ide code-server \
        --install-extension ms-python.python \
        --install-extension dbaeumer.vscode-eslint \
        --install-extension esbenp.prettier-vscode \
        --install-extension ms-azuretools.vscode-docker \
        --install-extension GitHub.copilot \
        --install-extension prisma.prisma \
        --install-extension bradlc.vscode-tailwindcss
    
    echo "✅ Extensions installed"
}

# Set up SSL certificates
setup_ssl() {
    echo "🔒 Setting up SSL certificates..."
    
    if [ ! -f ssl/cert.pem ]; then
        # For production, use Let's Encrypt
        if [ "$ENVIRONMENT" = "production" ]; then
            docker run --rm \
                -v $(pwd)/ssl:/etc/letsencrypt \
                certbot/certbot certonly \
                --standalone \
                -d croweos.com \
                -d www.croweos.com \
                --non-interactive \
                --agree-tos \
                --email admin@croweos.com
        else
            # Generate self-signed certificate for development
            openssl req -x509 -newkey rsa:4096 \
                -keyout ssl/key.pem \
                -out ssl/cert.pem \
                -days 365 -nodes \
                -subj "/CN=localhost"
        fi
    fi
    
    echo "✅ SSL certificates configured"
}

# Health check
health_check() {
    echo "🏥 Running health checks..."
    
    # Check if services are running
    services=("crowe-ide" "crowe-db" "crowe-cache" "crowe-proxy")
    
    for service in "${services[@]}"; do
        if docker ps | grep -q $service; then
            echo "✅ $service is running"
        else
            echo "❌ $service is not running"
            exit 1
        fi
    done
    
    # Check if VSCode server is accessible
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 | grep -q "200\|302"; then
        echo "✅ VSCode server is accessible"
    else
        echo "⚠️  VSCode server is not accessible yet"
    fi
    
    echo "✅ All health checks passed"
}

# Main deployment flow
main() {
    check_requirements
    build_app
    setup_env
    setup_ssl
    deploy_docker
    
    echo "⏳ Waiting for services to start..."
    sleep 10
    
    install_extensions
    health_check
    
    echo ""
    echo "🎉 Deployment Complete!"
    echo "======================"
    echo "🌐 Main App: https://croweos.com"
    echo "💻 VSCode IDE: https://croweos.com/vscode"
    echo "🔑 VSCode Password: $CODE_SERVER_PASSWORD"
    echo ""
    echo "📚 Documentation: https://croweos.com/docs"
    echo "💬 Support: support@crowelogic.com"
}

# Run deployment
main "$@"