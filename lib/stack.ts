import * as cdk from 'aws-cdk-lib';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { stages } from './constants';

export class AlexandriaBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    const bucketName = id === stages.prod ? 'content.cairo.kevinr.net' : 'beta.content.cairo.kevinr.net'

    new s3.Bucket(this, 'ContentBucket', {
      bucketName
    });
  }
}
