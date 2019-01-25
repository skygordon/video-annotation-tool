import boto3
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

# aws stuff
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
S3_BUCKET = os.getenv('AWS_S3_BUCKET_NAME')
s3 = boto3.client('s3', aws_access_key_id = AWS_ACCESS_KEY_ID, aws_secret_access_key = AWS_SECRET_ACCESS_KEY)

results = s3.list_objects(Bucket=S3_BUCKET, Prefix=os.getenv("AWS_S3_BUCKET_ANNOTATIONS_FOLDER"))

while True:
	results = s3.list_objects(Bucket=S3_BUCKET, Prefix=os.getenv("AWS_S3_BUCKET_ANNOTATIONS_FOLDER"))
	if 'Contents' not in results:
		exit()
	for i in results['Contents']:
		file = i["Key"]
		if "_ai" in file:
			s3.delete_object(Bucket=S3_BUCKET, Key=file)
			print(file)