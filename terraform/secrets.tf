

locals {
  secrets = [
  ]
}

resource "google_secret_manager_secret" "secret" {
  for_each  = toset(local.secrets)
  secret_id = each.value
  project   = local.project

  labels = {}

  replication {
    automatic = true
  }

  # Some secrets are created with project numerical value
  # and some are created with the project name. Bot are valid
  # but we need this to prevent re-creation
  lifecycle {
    prevent_destroy = true
    ignore_changes = [
      project
    ]
  }
}
