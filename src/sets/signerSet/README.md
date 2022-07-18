## Leftover tasks

1. Code cleanup
2. Inline docs
3. Properly test concurrent edge cases
4. Comprehensive error handling (not handling for all boolean return values at the moment)
5. Ensure Result<<type>, string> is being returned for all functions and errors are being bubbled up appropriately
6. Do we need `_addEdgeIfNotExists` and `_removeEdgeIfExists`?
7. DRY test setup
8. Move out of `signerSet` folder
9. Refactor SignerAdd/ SignerRemove message types and move to types/index.ts
10. Hardcode Farcaster schema URL for `schema` attribute
11. Ensure in tests that hash values are different for each SignerAdd/SignerRemove in a test
12. Address nit comments
13. Ensure we are returning errors to caller when appropriate and no-oping when appropriate.
14. Address TODOs

## Concurrent Edge Case Testing

1. Conflicting Parents

This is when there is an existing parent with a delegate, and an `addDelegate` request for the same delegate but with a new parent comes up.

Converged State Expectation: delegate and its subtree are either moved to new parent if new parent's edge hash value is higher, or stays with existing parent if existing parent's edge hash value is higher.

- [x] Unit test

2. Case where `rem` happens on parent of delegate before `add` delegate that moves it to a new parent

Converged State Expectation: old parent is revoked and new parent has delegate and subtree under it.

- [x] Unit test

3. Concurrently add a child and remove a subtree that contains the child. Ensure that child is permanently revoked and that new edge is not added in tree.

Converged State Expectation: immediate delegate and its entire subtree is revoked including the "child". Subtree is not inside `tree`.

- [] Unit test

## Things missing in pseudocode

`addDelegate`

- [actual edge case logic for handling conflicting parents](https://github.com/farcasterxyz/hub/pull/36/files#diff-1b97142d99baef4457c1ee2d7a58cf927584d76586bd9156fd21382c06328ba1R105-R120)

```
if parent in adds or parent in custodySigners:
  if child in adds:
    get existing m edge
    add m edge
    compare hash values and choose highest lexicographical hash value of existing m edge or m edge
    if existing m edge hash value is higher:
      return error that delegate cannot be added since it exists under another parent
    if m edge hash value is higher:
      move delegate to m edge parent
```

- [actual and mention of edge case logic for handling "rem" on parent and then "add" on one of its delegates in which new parent has a higher lexicographical hash](https://github.com/farcasterxyz/hub/pull/36/files#diff-1b97142d99baef4457c1ee2d7a58cf927584d76586bd9156fd21382c06328ba1R122-R143)

```
if parent is in adds set or in custodySigners set:
  if child is in removed set:
    get existing m edge of child
    add m edge
    compare hash value of existing m edge and m edge
    if existing m edge hash value is higher:
      return error that delegate exists under revoked parent
    if m edge hash value is higher:
      move child from removed to adds set
      move child from existing parent to new parent
      recursively move all delegate children from removed to adds set
```
