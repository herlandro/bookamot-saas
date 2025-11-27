#!/bin/bash

################################################################################
# BookaMOT SaaS - Manual VPS Deployment Script (Docker / docker-compose)
#
# This script automates deployment of the BookaMOT SaaS application
# directly on a VPS using Docker and docker-compose,
# WITHOUT using Coolify.
#
# ⚠️ IMPORTANT:
#   - If you are using **Coolify 4.x**, you do NOT need (and should not)
#     run this script. Use the Coolify Dashboard instead, as described in:
#     SaaS/deployment/COOLIFY-DEPLOYMENT.md
#
#   - This script exists only as an alternative path for
#     manual deployments on a Docker-only VPS.
#
# HOW TO USE (manual path, without Coolify):
#   1. Clone the repository into a directory on the VPS (e.g. /home/admin/projects/bookamot-saas):
#      $ git clone https://github.com/<your-username>/bookamot-saas.git /home/admin/projects/bookamot-saas
#      $ cd /home/admin/projects/bookamot-saas
#
#   2. Create and configure a .env file from .env.example
#      with all **production** values.
#
#   3. Run the script:
#      $ bash scripts/deploy-vps.sh
#
# Prerequisites (manual mode):
#   - VPS with Ubuntu 24.04 LTS
#   - Docker and Docker Compose installed
#   - SSH access to the VPS
#   - Repository cloned on the VPS (e.g. /home/admin/projects/bookamot-saas)
#   - .env file configured with production variables
#
# Version: 1.0.0
# Date: 2025-11-24
################################################################################

set -e  # Exit immediately if any command fails

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"
DOCKER_COMPOSE_FILE="$PROJECT_DIR/docker-compose.yml"
DOCKERFILE="$PROJECT_DIR/Dockerfile"

################################################################################
# Helper Functions
################################################################################

# Print messages with colors
print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking prerequisites"

    local missing_tools=0

    # Check Docker
    if command_exists docker; then
        print_success "Docker installed: $(docker --version)"
    else
        print_error "Docker not found. Please install Docker first."
        missing_tools=$((missing_tools + 1))
    fi

    # Check Docker Compose
    if command_exists docker-compose; then
        print_success "Docker Compose installed: $(docker-compose --version)"
    else
        print_error "Docker Compose not found. Please install Docker Compose first."
        missing_tools=$((missing_tools + 1))
    fi

    # Check .env file
    if [ -f "$ENV_FILE" ]; then
        print_success ".env file found"
    else
        print_error ".env file not found at $ENV_FILE"
        print_info "Copy .env.example to .env and configure production variables"
        missing_tools=$((missing_tools + 1))
    fi

    # Check Dockerfile
    if [ -f "$DOCKERFILE" ]; then
        print_success "Dockerfile found"
    else
        print_error "Dockerfile not found at $DOCKERFILE"
        missing_tools=$((missing_tools + 1))
    fi

    # Check docker-compose.yml
    if [ -f "$DOCKER_COMPOSE_FILE" ]; then
        print_success "docker-compose.yml found"
    else
        print_error "docker-compose.yml not found at $DOCKER_COMPOSE_FILE"
        missing_tools=$((missing_tools + 1))
    fi

    if [ $missing_tools -gt 0 ]; then
        print_error "Prerequisites not satisfied. Fix the errors above."
        exit 1
    fi

    print_success "All prerequisites verified successfully!"
}

# Validate environment variables
validate_env_variables() {
    print_header "Validating environment variables"

    local required_vars=(
        "NODE_ENV"
        "DOMAIN"
        "DB_USER"
        "DB_PASSWORD"
        "DB_NAME"
        "DATABASE_URL"
        "NEXTAUTH_SECRET"
        "NEXTAUTH_URL"
    )

    local missing_vars=0

    # Load variables from .env file
    set -a
    source "$ENV_FILE"
    set +a

    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "Required variable not set: $var"
            missing_vars=$((missing_vars + 1))
        else
            print_success "Variable set: $var"
        fi
    done

    if [ $missing_vars -gt 0 ]; then
        print_error "$missing_vars required variables are missing"
        exit 1
    fi

    print_success "All environment variables are configured!"
}

# Create required directories
create_directories() {
    print_header "Creating required directories"

    local dirs=(
        "$PROJECT_DIR/data/postgres"
        "$PROJECT_DIR/logs"
    )

    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_success "Directory created: $dir"
        else
            print_info "Directory already exists: $dir"
        fi
    done
}

# Build Docker image
build_docker_image() {
    print_header "Building Docker image"

    print_info "Building Docker image for BookaMOT SaaS..."

    if docker-compose -f "$DOCKER_COMPOSE_FILE" build; then
        print_success "Docker image built successfully!"
    else
        print_error "Failed to build Docker image"
        exit 1
    fi
}

# Start containers
start_containers() {
    print_header "Starting Docker containers"

    print_info "Starting PostgreSQL..."
    if docker-compose -f "$DOCKER_COMPOSE_FILE" up -d postgres; then
        print_success "PostgreSQL started"
    else
        print_error "Failed to start PostgreSQL"
        exit 1
    fi

    # Wait for PostgreSQL to be ready
    print_info "Waiting for PostgreSQL to be ready..."
    sleep 5

    print_info "Starting BookaMOT SaaS application..."
    if docker-compose -f "$DOCKER_COMPOSE_FILE" up -d app; then
        print_success "Application started"
    else
        print_error "Failed to start application"
        exit 1
    fi
}

# Check container health
check_health() {
    print_header "Checking container health"

    print_info "Waiting for the application to be ready (up to 60 seconds)..."

    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f "$DOCKER_COMPOSE_FILE" ps | grep -q "bookamot-app.*Up"; then
            print_success "Application container is running"

            # Check health endpoint
            if docker exec bookamot-app wget --quiet --tries=1 --spider http://localhost:3000/api/health 2>/dev/null; then
                print_success "Application is healthy!"
                return 0
            fi
        fi

        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    print_warning "Application is not fully ready yet, but containers are running"
    print_info "Check logs with: docker logs bookamot-app"
}

# Show deployment information
show_deployment_info() {
    print_header "Deployment information"

    set -a
    source "$ENV_FILE"
    set +a

    echo -e "${GREEN}Application deployed successfully!${NC}\n"

    echo "Deployment details:"
    echo "  Domain: $DOMAIN"
    echo "  Environment: $NODE_ENV"
    echo "  Database: $DB_NAME"
    echo ""

    echo "Next steps:"
    echo "  1. Check logs: docker logs -f bookamot-app"
    echo "  2. Access application: https://$DOMAIN"
    echo "  3. Check database: docker exec -it bookamot-postgres psql -U $DB_USER -d $DB_NAME"
    echo ""

    echo "Useful commands:"
    echo "  Check container status: docker-compose -f $DOCKER_COMPOSE_FILE ps"
    echo "  View logs: docker-compose -f $DOCKER_COMPOSE_FILE logs -f"
    echo "  Stop containers: docker-compose -f $DOCKER_COMPOSE_FILE down"
    echo "  Restart containers: docker-compose -f $DOCKER_COMPOSE_FILE restart"
    echo ""
}

# Create a database backup
backup_database() {
    print_header "Creating database backup"

    set -a
    source "$ENV_FILE"
    set +a

    local backup_dir="$PROJECT_DIR/backups"
    local backup_file="$backup_dir/backup-$(date +%Y%m%d-%H%M%S).sql"

    mkdir -p "$backup_dir"

    print_info "Creating database backup..."

    if docker exec bookamot-postgres pg_dump -U "$DB_USER" "$DB_NAME" > "$backup_file"; then
        print_success "Backup created: $backup_file"
    else
        print_warning "Failed to create backup (database might be empty)"
    fi
}

# Run database migrations
run_migrations() {
    print_header "Running database migrations"

    print_info "Migrations are executed automatically by the container entrypoint"
    print_info "Check logs to confirm: docker logs bookamot-app | grep -i migration"
}

################################################################################
# Main Function
################################################################################

main() {
    print_header "🚀 BookaMOT SaaS Deployment - Manual mode (without Coolify)"

    print_info "Starting deployment process..."
    print_info "Project directory: $PROJECT_DIR"

    # Run deployment steps
    check_prerequisites
    validate_env_variables
    create_directories
    build_docker_image
    backup_database
    start_containers
    run_migrations
    check_health
    show_deployment_info

    print_header "✨ Deployment Completed Successfully!"
}

# Run main function
main "$@"

