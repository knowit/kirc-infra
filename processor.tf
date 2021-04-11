module "processor" {
  source = "terraform-aws-modules/lambda/aws"

  function_name = "processor"
  description   = "A function which processes the different fields on the Message entity before it is sent to the ETL queue"
  handler       = "processor.handler"
  runtime       = "nodejs14.x"
  publish       = true

  source_path = "./processor"
  store_on_s3 = true
  s3_bucket   = var.BUCKET
  environment_variables = {
    PASSWORD = var.PASSWORD
    DEBUG    = var.DEBUG
  }
}

# resource "aws_lambda_event_source_mapping" "processor_trigger" {
#   event_source_arn = "arn:aws:sqs:eu-central-1:030483651510:message_processor_queue.fifo"
#   function_name    = "processor"
# }

resource "aws_iam_policy" "processor_policy" {
  name        = "processor_policy"
  description = "Allow the endpoint Lambda to read messages from the messages queue"

  policy = jsonencode(
    {
      "Version" : "2012-10-17",
      "Statement" : [
        {
          "Action" : [
            "sqs:ReadMessage"
          ],
          "Effect" : "Allow",
          "Resource" : "arn:aws:sqs:eu-central-1:030483651510:messages"
        }
      ]
  })
}

resource "aws_iam_role_policy_attachment" "processor_policy" {
  role       = "processor"
  policy_arn     = aws_iam_policy.processor_policy.arn
}