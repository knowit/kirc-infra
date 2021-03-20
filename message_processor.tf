provider "aws" {
    region = "eu-central-1"

    skip_get_ec2_platforms = true
}

// MESSAGE PROCESSOR

resource "aws_sqs_queue" "message_processor_queue" {
  name = "message_processor_queue.fifo"
  delay_seconds = 10
  max_message_size = 10240
  message_retention_seconds = 345600
  receive_wait_time_seconds = 10
  fifo_queue = true
  tags = {
      Module = "message_processor"
  }
}

module "message_processor_lambda" {
    source = "terraform-aws-modules/lambda/aws"

    function_name = "message_processor"
    description = "A function which processes the different fields on the Message entity before it is sent to the ETL queue"
    handler = "index.lambda_handler"
    runtime = "nodejs14.x"
    publish = true

    source_path = "function/message_processor.js"
    store_on_s3 = true
    s3_bucket = "f016c80a-0599-4e95-832b-7e2664bf065f"
    
    environment_variables = {
        Serverless = "Terraform"
        version = 1
    }

    tags = {
        Module = "message_processor"
    }
}
