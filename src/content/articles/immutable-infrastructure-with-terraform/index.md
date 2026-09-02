Managing cloud infrastructure at scale requires treating resources as immutable building blocks. When an environment requires an update, we replace instances and network definitions cleanly rather than applying manual configuration drift.

## State management and workspace boundaries

Terraform maintains a mapping of declarative code to real-world cloud resources. Isolating state files prevents blast radius propagation across critical services.

| Environment | State isolation | Access model |
| --- | --- | --- |
| Networking | Remote backend (S3 / Blob) | Read-only to service accounts |
| Compute clusters | Dedicated workspace | Automated CI/CD pipeline |
| Application data | Isolated project state | Restrictive KMS encryption |

### Writing clean Terraform modules

Modules should expose deterministic input variables and meaningful output attributes without hardcoding environment specifics:

```hcl "main.tf"
module "vpc" {
  source = "./modules/vpc"

  cidr_block         = "10.0.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b"]
  enable_nat_gateway = true
}
```

## Continuous infrastructure validation

Before applying changes to cloud accounts, run static security analysis and policy linters in continuous integration to catch permissive security groups and unencrypted storage volumes early.
