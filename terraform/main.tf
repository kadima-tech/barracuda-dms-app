terraform {
  backend "gcs" {
    bucket = "kadima-terraform"
    prefix = "barracuda-dms/workspaces"
  }
}

locals {
  env      = yamldecode(file("config/${terraform.workspace}.yml"))
  project  = local.env["project"]
  dns_name = terraform.workspace == "production" ? data.google_dns_managed_zone.env_dns_zone.dns_name : "${local.project}.${data.google_dns_managed_zone.env_dns_zone.dns_name}"
  host     = trimsuffix(local.dns_name, ".")
}

# Basics - Fetch & Setup projects and APIs
data "google_project" "project" {
  project_id = local.project
}

data "google_project" "container_registry_project" {
  project_id = "kadima-terraform"
}

module "cloudrun_project" {
  source = "git@github.com:kadima-tech/terraform-modules.git//cloud-run-project?ref=1.0.0"

  project                    = data.google_project.project.project_id
  gcloud_project_number      = data.google_project.project.number
  container_registry_project = data.google_project.container_registry_project.project_id

  depends_on = [
    google_project_service.secret_manager_api
  ]
}

# Not every project needs one but it's frequent enough
# module "database" {
#   source = "git@github.com:kadima-tech/terraform-modules.git//database"

#   project             = local.project
#   name                = "main"
#   private_network     = google_compute_network.private.self_link
#   region              = "europe-west1"
#   deletion_protection = true

#   depends_on = [
#     google_service_networking_connection.private_vpc_connection,
#     google_project_service.networking
#   ]
# }

module "frontend" {
  project                     = data.google_project.project.project_id
  source                      = "git@github.com:kadima-tech/terraform-modules.git//cloud-run-uncontrolled"
  name                        = "web"
  loadbalancer_backend_create = false
  allow_unauthenticed_access  = true

  ingress       = "all"
  min_instances = 0
  max_instances = 1

  env = [
    { key = "NODE_ENV", value = terraform.workspace }
  ]

  depends_on = [module.cloudrun_project, google_project_service.compute_engine]
}

module "server" {
  project                     = data.google_project.project.project_id
  source                      = "git@github.com:kadima-tech/terraform-modules.git//cloud-run-uncontrolled"
  name                        = "server"
  loadbalancer_backend_create = false
  allow_unauthenticed_access  = true

  ingress       = "all"
  min_instances = 0
  max_instances = 1

  #cloudsql_connections = [module.database.connection_name]

  env = [
    { key = "NODE_ENV", value = terraform.workspace },
    { key = "EXCHANGE_TENANT_ID", secret = google_secret_manager_secret.secret["EXCHANGE_TENANT_ID"].id },
    { key = "EXCHANGE_CLIENT_ID", secret = google_secret_manager_secret.secret["EXCHANGE_CLIENT_ID"].id },
    { key = "EXCHANGE_CLIENT_SECRET", secret = google_secret_manager_secret.secret["EXCHANGE_CLIENT_SECRET"].id },
    { key = "SPOTIFY_CLIENT_ID", secret = google_secret_manager_secret.secret["SPOTIFY_CLIENT_ID"].id },
    { key = "SPOTIFY_CLIENT_SECRET", secret = google_secret_manager_secret.secret["SPOTIFY_CLIENT_SECRET"].id },
    { key = "SPOTIFY_REDIRECT_URI", value = "http://localhost:8080/callback" },

    # { key = "DATABASE_URL", secret = module.database.connection_string_secret }
  ]

  service_account_email = google_service_account.main.email
  depends_on            = [module.cloudrun_project, google_project_service.compute_engine]
}

# resource "google_project_iam_member" "cloudsql-client" {
#   project = data.google_project.project.project_id
#   role    = "roles/cloudsql.client"
#   member  = "serviceAccount:${google_service_account.main.email}"
# }

locals {
  service_roles = [
    "roles/iam.serviceAccountTokenCreator",
    "roles/run.viewer",
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter",
    "roles/secretmanager.secretAccessor",
  ]
}

# Cloud storage authentication is done through by giving the service account access.
resource "google_service_account" "main" {
  project      = data.google_project.project.project_id
  account_id   = "cloudrun-primary" #TODO: ${var.project}-
  display_name = "Microservice service account"
}

resource "google_project_iam_member" "service_roles" {
  count   = length(local.service_roles)
  project = local.project
  role    = element(local.service_roles, count.index)
  member  = "serviceAccount:${google_service_account.main.email}"
}

# DNS
resource "google_cloud_run_domain_mapping" "default" {
  project  = data.google_project.project.project_id
  location = "europe-west1"
  name     = local.host

  metadata {
    namespace = local.project
  }

  spec {
    route_name = module.frontend.name
  }
}


data "google_dns_managed_zone" "env_dns_zone" {
  project = "kadima-terraform"
  name    = terraform.workspace == "production" ? "standin-works" : "kadima-default"
}

resource "google_dns_record_set" "dns_cloudrun" {
  project = "kadima-terraform"
  name    = local.dns_name
  type    = "CNAME"
  ttl     = 10

  managed_zone = data.google_dns_managed_zone.env_dns_zone.name

  rrdatas = ["ghs.googlehosted.com."]
}

resource "google_compute_ssl_policy" "ssl-policy" {
  project         = local.project
  name            = "primary-ssl-policy"
  profile         = "COMPATIBLE"
  min_tls_version = "TLS_1_2"
}
