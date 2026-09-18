const TerraMindApi = require('@librechat/api');
const { GenerationJobManager } = TerraMindApi;
const {
  acquireSubagentThreadLease,
  renewSubagentThreadLease,
  releaseSubagentThreadLease,
} = require('~/models');

let acquireLease;

function acquireEventChildGenerationLease(input) {
  acquireLease ??= TerraMindApi.createEventChildGenerationLeaseAcquirer({
    methods: {
      acquireSubagentThreadLease,
      renewSubagentThreadLease,
      releaseSubagentThreadLease,
    },
    abortGeneration: (streamId, options) => GenerationJobManager.abortJob(streamId, options),
  });

  return acquireLease(input);
}

module.exports = { acquireEventChildGenerationLease };
