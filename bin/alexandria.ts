#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AlexandriaFrontendStack } from '../src/frontend/stack';
import { Construct } from 'constructs';

const env = { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION 
};

class Application extends cdk.Stage {
    constructor(scope: Construct, id: string, props?: cdk.StageProps) {
        super(scope, id, props);

        new AlexandriaFrontendStack(this, 'Frontend', props);
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
                    'npm cdk synth'
                ]
            })
        });

        pipeline.addStage(new Application(this, 'Beta', props))
    }
}

const App = new cdk.App();
new InfrastructurePipelineStack(App, 'Alexandria', {env});