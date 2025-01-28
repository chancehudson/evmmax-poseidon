I added some approximate stack operations and ended up with this:

```
----
alt_bn128 T3 consumed 19947 gas (normal)
    stack: 10668
    arith: 9279
alt_bn128 T3 consumed 1814 gas (EVMMAX)
----
m31 T3 consumed 7949 gas (normal)
    stack: 4355
    arith: 3594
m31 T3 consumed 920 gas (EVMMAX)
----
m31 T8 consumed 26344 gas (normal)
    stack: 12997
    arith: 13347
m31 T8 consumed 3326 gas (EVMMAX)
----
```

There is still ~1000 gas unaccounted for in the `alt_bn128` T3 compared to the actual invocation. We can summarize the stack operations as follows:
### 1. getting constants onto the stack

in each round we have to do a mixing operation involving an mds matrix. This means using `PUSH` to get each constant to the top of the stack before multiplications/additions

### 2. `DUP`, `SWAP`, `POP` sequences

we use 6 local variables for storing intermediate values (in T3). There should be a common sequence of operations to get the variables onto the stack and then put them back in a known place. I'm modeling this as 

```
DUP
OPERATION
SWAP
POP
```

I'm being conservative with where I put these operations (hence the underestimation in gas above)

### 3. loading the field prime for reduction

this is the **biggest** single cost i've observed. Every time we do a reduction we have to `PUSH` the field constant to the top of the stack

--

this analysis assumes an infinite available stack depth and breaks down for PoseidonT8. In practice we have to use `MLOAD`/`MSTORE` like [here](https://github.com/chancehudson/poseidon-solidity/blob/main/contracts/PoseidonT6.sol#L187).

We see this here with T5, the actual cost is 54,326 which leaves ~8000 gas unaccounted for by our approximation:
```
alt_bn128 T5 consumed 47524 gas (normal)
    stack: 24102
    arith: 23422
alt_bn128 T5 consumed 4409 gas (EVMMAX)
```

If EVMMAX is designed/implemented correctly we can solve all of these problems. Maybe we can call it "modular non-stack based math", or "modular stack-immediate based math"
