# evmmax-poseidon

This repo estimates the gas cost of implementing PoseidonT3 over the `alt_bn128` curve.

## Result

The best PoseidonT3 implementation consumes [`21,124` gas](https://github.com/chancehudson/poseidon-solidity?tab=readme-ov-file#benchmark). The arithmetic represents about ~40% of the cost.

EVMMAX arithmetic is ~5x cheaper than the best normal implementation. The expected total PoseidonT3 cost with EVMMAX would be `13,768` gas. This is calcualted the subtracting the difference in the arithmetic cost from the cost above.

```
EVMMAX impl consumed 1608 gas (alt_bn128)
Normal impl consumed 12864 gas (alt_bn128)
Normal impl (lazy reduction) consumed 8964 gas (alt_bn128)
```

