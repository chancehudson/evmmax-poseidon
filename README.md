# evmmax-poseidon

This repo estimates the gas cost of implementing PoseidonT3 over the `alt_bn128` curve using [EIP-6690 (EVMMAX)](https://eips.ethereum.org/EIPS/eip-6690).

## Result

The best PoseidonT3 implementation consumes [`21,124` gas](https://github.com/chancehudson/poseidon-solidity?tab=readme-ov-file#benchmark). The arithmetic represents about ~40% of the cost.

EVMMAX arithmetic is ~5x cheaper than the best normal implementation. The expected total PoseidonT3 cost with EVMMAX would be `13,659` gas. This is calculated by subtracting the difference in the arithmetic cost from the total cost above.

```
----
alt_bn128 T3 consumed 9279 gas (normal)
alt_bn128 T3 consumed 1814 gas (EVMMAX)
----
m31 T3 consumed 3594 gas (normal)
m31 T3 consumed 920 gas (EVMMAX)
----
m31 T8 consumed 13347 gas (normal)
m31 T8 consumed 3326 gas (EVMMAX)
----
```

