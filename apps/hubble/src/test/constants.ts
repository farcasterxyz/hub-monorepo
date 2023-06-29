export const accounts = [
  {
    address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    balance: 10000000000000000000000n,
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  },
] as const;

export const workerId = Number(process.env['JEST_WORKER_ID'] ?? 1);
export const localHttpUrl = `http://127.0.0.1:8545/${workerId}`;
