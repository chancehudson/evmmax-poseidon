import randomf, { random } from 'randomf'
import { poseidonT3 } from './poseidon.mjs'

export const altbn128 = BigInt(
  '0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001',
)

export const bls12381 = BigInt(
  '0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001',
)

{
  const { statex, ops } = createStateEvmmax(altbn128)
  poseidonT3([0n, 0n], { statex, ops })
  console.log(`EVMMAX impl consumed ${statex.gasCost} gas (alt_bn128)`)
}

{
  const { statex, ops } = createState(altbn128)
  ops.add = ops.addmodx
  poseidonT3([0n, 0n], { statex, ops })
  console.log(`Normal impl consumed ${statex.gasCost} gas (alt_bn128)`)
}

{
  const { statex, ops } = createState(altbn128)
  poseidonT3([0n, 0n], { statex, ops })
  console.log(`Normal impl (lazy reduction) consumed ${statex.gasCost} gas (alt_bn128)`)
}

///////
export function log2floor(v) {
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
  }
  let mulCost
  if (log2floor(statex.mod) < 256n) {
    mulCost = 1n
  } else if (log2floor(statex.mod) < 384n) {
    mulCost = 2n
  } else if (log2floor(statex.mod) < 448n) {
    mulCost = 3n
  } else if (log2floor(statex.mod) < 512n) {
    mulCost = 4n
  } else {
    throw new Error('modulus larger than 512 bits')
  }
  let addCost
  if (log2floor(statex.mod) < 512n) {
    addCost = 1n
  } else if (log2floor(statex.mod) > 768n) {
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
      // unclear what this should be
    }),
    addmodx: bind((_state, ) => {
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

function createState(F) {
  const statex = {
    mod: BigInt(F),
    gasCost: 0n,
  }
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
    add: bind((_state) => {
      // in some cases we can add without overflowing and defer
      // the reduction to a future step
      // see here: https://github.com/chancehudson/poseidon-solidity/blob/main/contracts/PoseidonT3.sol#L46
      _state.gasCost += 3n
      return randomf(F)
    }),
    addmodx: bind((_state) => {
      // assuming addmod
      _state.gasCost += 8n
      return randomf(F)
    }),
    mulmodx: bind((_state) => {
      // assuming mulmod
      _state.gasCost += 8n
      return randomf(F)
    }),
  }
  return { statex, ops }
}
