import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';

export class MagentoEcsCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC creation
    const vpc = new ec2.Vpc(this, 'MagentoVpc', {
      maxAzs: 3,
    });

    // ECS cluster creation
    const cluster = new ecs.Cluster(this, 'MagentoCluster', {
      vpc,
    });

    // Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'MagentoTaskDef', {
      memoryLimitMiB: 2048,
      cpu: 1024,
    });

    // Adding container for MariaDB
    const mariadbContainer = taskDefinition.addContainer('MariaDB', {
      image: ecs.ContainerImage.fromRegistry('docker.io/bitnami/mariadb:10.6'),
      environment: {
        'ALLOW_EMPTY_PASSWORD': 'yes',
        'MARIADB_USER': 'bn_magento',
        'MARIADB_DATABASE': 'bitnami_magento',
      },
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'mariadb' }),
    });

    mariadbContainer.addPortMappings({
      containerPort: 3306,
    });

    // Adding container for Elasticsearch
    const elasticsearchContainer = taskDefinition.addContainer('Elasticsearch', {
      image: ecs.ContainerImage.fromRegistry('docker.io/bitnami/elasticsearch:7'),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'elasticsearch' }),
    });

    elasticsearchContainer.addPortMappings({
      containerPort: 9200,
    });

    // Adding container for Magento
    const magentoContainer = taskDefinition.addContainer('Magento', {
      image: ecs.ContainerImage.fromRegistry('docker.io/bitnami/magento:2'),
      environment: {
        'MAGENTO_HOST': 'localhost',
        'MAGENTO_DATABASE_HOST': mariadbContainer.containerName,
        'MAGENTO_DATABASE_PORT_NUMBER': '3306',
        'MAGENTO_DATABASE_USER': 'bn_magento',
        'MAGENTO_DATABASE_NAME': 'bitnami_magento',
        'ELASTICSEARCH_HOST': elasticsearchContainer.containerName,
        'ELASTICSEARCH_PORT_NUMBER': '9200',
        'ALLOW_EMPTY_PASSWORD': 'yes',
      },
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'magento' }),
    });

    magentoContainer.addPortMappings({
      containerPort: 8080,
    });

    // ECS Service
    new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'MagentoFargateService', {
      cluster,
      taskDefinition,
      publicLoadBalancer: true,
      listenerPort: 80,
    });
  }
}
