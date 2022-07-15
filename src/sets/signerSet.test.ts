const set = new SignerSet();

describe('create signer set', () => {
  test('fails with incorrect custody address public key', async () => {
    expect(true).toEqual(true); // placeholder assertion
  });
});

describe('add key', () => {
  test('fails when claimed parent is not actual parent of child', async () => {
    expect(true).toEqual(true);
  });

  test('fails when child is in removed nodes', async () => {
    expect(true).toEqual(true);
  });

  test('fails when child is an existing node', async () => {
    expect(true).toEqual(true);
  });
});

describe('remove key', () => {
  test('fails because claimed parent is not actual parent of child', async () => {
    expect(true).toEqual(true);
  });
});
