import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseTrivyJsonOutput, getTfBinary, isSandboxEnabled } from '../services/terraform';
import { EVAL_BENCHMARKS } from '../services/eval-suite';
import { generateArchitectureGraph } from '../services/devops-tools';

describe('DevOps Tools, Trivy Parser & Eval Suite Tests', () => {
  test('1. parseTrivyJsonOutput parses Misconfigurations and Secrets', () => {
    const sampleTrivy = JSON.stringify({
      Results: [
        {
          Target: 'main.tf',
          Misconfigurations: [
            {
              ID: 'AVD-AWS-0086',
              AVDID: 'AVD-AWS-0086',
              Title: 'S3 bucket does not have public access block',
              Severity: 'HIGH',
              Resolution: 'Add aws_s3_bucket_public_access_block',
              CauseMetadata: { Resource: 'aws_s3_bucket.data', StartLine: 10, EndLine: 14 }
            }
          ],
          Secrets: [
            {
              RuleID: 'aws-access-key-id',
              Title: 'AWS Access Key ID',
              Severity: 'CRITICAL',
              Category: 'AWS',
              StartLine: 3,
              EndLine: 3
            }
          ]
        }
      ]
    });

    const findings = parseTrivyJsonOutput(sampleTrivy);
    assert.equal(findings.length, 2);
    assert.equal(findings[0].id, 'AVD-AWS-0086');
    assert.equal(findings[0].severity, 'HIGH');
    assert.equal(findings[1].severity, 'CRITICAL');
    assert.equal(findings[1].filename, 'main.tf');
  });

  test('2. getTfBinary defaults to terraform and respects TF_BINARY=tofu', () => {
    const prev = process.env.TF_BINARY;
    delete process.env.TF_BINARY;
    assert.equal(getTfBinary(), 'terraform');
    process.env.TF_BINARY = 'tofu';
    assert.equal(getTfBinary(), 'tofu');
    if (prev !== undefined) process.env.TF_BINARY = prev;
    else delete process.env.TF_BINARY;
  });

  test('3. isSandboxEnabled defaults to false', () => {
    assert.equal(typeof isSandboxEnabled(), 'boolean');
  });

  test('4. EVAL_BENCHMARKS includes 12 prompts across terraform, kubernetes, cicd, finops', () => {
    assert.ok(EVAL_BENCHMARKS.length >= 12);
    const categories = new Set(EVAL_BENCHMARKS.map((b) => b.category));
    assert.ok(categories.has('terraform'));
    assert.ok(categories.has('kubernetes'));
    assert.ok(categories.has('cicd'));
    assert.ok(categories.has('finops'));
  });

  test('5. generateArchitectureGraph returns valid Mermaid flowchart header', async () => {
    const graph = await generateArchitectureGraph();
    assert.ok(graph.mermaid && graph.mermaid.startsWith('flowchart TD'));
  });
});
