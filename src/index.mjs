import randomf, { random } from 'randomf'
import { poseidon } from './poseidon.mjs'

export const altbn128 = BigInt(
  '0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001',
)

export const bls12381 = BigInt(
  '0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001',
)

export const m31 = BigInt(2n ** 31n - 1n)


console.log('----')
{
  const { statex, ops } = createState(altbn128)
  poseidon(3, { statex, ops })
  console.log(`alt_bn128 T3 consumed ${statex.gasCost} gas (normal)`)
  console.log(`    stack: ${statex.gasCostStack}`)
  console.log(`    arith: ${statex.gasCostArith}`)
}

{
  const { statex, ops } = createStateEvmmax(altbn128)
  poseidon(3, { statex, ops })
  console.log(`alt_bn128 T3 consumed ${statex.gasCost} gas (EVMMAX)`)
}

console.log('----')
{
  const { statex, ops } = createState(altbn128)
  poseidon(5, { statex, ops })
  console.log(`alt_bn128 T5 consumed ${statex.gasCost} gas (normal)`)
  console.log(`    stack: ${statex.gasCostStack}`)
  console.log(`    arith: ${statex.gasCostArith}`)
}

{
  const { statex, ops } = createStateEvmmax(altbn128)
  poseidon(5, { statex, ops })
  console.log(`alt_bn128 T5 consumed ${statex.gasCost} gas (EVMMAX)`)
}
console.log('----')

{
  const { statex, ops } = createState(m31)
  poseidon(3, { statex, ops })
  console.log(`m31 T3 consumed ${statex.gasCost} gas (normal)`)
  console.log(`    stack: ${statex.gasCostStack}`)
  console.log(`    arith: ${statex.gasCostArith}`)
}

{
  const { statex, ops } = createStateEvmmax(m31)
  poseidon(3, { statex, ops })
  console.log(`m31 T3 consumed ${statex.gasCost} gas (EVMMAX)`)
}
console.log('----')

{
  const { statex, ops } = createState(m31)
  poseidon(8, { statex, ops })
  console.log(`m31 T8 consumed ${statex.gasCost} gas (normal)`)
  console.log(`    stack: ${statex.gasCostStack}`)
  console.log(`    arith: ${statex.gasCostArith}`)
}

{
  const { statex, ops } = createStateEvmmax(m31)
  poseidon(8, { statex, ops })
  console.log(`m31 T8 consumed ${statex.gasCost} gas (EVMMAX)`)
}
console.log('----')


///////
export function log2ceil(v) {
  if (typeof v !== 'bigint') throw new Error('log2 expected bigint')
  if (v < 0n) throw new Error('log2 received negative bigint')
  if (v === 0n) throw new Error('log2 received 0')
  if (v === 1n) return 0n
  let pow = 1n
  while (2n ** pow < v) {
    pow += 1n
  }
  return pow
}

function createStateEvmmax(F) {
  const statex = {
    mod: BigInt(F),
    gasCost: 0n,
    gasCostStack: 0n,
    gasCostArith: 0n
  }
  let mulCost
  if (log2ceil(statex.mod) < 256n) {
    mulCost = 1n
  } else if (log2ceil(statex.mod) < 384n) {
    mulCost = 2n
  } else if (log2ceil(statex.mod) < 448n) {
    mulCost = 3n
  } else if (log2ceil(statex.mod) < 512n) {
    mulCost = 4n
  } else {
    throw new Error('modulus larger than 512 bits')
  }
  let addCost
  if (log2ceil(statex.mod) < 512n) {
    addCost = 1n
  } else if (log2ceil(statex.mod) > 768n) {
    addCost = 2n
  } else {
    throw new Error('modulus larger than 768 bits')
  }

  const bind = (fn) => (...args) => fn(statex, ...args)
  const ops = {
    setmodx: bind((_state) => {
      // TODO: use COST_SETMODX_BASE
    }),
    loadx: bind((_state) => {
      // unclear what this should be
    }),
    storex: bind((_state) => {
      _state.gasCost += mulCost
    }),
    push: bind((_state) => { }),
    dup: bind((_state) => { }),
    pop: bind((_state) => { }),
    swap: bind((_state) => { }),
    addmodx: bind((_state) => {
      _state.gasCost += addCost
      return randomf(F)
    }),
    mulmodx: bind((_state) => {
      _state.gasCost += mulCost
      return randomf(F)
    }),
  }
  // stub the add impl
  ops.add = ops.addmodx
  return { statex, ops }
}

function createState(F, lazyReduction = true) {
  const statex = {
    mod: BigInt(F),
    gasCost: 0n,
    gasCostStack: 0n,
    gasCostArith: 0n
  }
  const stackop = (cost) => bind((_state) => {
    _state.gasCost += cost
    _state.gasCostStack += cost
  })
  const bind = (fn) => (...args) => fn(statex, ...args)
  const ops = {
    setmodx: bind((_state) => {
      // TODO: use COST_SETMODX_BASE
    }),
    loadx: bind((_state) => {
      // in non-evmmax impl this does not exist
    }),
    storex: bind((_state) => {
      // in non-evmmax impl this does not exist
    }),
    push: stackop(3n),
    dup: stackop(3n),
    pop: stackop(2n),
    swap: stackop(3n),
    addmodx: bind((_state, lhs, rhs) => {
      // assuming addmod
      let out = lhs + rhs
      const outBits = log2ceil(out)
      if (outBits >= 256 || !lazyReduction) {
        /// simulate a mod call
        _state.gasCost += 8n
        _state.gasCostArith += 8n
        out %= _state.mod
        // if we do a reduction we need to push the field constant
        // to the top of the stack too
        _state.gasCostStack += 3n
        _state.gasCost += 3n
      } else {
        _state.gasCost += 3n
        _state.gasCostArith += 3n
      }
      return out
    }),
    mulmodx: bind((_state, lhs, rhs) => {
      // assuming mulmod
      let out = lhs * rhs
      const outBits = log2ceil(out)
      if (outBits >= 256 || !lazyReduction) {
        /// simulate a mod call
        _state.gasCost += 8n
        _state.gasCostArith += 8n
        out %= _state.mod
        // if we do a reduction we need to push the field constant
        // to the top of the stack too
        _state.gasCostStack += 3n
        _state.gasCost += 3n
      } else {
        _state.gasCost += 5n
        _state.gasCostArith += 5n
      }
      return out
    }),
  }
  return { statex, ops }
}
