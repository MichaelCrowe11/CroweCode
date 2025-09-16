# Terraform configuration for GCP infrastructure
# Sets up all required services for Crowe Logic Platform with Vertex AI

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }
  
  backend "gcs" {
    bucket = "crowe-logic-terraform-state"
    prefix = "terraform/state"
  }
}

# Variables
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "GCP Zone"
  type        = string
  default     = "us-central1-a"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

# Provider configuration
provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "aiplatform.googleapis.com",           # Vertex AI
    "cloudapis.googleapis.com",            # Google Cloud APIs
    "cloudbuild.googleapis.com",           # Cloud Build
    "run.googleapis.com",                  # Cloud Run
    "sqladmin.googleapis.com",             # Cloud SQL
    "redis.googleapis.com",                # Memorystore for Redis
    "secretmanager.googleapis.com",        # Secret Manager
    "cloudresourcemanager.googleapis.com", # Resource Manager
    "container.googleapis.com",            # GKE
    "compute.googleapis.com",              # Compute Engine
    "monitoring.googleapis.com",           # Cloud Monitoring
    "logging.googleapis.com",              # Cloud Logging
    "storage.googleapis.com",              # Cloud Storage
    "iam.googleapis.com",                  # IAM
    "ml.googleapis.com",                   # Machine Learning
    "notebooks.googleapis.com",            # Vertex AI Workbench
  ])
  
  service            = each.key
  disable_on_destroy = false
}

# Service Account for Vertex AI
resource "google_service_account" "vertex_ai_sa" {
  account_id   = "vertex-ai-service-account"
  display_name = "Vertex AI Service Account"
  description  = "Service account for Vertex AI operations"
}

# IAM roles for Vertex AI service account
resource "google_project_iam_member" "vertex_ai_roles" {
  for_each = toset([
    "roles/aiplatform.user",
    "roles/aiplatform.predictor",
    "roles/aiplatform.admin",
    "roles/ml.developer",
    "roles/storage.objectViewer",
    "roles/logging.logWriter",
  ])
  
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.vertex_ai_sa.email}"
}

# Service Account for Cloud Run
resource "google_service_account" "cloud_run_sa" {
  account_id   = "cloud-run-service-account"
  display_name = "Cloud Run Service Account"
  description  = "Service account for Cloud Run application"
}

# IAM roles for Cloud Run service account
resource "google_project_iam_member" "cloud_run_roles" {
  for_each = toset([
    "roles/cloudsql.client",
    "roles/redis.editor",
    "roles/secretmanager.secretAccessor",
    "roles/aiplatform.user",
    "roles/storage.objectAdmin",
  ])
  
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# Cloud SQL Instance (PostgreSQL)
resource "google_sql_database_instance" "postgres" {
  name             = "crowe-db-${var.environment}"
  database_version = "POSTGRES_15"
  region           = var.region
  
  settings {
    tier              = "db-f1-micro" # Change to db-n1-standard-2 for production
    availability_type = "ZONAL"       # Change to REGIONAL for production
    
    backup_configuration {
      enabled                        = true
      start_time                     = "02:00"
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = 7
      
      backup_retention_settings {
        retained_backups = 30
        retention_unit   = "COUNT"
      }
    }
    
    ip_configuration {
      ipv4_enabled    = true
      private_network = google_compute_network.vpc.id
      
      authorized_networks {
        name  = "allow-all" # Restrict in production
        value = "0.0.0.0/0"
      }
    }
    
    database_flags {
      name  = "max_connections"
      value = "100"
    }
    
    insights_config {
      query_insights_enabled  = true
      query_string_length     = 1024
      record_application_tags = true
      record_client_address   = true
    }
  }
  
  deletion_protection = true
}

# Cloud SQL Database
resource "google_sql_database" "database" {
  name     = "crowe_platform"
  instance = google_sql_database_instance.postgres.name
}

# Cloud SQL User
resource "google_sql_user" "db_user" {
  name     = "crowe_admin"
  instance = google_sql_database_instance.postgres.name
  password = random_password.db_password.result
}

# Random password for database
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Store database password in Secret Manager
resource "google_secret_manager_secret" "db_password" {
  secret_id = "db-password"
  
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_password.db_password.result
}

# VPC Network
resource "google_compute_network" "vpc" {
  name                    = "crowe-vpc-${var.environment}"
  auto_create_subnetworks = false
}

# VPC Subnet
resource "google_compute_subnetwork" "subnet" {
  name          = "crowe-subnet-${var.environment}"
  network       = google_compute_network.vpc.id
  region        = var.region
  ip_cidr_range = "10.0.0.0/24"
  
  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "10.1.0.0/16"
  }
  
  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "10.2.0.0/20"
  }
}

# Cloud Memorystore for Redis
resource "google_redis_instance" "cache" {
  name               = "crowe-redis-${var.environment}"
  tier               = "BASIC"
  memory_size_gb     = 1
  region             = var.region
  redis_version      = "REDIS_7_0"
  display_name       = "Crowe Logic Platform Redis Cache"
  
  authorized_network = google_compute_network.vpc.id
  connect_mode       = "PRIVATE_SERVICE_ACCESS"
  
  redis_configs = {
    "maxmemory-policy" = "allkeys-lru"
  }
}

# Cloud Storage Bucket for uploads
resource "google_storage_bucket" "uploads" {
  name          = "${var.project_id}-crowe-uploads"
  location      = var.region
  storage_class = "STANDARD"
  
  uniform_bucket_level_access = true
  
  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }
  
  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type          = "SetStorageClass"
      storage_class = "ARCHIVE"
    }
  }
  
  versioning {
    enabled = true
  }
}

# Cloud Storage Bucket for Model Garden models
resource "google_storage_bucket" "model_garden" {
  name          = "${var.project_id}-model-garden"
  location      = var.region
  storage_class = "STANDARD"
  
  uniform_bucket_level_access = true
  
  versioning {
    enabled = true
  }
}

# Vertex AI Workbench Instance (optional for development)
resource "google_notebooks_instance" "vertex_workbench" {
  count = var.environment == "development" ? 1 : 0
  
  name         = "crowe-vertex-workbench"
  location     = var.zone
  machine_type = "n1-standard-4"
  
  vm_image {
    project      = "deeplearning-platform-release"
    image_family = "common-cpu"
  }
  
  install_gpu_driver = false
  
  boot_disk_type    = "PD_STANDARD"
  boot_disk_size_gb = 100
  
  network = google_compute_network.vpc.id
  subnet  = google_compute_subnetwork.subnet.id
  
  service_account = google_service_account.vertex_ai_sa.email
}

# Secrets for application
resource "google_secret_manager_secret" "jwt_secret" {
  secret_id = "jwt-secret"
  
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "jwt_secret" {
  secret      = google_secret_manager_secret.jwt_secret.id
  secret_data = random_password.jwt_secret.result
}

resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

resource "google_secret_manager_secret" "nextauth_secret" {
  secret_id = "nextauth-secret"
  
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "nextauth_secret" {
  secret      = google_secret_manager_secret.nextauth_secret.id
  secret_data = random_password.nextauth_secret.result
}

resource "random_password" "nextauth_secret" {
  length  = 64
  special = true
}

# Vertex AI Endpoint for Model Garden
resource "google_vertex_ai_endpoint" "model_garden_endpoint" {
  provider     = google-beta
  name         = "crowe-model-garden-endpoint"
  display_name = "Crowe Logic Model Garden Endpoint"
  description  = "Endpoint for Model Garden models"
  location     = var.region
  
  labels = {
    environment = var.environment
    application = "crowe-logic-platform"
  }
}

# Cloud Run Service
resource "google_cloud_run_service" "app" {
  name     = "crowe-logic-platform"
  location = var.region
  
  template {
    spec {
      service_account_name = google_service_account.cloud_run_sa.email
      
      containers {
        image = "gcr.io/${var.project_id}/crowe-logic-platform:latest"
        
        resources {
          limits = {
            cpu    = "2"
            memory = "2Gi"
          }
        }
        
        env {
          name  = "NODE_ENV"
          value = "production"
        }
        
        env {
          name  = "GCP_PROJECT_ID"
          value = var.project_id
        }
        
        env {
          name  = "GCP_LOCATION"
          value = var.region
        }
        
        env {
          name  = "DATABASE_URL"
          value = "postgresql://${google_sql_user.db_user.name}:${random_password.db_password.result}@/${google_sql_database.database.name}?host=/cloudsql/${google_sql_database_instance.postgres.connection_name}"
        }
        
        env {
          name  = "REDIS_URL"
          value = "redis://${google_redis_instance.cache.host}:${google_redis_instance.cache.port}"
        }
      }
    }
    
    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale"      = "1"
        "autoscaling.knative.dev/maxScale"      = "100"
        "run.googleapis.com/cloudsql-instances" = google_sql_database_instance.postgres.connection_name
        "run.googleapis.com/cpu-throttling"     = "false"
      }
    }
  }
  
  traffic {
    percent         = 100
    latest_revision = true
  }
  
  depends_on = [
    google_project_service.required_apis
  ]
}

# Cloud Run IAM to allow public access
resource "google_cloud_run_service_iam_member" "public_access" {
  service  = google_cloud_run_service.app.name
  location = google_cloud_run_service.app.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Outputs
output "cloud_run_url" {
  value = google_cloud_run_service.app.status[0].url
}

output "database_connection_name" {
  value = google_sql_database_instance.postgres.connection_name
}

output "redis_host" {
  value = google_redis_instance.cache.host
}

output "vertex_ai_endpoint" {
  value = google_vertex_ai_endpoint.model_garden_endpoint.name
}
