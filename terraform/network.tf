
resource "google_compute_network" "private" {
  project                 = local.project
  name                    = "primary-network"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "private" {
  project                  = local.project
  name                     = "primary-subnet"
  ip_cidr_range            = "10.0.0.0/16"
  region                   = "europe-west1"
  network                  = google_compute_network.private.self_link
  private_ip_google_access = true

  log_config {
    aggregation_interval = "INTERVAL_10_MIN"
    flow_sampling        = 0.1
    metadata             = "INCLUDE_ALL_METADATA"
  }
}

resource "google_compute_global_address" "vpc_peering_address" {
  project       = local.project
  provider      = google-beta
  name          = "vpc-peering-address"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.private.self_link
}

resource "google_service_networking_connection" "private_vpc_connection" {
  provider                = google-beta
  network                 = google_compute_network.private.self_link
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.vpc_peering_address.name]
}
