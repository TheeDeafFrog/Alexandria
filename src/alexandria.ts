#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CairoFrontendStack } from './frontend/stack';
import { Construct } from 'constructs';
import { AlexandriaBackendStack } from './backend/stack';
import { stages } from './constants';

const env = { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION 
};

class FrontendApplication extends cdk.Stage {
    constructor(scope: Construct, id: string, props?: cdk.StageProps) {
        super(scope, id, props);

        new AlexandriaBackendStack(this, 'Backend', props);
    }
} 

class InfrastructurePipelineStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
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
                    'npm run cdk synth'
                ]
            })
        });

        const betaStage = pipeline.addStage(new FrontendApplication(this, stages.beta, props));
        betaStage.addPost(new cdk.pipelines.ManualApprovalStep('ProdPromotion'));
        pipeline.addStage(new FrontendApplication(this, stages.prod, props))
    }
}

const App = new cdk.App();
new InfrastructurePipelineStack(App, 'Alexandria', {env});
new CairoFrontendStack(App, 'Cairo', {env});