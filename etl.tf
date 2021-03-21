resource "aws_sqs_queue" "etl_queue" {
  name                      = "etl.fifo"
  delay_seconds = 10
  max_message_size = 10240
  message_retention_seconds = 345600
  receive_wait_time_seconds = 10
  fifo_queue = true
  content_based_deduplication = true
}

module "etl_lambda" {
  source = "terraform-aws-modules/lambda/aws"

  function_name = "etl"
  description   = "A function which extrancts messages from the queue and loads them to the database"
  handler       = "index.lambda_handler"
  runtime       = "nodejs14.x"
  publish       = true

  source_path = "function/etl.js"
  store_on_s3 = true
  s3_bucket   = "f016c80a-0599-4e95-832b-7e2664bf065f"

}

resource "aws_lambda_event_source_mapping" "etl_trigger" {
  event_source_arn = "arn:aws:sqs:eu-central-1:030483651510:etl.fifo"
  function_name = "etl"
}

resource "aws_iam_role_policy_attachment" "attach_etl_sqs_full_access" {
  role       = "etl"
  policy_arn = "arn:aws:iam::aws:policy/AmazonSQSFullAccess"
}

resource "aws_iam_role_policy_attachment" "attach_etl_sqs_execute" {
    role = "etl"
    policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaSQSQueueExecutionRole"
}