module "endpoint" {
  source = "terraform-aws-modules/lambda/aws"

  function_name = "endpoint"
  description   = "A function which accepts messages and sends them on an SQS queue"
  handler       = "endpoint.handler"
  runtime       = "nodejs14.x"
  publish       = true

  source_path = "./endpoint"
  store_on_s3 = true
  s3_bucket   = var.BUCKET
}

resource "aws_iam_policy" "endpoint_policy" {
  name        = "endpoint_policy"
  description = "Allow the endpoint Lambda to send messages to the Messages queue"

  policy = jsonencode(
    {
      "Version" : "2012-10-17",
      "Statement" : [
        {
          "Action" : [
            "sqs:SendMessage"
          ],
          "Effect" : "Allow",
          "Resource" : "arn:aws:sqs:eu-central-1:030483651510:messages"
        }
      ]
  })
}

resource "aws_iam_role_policy_attachment" "endpoint_policy" {
  role       = "endpoint"
  policy_arn     = aws_iam_policy.endpoint_policy.arn
}