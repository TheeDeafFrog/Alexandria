#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AlexandriaBackendStack } from '../lib/stack';
import { stages } from '../lib/constants';

const env = { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION 
};

class BackendApplication extends cdk.Stage {
    constructor(scope: Construct, id: string, props?: cdk.StageProps) {
        super(scope, id, props);

        new AlexandriaBackendStack(this, 'Backend', {
            ...props,
            stageName: id
        });
    }
} 

class InfrastructurePipelineStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const connection = new cdk.aws_codestarconnections.CfnConnection(this, 'AlexandriaGithubConnection', {
            connectionName: 'alexandriaConnection',
            providerType: 'GitHub'
        });

        const source = cdk.pipelines.CodePipelineSource.connection('TheeDeafFrog/Alexandria', 'release', {
            connectionArn: connection.attrConnectionArn
        });

        const pipeline = new cdk.pipelines.CodePipeline(this, 'AlexandriaPipeline', {
            synth: new cdk.pipelines.ShellStep('Synth', {
                input: source,
                commands: [
                    'npm ci',
                    'npm run build',
                    'npx cdk synth',
                  ]
            })
        });

        const betaStage = pipeline.addStage(new BackendApplication(this, stages.beta, props));
        betaStage.addPost(new cdk.pipelines.ManualApprovalStep('ProdPromotion'));

        pipeline.addStage(new BackendApplication(this, stages.prod, props))
    }
}

const app = new cdk.App();
new InfrastructurePipelineStack(app, 'Alexandria', {env});
