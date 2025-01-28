import randomf from 'randomf'
import { altbn128, bls12381, m31 } from "./index.mjs"
// adapted from: https://github.com/chancehudson/poseidon-hash/blob/main/src/index.mjs

export function poseidonT3(_inputs, { statex, ops }) {
  const T = 3
  const { addmodx, add, mulmodx, loadx, storex } = ops

  let N_ROUNDS_F, N_ROUNDS_P, C, M, F
  if (statex.mod === altbn128) {
    N_ROUNDS_F = 8
    N_ROUNDS_P = 57
    F = altbn128
  } else if (statex.mod === bls12381) {
    N_ROUNDS_F = 8
    N_ROUNDS_P = 56
    F = bls12381
  } else if (statex.mod === m31) {
    N_ROUNDS_F = 12
    N_ROUNDS_P = 19
    F = m31
  } else {
    throw new Error('unsupported modulus')
  }

  const inputs = _inputs.map(() => F - 1n)
  if (inputs.length !== T - 1) {
    throw new Error('bad input length')
  }

  // generate some random round constants, we're not planning to use
  // this as a real hash function
  //
  // T * (N_ROUNDS_F + N_ROUNDS_P)
  C = Array(T * (N_ROUNDS_F + N_ROUNDS_P)).fill(0n).map(() => F - 1n)
  // assume we need to read each of these into monty repr at runtime?
  for (const v of C) {
    storex(v)
  }

  // generate a random TxT MDS matrix
  M = Array(T).fill(0n).map(() => Array(T).fill(0n).map(() => F - 1n))
  // same with the mds matrix
  for (const v of M) {
    for (const vv of v) {
      storex(vv)
    }
  }

  // return v^5
  const pow5 = (v) => {
    const sq = mulmodx(v, v)
    const qu = mulmodx(sq, sq)
    return mulmodx(v, qu)
  }

  const mix = (state) => {
    const out = []
    for (let x = 0; x < state.length; x++) {
      let o = 0n
      for (let y = 0; y < state.length; y++) {
        o = addmodx(o, mulmodx(M[x][y], state[y]))
      }
      out.push(o)
    }
    return out
  }

  // read inputs into monty repr
  for (const v of inputs) {
    storex(v)
  }

  let state = [0n, ...inputs]
  for (let x = 0; x < N_ROUNDS_F + N_ROUNDS_P; x++) {
    for (let y = 0; y < state.length; y++) {
      state[y] = addmodx(state[y], C[x * T + y])
      if (x < N_ROUNDS_F / 2 || x >= N_ROUNDS_F / 2 + N_ROUNDS_P)
        state[y] = pow5(state[y])
      else if (y === 0) state[y] = pow5(state[y])
    }
    state = mix(state, M)
  }
  // pull the value out of monty
  loadx(state[0])
  return state[0]
}
