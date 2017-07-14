#!/usr/bin/env node

const Github = require('github-api')
const debug = require('debug')('clean-forks')
const argv = require('minimist')(process.argv.slice(2))

/**
 * @type {Map<string,boolean>}
 * Repos white list
 * Defines repos that wont be deleted
 */
var whiteList = {}

if (!argv.t || !argv.u) {
  console.error('Please provide authorization token & username')
  return
}

if (argv.w) {
  const repoList = argv.w.split(':')
  repoList.forEach(repo => {
    whiteList[repo] = true
  })
}

debug('Booting GithubAPI')

/**
 * @type {Object}
 * Fresh instance of Github API
 */
const api = new Github({
  token: argv.t
})

/**
 * Getting current user information
 */
const me = api.getUser(argv.u)

debug('Loading user data')

/**
 * Fetching repositories
 * and running delete jobs
 */
me.listRepos().then((resp) => {
  const repos = resp.data
  var jobsList = []

  debug('Processing user data')

  repos.forEach((repo) => {
    if (repo.fork && repo.owner.login == me.__user) {
      debug(`Found fork with name "${repo.name}"`)

      if (whiteList[repo.name]) {
        debug('Ignoring this fork')
        return
      }

      jobsList.push(api.getRepo(me.__user, repo.name).deleteRepo())
      debug('Running delete job')
    }
  })

  /**
   * Register all jobs awaiter
   */
  Promise.all(jobsList).then(() => {
    debug('All jobs done')
  }).catch((error) => {
    console.error(error.message)
  })

}).catch((error) => {
  console.error(error.message, error.status)
})
