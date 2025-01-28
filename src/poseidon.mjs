import randomf from 'randomf'
import { altbn128, bls12381, m31 } from "./index.mjs"
// adapted from: https://github.com/chancehudson/poseidon-hash/blob/main/src/index.mjs

export function poseidon(T, { statex, ops }) {
  const { addmodx, mulmodx, push, dup, swap, pop, loadx, storex } = ops

  let N_ROUNDS_F, N_ROUNDS_P, C, M, F
  if (statex.mod === altbn128 && T === 3) {
    N_ROUNDS_F = 8
    N_ROUNDS_P = 57
    F = altbn128
  } else if (statex.mod === altbn128 && T === 5) {
      N_ROUNDS_F = 8
      N_ROUNDS_P = 60
      F = altbn128
  } else if (statex.mod === bls12381 && T === 3) {
    N_ROUNDS_F = 8
    N_ROUNDS_P = 56
    F = bls12381
  } else if (statex.mod === m31 && T === 3) {
    N_ROUNDS_F = 12
    N_ROUNDS_P = 19
    F = m31
  } else if (statex.mod === m31 && T === 8) {
    N_ROUNDS_F = 8
    N_ROUNDS_P = 13
    F = m31
  } else {
    throw new Error('unsupported modulus')
  }

  const inputs = Array(T - 1).fill().map(() => F - 1n)

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
    // assume we dup the input arg
    dup()
    // dup for the square
    dup()
    const sq = mulmodx(v, v)
    // dup for the quart
    dup()
    const qu = mulmodx(sq, sq)
    // swap/dup the input once more
    dup()
    swap() // swap the output to the input position
    pop() // pop the top of the stack
    return mulmodx(v, qu)
  }

  const mix = (state) => {
    const out = []
    for (let x = 0; x < state.length; x++) {
      let o = 0n
      for (let y = 0; y < state.length; y++) {
        push()
        dup() // dup our state[y] value
        o = addmodx(o, mulmodx(M[x][y], state[y]))
      }
      // put the output back in the variables stack position
      swap()
      // clean the top of the stack
      pop()
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
      push() // put the round constant on the stack
      dup() // pull our state[y] to the top of the stack
      state[y] = addmodx(state[y], C[x * T + y])
      if (x < N_ROUNDS_F / 2 || x >= N_ROUNDS_F / 2 + N_ROUNDS_P)
        state[y] = pow5(state[y])
      else if (y === 0) state[y] = pow5(state[y])
      swap() // put our new state[y] in the right position
      pop() // clean the top of the stack
    }
    state = mix(state, M)
  }
  // pull the value out of monty
  loadx(state[0])
  return state[0]
}
