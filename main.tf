provider "aws" {
    region = "eu-central-1"

    skip_get_ec2_platforms = true
}

resource "aws_sqs_queue" "message_queue" {
  name = "message_processor_queue"
  delay_seconds = 10
  max_message_size = 10240
  message_retention_seconds = 345600
  receive_wait_time_seconds = 10
  fifo_queue = true
}

module "lambda_function" {
    source = "terraform-aws-modules/lambda/aws"

    function_name = "message_processor"
    description = "A function which processes the different fields on the Message entity before it is persisted."
    handler = "index.lambda_handler"
    runtime = "nodejs14.x"
    publish = true

    source_path = "function/message_processor.js"
    store_on_s3 = true
    s3_bucket = "message_processor_bucket"
    
    environment_variables = {
        Serverless = "Terraform"
        version = 1
    }

    tags = {
        Module = "message_processor"
    }
}