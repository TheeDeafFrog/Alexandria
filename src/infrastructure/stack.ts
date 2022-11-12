import * as cdk from "aws-cdk-lib";

export class InfrastructurePipelineStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const connection = new cdk.aws_codestarconnections.CfnConnection(scope, 'AlexandriaGithubConnection', {
            connectionName: 'alexandriaConnection',
            providerType: 'Github'
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
    }
}