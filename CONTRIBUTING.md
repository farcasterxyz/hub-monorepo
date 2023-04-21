# Contributing

1. [How to Contribute](#1-how-to-contribute)
2. [Setting up your development environment](#2-setting-up-your-development-environment)
   1. [Installing Dependencies](#21-installing-dependencies)
   2. [Signing Commits](#22-signing-commits)
   3. [Navigating the Monorepo](#23-navigating-the-monorepo)
3. [Proposing Changes](#3-proposing-changes)
   1. [Writing Tests](#31-writing-tests)
   2. [Writing Docs](#32-writing-docs)
   3. [Handling Errors](#33-handling-errors)
   4. [Creating the PR](#34-creating-the-pr)
   5. [Adding Changesets](#35-adding-changesets)
   6. [Releasing Versions](#36-releasing-versions)
4. [Troubleshooting](#4-troubleshooting)

## 1. How to Contribute

Thanks for your interest in improving the Farcaster Hub!

No contribution is too small and we welcome to your help. There's always something to work on, no matter how experienced you are. If you're looking for ideas, start with the [good first issue](https://github.com/farcasterxyz/hub/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) or [help wanted](https://github.com/farcasterxyz/hub/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22) sections in the issues. You can help make Farcaster better by:

- Opening issues or adding details to existing issues
- Fixing bugs in the code
- Making tests or the ci builds faster
- Improving the documentation
- Keeping packages up-to-date
- Proposing and implementing new features

Before you get down to coding, take a minute to consider this:

- If your proposal modifies the [farcaster protocol](https://github.com/farcasterxyz/protocol/), open an issue there
  first.
- If your proposal is a non-trivial change, consider opening an issue first to get buy-in.
- If your issue is a small bugfix or improvement, you can simply make the changes and open the PR.

## 2. Setting up your development environment

### 2.1 Installing Dependencies

First, ensure that the following are installed globally on your machine:

- [Node.js 18+](https://github.com/nvm-sh/nvm)
- [Yarn](https://classic.yarnpkg.com/lang/en/docs/install)

Then, from the root folder run:

- `yarn install` to install dependencies
- `yarn build` to ensure that the test suite runs correctly
- `yarn test` to ensure that the test suite runs correctly

### 2.2. Signing Commits

All commits need to be signed with a GPG key. This adds a second factor of authentication that proves that it came from
you, and not someone who managed to compromise your GitHub account. You can enable signing by following these steps:

1. [Generate GPG Keys](https://help.github.com/en/github/authenticating-to-github/generating-a-new-gpg-key) and upload them to your Github account, [GPG Suite](https://gpgtools.org/) is recommended for OSX

2. Use `gpg-agent` to remember your password locally

```bash
vi ~/.gnupg/gpg-agent.conf

default-cache-ttl 100000000
max-cache-ttl 100000000
```

3. Configure Git to [use your keys when signing](https://help.github.com/en/github/authenticating-to-github/telling-git-about-your-signing-key).

4. Configure Git to always sign commits by running `git config --global commit.gpgsign true`

5. Commit all changes with your usual git commands and you should see a `Verified` badge near your commits

### 2.3. Navigating the Monorepo

The repository is a monorepo with a primary application in the `/apps/` folder that imports several packages `/packages/`. It is composed of yarn workspaces and uses [TurboRepo](https://turbo.build/) as its build system.

You can run commands like `yarn test` and `yarn build` which TurboRepo will automatically parallelize and execute across all workspaces. To execute the application, you'll need to navigate into the app folder and follow the instructions there. The TurboRepo documentation covers other important topics like:

- [Installing Packages](https://turbo.build/repo/docs/handbook/package-installation)
- [Creating New Packages](https://turbo.build/repo/docs/handbook/sharing-code/internal-packages)

TurboRepo uses a local cache which can be disabled by adding the `--force` option to yarn commmands. Remote caching is not enabled since the performance gains at our scale are not worth the cost of introducing subtle caching bugs.

## 3. Proposing Changes

When proposing a change, make sure that you've followed all of these steps before you ask for a review.

### 3.1. Writing Tests

All changes that involve features or bugfixes should be accompanied by tests, and remember that:

- Unit tests should live side-by-side with code as `foo.test.ts`
- Tests that span multiple files should live in `src/test/` under the appropriate subfolder
- Tests should use [factories](https://github.com/thoughtbot/fishery) instead of stubs wherever possible.
- Critical code paths should have 100% test coverage, which you can check in the Coveralls CI.

### 3.2 Writing Docs

All changes should have supporting documentation that makes reviewing and understanding the code easy. You should:

- Update high-level changes in the [contract docs](docs/docs.md).
- Always use TSDoc style comments for functions, variables, constants, events and params.
- Prefer single-line comments `/** The comment */` when the TSDoc comment fits on a single line.
- Always use regular comments `//` for inline commentary on code.
- Comments explaining the 'why' when code is not obvious.
- Do not comment obvious changes (e.g. `starts the db` before the line `db.start()`)
- Add a `Safety: ..` comment explaining every use of `as`.
- Prefer active, present-tense doing form (`Gets the connection`) over other forms (`Connection is obtained`, `Get the connection`, `We get the connection`, `will get a connection`)

### 3.4. Handling Errors

Errors are not handled using `throw` and `try / catch` as is common with Javascript programs. This pattern makes it hard for people to reason about whether methods are safe which leads to incomplete test coverage, unexpected errors and less safety. Instead we use a more functional approach to dealing with errors. See [this issue](https://github.com/farcasterxyz/hub/issues/213) for the rationale behind this approach.

All errors must be constructed using the `HubError` class which extends extends Error. It is stricter than error and requires a Hub Error Code (e.g. `unavailable.database_error`) and some additional context. Codes are used a replacement for error subclassing since they can be easily serialized over network calls. Codes also have multiple levels (e.g. `database_error` is a type of `unavailable`) which help with making decisions about error handling.

Functions that can fail should always return `HubResult` which is a type that can either be the desired value or an error. Callers of the function should inspect the value and handle the success and failure case explicitly. The HubResult is an alias over [neverthrow's Result](https://github.com/supermacro/neverthrow). If you have never used a language where this is common (like Rust) you may want to start with the [API docs](https://github.com/supermacro/neverthrow#api-documentation). This pattern ensures that:

1. Readers can immediately tell whether a function is safe or unsafe
2. Readers know the type of error that may get thrown
3. Authors can never accidentally ignore an error.

We also enforce the following rules during code reviews:

---

Always return `HubResult<T>` instead of throwing if the function can fail

```ts
// incorrect usage
const parseMessage = (message: string): Uint8Array => {
  if (message == '') throw new HubError(...);
  return message;
};

// correct usage
const parseMessage = (message: string): HubResult<Uint8Array> => {
  if (message == '') return new HubError(...)
  return ok(message);
};
```

---

Always wrap external calls with `Result.fromThrowable` or `ResultAsync.fromPromise` and wrap external an `Error` into a `HubError`.

```ts
// incorrect usage
const parseMessage = (message: string): string => {
  try {
    return JSON.parse(message);
  } catch (err) {
    return err as Error;
  }
};

// correct usage: wrap the external call for safety
const parseMessage = (message: string): HubResult<string> => {
  return Result.fromThrowable(
    () => JSON.parse(message),
    (err) => new HubError('bad_request.parse_failure', err as Error)
  )();
};

// correct usage: build a convenience method so you can call it easily
const safeJsonStringify = Result.fromThrowable(
  JSON.stringify,
  () => new HubError('bad_request', 'json stringify failure')
);

const result = safeJsonStringify(json);
```

---

Prefer `result.match` to handle HubResult since it is explicit about how all branches are handled

```ts
const result = computationThatMightFail().match(
  (str) => str.toUpperCase(),
  (error) => err(error)
);
```

---

Only use `isErr()` in cases where you want to short-circuit early on failure and refactoring is unwieldy or not performant

```ts
public something(): HubResult<number> {
  const result = computationThatMightFail();
  if (result.isErr()) return err(new HubError('unavailable', 'down'));

   // do a lot of things that would be unweidly to put in a match
   // ...
   // ...
   return ok(200);
}
```

---

Use `_unsafeUnwrap()` and `_unsafeUnwrapErr()` in tests to assert results

```ts
// when expecting an error
const error = foo()._unsafeUnwrapErr();
expect(error.errCode).toEqual('bad_request');
expect(error.message).toMatch('invalid AddressInfo family');
```

---

Prefer `combine` and `combineWithAllErrors` when operating on multiple results

```ts
const results = await Promise.all(things.map((thing) => foo(thing)));

// 1. Only fail if all failed
const combinedResults = Result.combineWithAllErrors(results) as Result<void[], HubError[]>;
if (combinedResults.isErr() && combinedResults.error.length == things.length) {
  return err(new HubError('unavailable', 'could not connect to any bootstrap nodes'));
}

// 2. Fail if at least one failed
const combinedResults = Result.combine(results);
if (combinedResults.isErr()) {
  return err(new HubError('unavailable', 'could not connect to any bootstrap nodes'));
}
```

---

### 3.4. Creating the PR

All submissions must be opened as a Pull Request and reviewed and approved by a project member. The CI build process
will ensure that all tests pass and that all linters have been run correctly. In addition, you should ensure that:

- The PR titles _must_ follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#summary) specification
- Commit titles _should_ follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#summary) specification

As an example, a good PR title would look like this:

```
fix(signers): validate signatures correctly
```

While a good commit message might look like this:

```
fix(signers): validate signatures correctly

Called Signer.verify with the correct parameter to ensure that older signature
types would not pass verification in our Signer Sets
```

### 3.5. Adding Changesets

All PRs with meaningful changes should have a [changeset](https://github.com/changesets/changesets) which is a short
description of the modifications being made to each package. Changesets are automatically converted into a changelog
when the repo manager runs a release process.

1. Run `yarn changeset` to start the process
2. Select the packages being modified with the space key
3. Select minor version if breaking change or patch otherwise, since we haven't release 1.0 yet
4. Commit the generates files into your branch.

### 3.6 Releasing Versions

Permissions to publish to the @farcaster organization in NPM is necessary. This is a non-reversible process so if you
are at all unsure about how to proceed, please reach out to Varun ([Github](https://github.com/varunsrin) | [Warpcast](https://warpcast.com/v))

1. Checkout a new branch and run `yarn changeset version`
2. Check that the version bumps are consistent with our versioning system
3. Check that all CHANGELOG.mds represent the important changes made
4. Check in all the files and merge the branch to main
5. Checkout main, pull down to the merged commit (should be latest) and run `yarn changeset publish`
6. Hubble is private and must be manually tagged with `git tag -a @farcaster/hubble@<version>` if bumped.
7. Run `git push origin <tag>` on each tag to push up the tags.

## 4. TroubleShooting

### Upgrading Libp2p

1. Pick a [libp2p release](https://github.com/libp2p/js-libp2p/releases) and navigate to its [package.json](https://github.com/libp2p/js-libp2p/blob/master/package.json) file
2. Copy the required versions of `libp2p`, `@libp2p/*`, `@chainsafe/*` `@multiformats/*` packages to our package.json
3. For unspecified packages read their changelog and make a best guess about versions (e.g. `@chainsafe/libp2p-gossipsub` and `@libp2p/pubsub-peer-discovery`)
4. Follow the [migration guide](https://github.com/libp2p/js-libp2p/tree/master/doc/migrations) for the versions you are upgrading to

If you run into any unexpected issues open a discussion in the [libp2p forum](https://discuss.libp2p.io/). @achingbrain on the Filecoin slack maintains this project and can be helpful with major issues.

### Releasing to NPM

1. Use `npm adduser` to log into the account that can publish to @farcaster on npm
2. Make a branch, run `yarn changeset version` and merge the changes into main
3. Pull latest main, run `yarn changeset publish`
