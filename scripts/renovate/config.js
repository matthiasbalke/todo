/**
 * @typedef {import('renovate/dist/config/types').AllConfig} AllConfig
 */

const fs = require('fs')
const { parse } = require('jsonc-parser');

const repoConfig = parse(
    fs.readFileSync('../../.github/renovate.jsonc', 'utf8')
);

/** @type {AllConfig} */
let globalConfig = {
    // for instance, to simulate how the Mend Developer Platform is configured
    allowedUnsafeExecutions: [
        'gradleWrapper',
    ],
}

/** @type {AllConfig} */
let config = {
    ...globalConfig,

    // don't require repositories to have a `renovate.json` - i.e. if we're testing how a configuration will affect a new repo
    onboarding: false,
    // if there is config, ignore it, and use our local copy
    requireConfig: 'ignored',

    // add our repo config
    ...repoConfig,

    /*
     * These settings are only for repositories where you're running Renovate without dry-run, /and/ you're expecting to get many branches/PRs created
     *
     * NOTE that this ordering allows these to take precedence over repo config
     */
    prHourlyLimit: 100,
    // allow lots of branches/PRs to be created
    branchConcurrentLimit: 100,
    prConcurrentLimit: 100,
    // and separate to these settings, we also want to allow all PRs to be created at a given time
}

// NOTE that this isn't inlined, because it can be handy to do conditional checks
module.exports = config
