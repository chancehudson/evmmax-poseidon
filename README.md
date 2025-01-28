# evmmax-poseidon

This repo estimates the gas cost of implementing PoseidonT3 over the `alt_bn128` curve using [EIP-6690 (EVMMAX)](https://eips.ethereum.org/EIPS/eip-6690).

## Result

The best PoseidonT3 implementation consumes [`21,124` gas](https://github.com/chancehudson/poseidon-solidity?tab=readme-ov-file#benchmark). The arithmetic represents about ~40% of the cost.

EVMMAX arithmetic is ~5x cheaper than the best normal implementation. The expected total PoseidonT3 cost with EVMMAX would be `13,659` gas. This is calculated by subtracting the difference in the arithmetic cost from the total cost above.

```
----
alt_bn128 T3 consumed 15252 gas (normal)
    stack: 5973
    arith: 9279
alt_bn128 T3 consumed 2594 gas (EVMMAX)
----
m31 T3 consumed 5628 gas (normal)
    stack: 2034
    arith: 3594
m31 T3 consumed 1292 gas (EVMMAX)
----
m31 T8 consumed 19743 gas (normal)
    stack: 6396
    arith: 13347
m31 T8 consumed 4838 gas (EVMMAX)
----
```

