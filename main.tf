provider "aws" {
    region = "eu-central-1"

    skip_get_ec2_platforms = true
}
variable PASSWORD {}
variable DEBUG {}
variable BUCKET {}