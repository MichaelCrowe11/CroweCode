# Terraform variables for dulcet-nucleus-450804-a3
# This file contains the specific values for your GCP deployment

project_id  = "dulcet-nucleus-450804-a3"
region      = "us-central1"
zone        = "us-central1-a"
environment = "production"

# Optional: Custom naming
app_name = "crowe-logic-platform"

# Database configuration
db_tier = "db-g1-small"  # Change to db-n1-standard-2 for production workloads
db_deletion_protection = true

# Redis configuration
redis_memory_size_gb = 1
redis_tier = "BASIC"  # BASIC or STANDARD_HA for high availability

# Cloud Run configuration
cloud_run_memory = "2Gi"
cloud_run_cpu = "2"
cloud_run_min_instances = 1
cloud_run_max_instances = 100

# GKE configuration (if using Kubernetes)
gke_node_count = 3
gke_machine_type = "e2-standard-4"

# Enable services
enable_cloud_run = true
enable_gke = false  # Set to true if you want to deploy to GKE as well
enable_vertex_ai_workbench = false  # Set to true for development environment
