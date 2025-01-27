# evmmax-poseidon

This repo estimates the gas cost of implementing PoseidonT3 over the `alt_bn128` curve using [EIP-6690 (EVMMAX)](https://eips.ethereum.org/EIPS/eip-6690).

## Result

The best PoseidonT3 implementation consumes [`21,124` gas](https://github.com/chancehudson/poseidon-solidity?tab=readme-ov-file#benchmark). The arithmetic represents about ~40% of the cost.

EVMMAX arithmetic is ~5x cheaper than the best normal implementation. The expected total PoseidonT3 cost with EVMMAX would be `13,768` gas. This is calculated by subtracting the difference in the arithmetic cost from the total cost above.

```
EVMMAX impl consumed 1608 gas (alt_bn128)
Normal impl consumed 12864 gas (alt_bn128)
Normal impl (lazy reduction) consumed 8964 gas (alt_bn128)
```

