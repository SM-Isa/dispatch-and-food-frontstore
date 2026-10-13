# infra/modules/cost-controls/main.tf
variable "project_id"       { type = string }
variable "billing_account"  { type = string }
variable "budgets" {
  type = map(object({
    display_name    = string
    amount_usd      = number
    threshold_rules = list(number)
    filters = optional(object({
      services = optional(list(string))
    }))
  }))
}

variable "notification_channels" { type = list(string) default = [] }

resource "google_billing_budget" "budgets" {
  for_each        = var.budgets
  billing_account = var.billing_account
  display_name    = each.value.display_name

  budget_filter {
    projects = ["projects/${var.project_id}"]
    services = each.value.filters != null ? each.value.filters.services : null
  }

  amount {
    specified_amount {
      currency_code = "USD"
      units         = each.value.amount_usd
    }
  }

  dynamic "threshold_rules" {
    for_each = each.value.threshold_rules
    content {
      threshold_percent = threshold_rules.value
      spend_basis       = "CURRENT_SPEND"
    }
  }

  all_updates_rule {
    monitoring_notification_channels = var.notification_channels
    disable_default_iam_recipients   = false
  }
}
