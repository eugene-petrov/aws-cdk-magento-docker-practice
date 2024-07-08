#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MagentoEcsCdkStack } from '../lib/magento-ecs-cdk-stack';

const app = new cdk.App();
new MagentoEcsCdkStack(app, 'MagentoEcsCdkStack');
app.synth();
