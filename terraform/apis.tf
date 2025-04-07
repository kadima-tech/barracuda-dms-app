

resource "google_project_service" "secret_manager_api" {
  project = local.project
  service = "secretmanager.googleapis.com"
}

resource "google_project_service" "compute_engine" {
  project = local.project
  service = "compute.googleapis.com"
}

resource "google_project_service" "dns_api" {
  project = local.project
  service = "dns.googleapis.com"
}

resource "google_project_service" "networking" {
  project = local.project
  service = "servicenetworking.googleapis.com"
}

resource "google_project_service" "sql_admin" {
  project = local.project
  service = "sqladmin.googleapis.com"
}

resource "google_project_service" "vpc_access" {
  project = local.project
  service = "vpcaccess.googleapis.com"
}
