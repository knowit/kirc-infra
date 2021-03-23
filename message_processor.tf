resource "aws_sqs_queue" "message_processor_queue" {
  name = "message_processor_queue.fifo"
  delay_seconds = 10
  max_message_size = 10240
  message_retention_seconds = 345600
  receive_wait_time_seconds = 10
  fifo_queue = true
  content_based_deduplication = true
}

module "message_processor_lambda" {
    source = "terraform-aws-modules/lambda/aws"

    function_name = "message_processor"
    description = "A function which processes the different fields on the Message entity before it is sent to the ETL queue"
    handler = "message_processor.lambda_handler"
    runtime = "nodejs14.x"
    publish = true

    source_path = "function/message_processor.js"
    store_on_s3 = true
    s3_bucket = "f016c80a-0599-4e95-832b-7e2664bf065f"
    
}

resource "aws_iam_role_policy_attachment" "attach_message_processor_sqs_full_access" {
  role       = "message_processor"
  policy_arn = "arn:aws:iam::aws:policy/AmazonSQSFullAccess"
}

resource "aws_iam_role_policy_attachment" "attach_message_processor_sqs_execute" {
    role = "message_processor"
    policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaSQSQueueExecutionRole"
}

resource "aws_lambda_event_source_mapping" "message_processor_trigger" {
    event_source_arn = "arn:aws:sqs:eu-central-1:030483651510:message_processor_queue.fifo"
    function_name = "message_processor"
}