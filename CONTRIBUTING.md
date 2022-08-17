# Contributing

1. [How to Contribute](#1-how-to-contribute)
   1. [Proposing Changes](#11-proposing-changes)
   2. [Signing Commits](#12-signing-commits)
   3. [Writing Tests](#13-writing-tests)
   4. [Getting A Review](#13-getting-a-review)

## 1. How to Contribute

Thanks for your interest in improving the Farcaster Hub!

No contribution is too small and we welcome to your help. There's always something to work on, no matter how experienced you are. If you're looking for ideas, start with the [good first issue](https://github.com/farcasterxyz/hub/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) or [help wanted](https://github.com/farcasterxyz/hub/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22) sections in the issues. You can help make Farcaster better by:

- Opening issues or adding details to existing issues
- Fixing bugs in the code
- Making tests or the ci builds faster
- Improving the documentation
- Keeping packages up-to-date
- Proposing and implementing new features

### 1.1. Proposing Changes

If you're considering making a code change, we really appreciate it! Before you get down to coding, take a minute to consider this:

- If your proposal modifies the [farcaster protocol](https://github.com/farcasterxyz/protocol/), open an issue there first.
- If your proposal is a new hub feature, consider opening an issue first to get buy-in.
- If your issue is a small bugfix or improvement, you can simply make the changes and open the PR.

### 1.2. Signing Commits

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

### 1.3. Writing Tests

All changes that involve features or bugfixes should be accompanied by tests, and remember that:

- Tests should live side-by-side with code as `foo.test.ts`
- Tests should use [factories](https://github.com/thoughtbot/fishery) instead of stubs wherever possible.
- Critical code paths should have 100% test coverage, which you can check in the Coveralls CI.

### 1.3. Getting A Review

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
