resource "aws_sqs_queue" "etl_queue" {
    name = "etl.fifo"
    delay_seconds = 10
    message_retention_seconds = 345600
    receive_wait_time_seconds = 10
    fifo_queue = true
}

module "etl_lambda" {
    source = "terraform-aws-modules/lambda/aws"

    function_name = "etl"
    description = "A function which extrancts messages from the queue and loads them to the database"
    handler = "index.lambda_handler"
    runtime = "nodejs14.x"
    publish = true

    source_path = "function/etl.js"
    store_on_s3 = true
    s3_bucket = "f016c80a-0599-4e95-832b-7e2664bf065f"

    environment_variables = {
        Serverless = "Terraform"
        Version = 1
    }

    tags = {
        Module = "etl"
    }
}