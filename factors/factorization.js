/* -*- tab-width: 4; indent-tabs-mode: t -*- */
/*
	Copyright 2019 (C) 東大女装子コンテスト実行委員会

	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at

	https://www.apache.org/licenses/LICENSE-2.0

	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
*/

'use strict'; // for non-module scripts

// Linear algebra over finite field F_2
const BitMatrix = class extends Uint8Array {
	constructor (rows, cols) {
		rows |= 0;
		cols |= 0;
		if (rows < 0 || cols < 0) {
			throw new TypeError ('invalid size');
		}
		
		super (rows * cols);
		
		Reflect.defineProperty (this, 'rows', {value: rows});
		Reflect.defineProperty (this, 'cols', {value: cols});
	}
	
	static get [Symbol.species] () {
		return Uint8Array;
	}
	
	get size () {
		return new Uint32Array ([this.rows, this.cols]);
	}
	
	toIndex (i, j) {
		if (i < 0) i = (i % this.rows) + this.rows;
		i %= this.rows;
		if (j < 0) j = (j % this.cols) + this.cols;
		j %= this.cols;
		return i * this.cols + j;
	}
	
	get (i, j) {
		return this[this.toIndex (i, j)] & 1;
	}
	
	getRow (i) {
		if (i < 0) i = (i % this.rows) + this.rows;
		i %= this.rows;
		const start = i * this.cols;
		return this.subarray (start, start + this.cols);
	}
	
	getColumn (j) {
		if (j < 0) j = (j % this.cols) + this.cols;
		j %= this.cols;
		const matrix = this;
		return new Uint8Array (function * () {
			for (let i = 0; i < matrix.rows; i++) {
				yield matrix[i * matrix.cols + j];
			}
		} ());
	}
	
	add (i, j, bit) {
		return this[this.toIndex (i, j)] ^= bit & 1;
	}
	
	flip (i, j) {
		return this[this.toIndex (i, j)] ^= 1;
	}
	
	set (i, j, bit) {
		return this[this.toIndex (i, j)] = bit & 1;
	}
	
	multiply (i, j, bit) {
		return this[this.toIndex (i, j)] &= bit & 1;
	}
	
	nullify (i, j) {
		return this[this.toIndex (i, j)] &= 0;
	}
	
	clear () {
		if (!super.fill) {
			Array.prototype.fill.call (this, 0);
		} else {
			super.fill (0);
		}
		return this;
	}
	
	fill (bit) {
		if (!super.fill) {
			Array.prototype.fill.call (this, bit & 1);
		} else {
			super.fill (bit & 1);
		}
		return this;
	}
	
	fillRow (bit, i) {
		if (i < 0) i = (i % this.rows) + this.rows;
		i %= this.rows;
		const start = i * this.cols;
		if (!super.fill) {
			Array.prototype.fill.call (this, bit & 1, start, start + this.cols);
		} else {
			super.fill (bit & 1, start, start + this.cols);
		}
		return this;
	}
	
	fillColumn (bit, j) {
		if (j < 0) j = (j % this.cols) + this.cols;
		j %= this.cols;
		bit &= 1;
		for (let i = 0; i < this.rows; i++) {
			this[i * this.cols + j] = bit;
		}
		return this;
	}
	
	swapRows (i1, i2) {
		if (i1 < 0) i1 = (i1 % this.rows) + this.rows;
		i1 %= this.rows;
		if (i2 < 0) i2 = (i2 % this.rows) + this.rows;
		i2 %= this.rows;
		const start1 = i1 * this.cols;
		const start2 = i2 * this.cols;
		const row1 = new Uint8Array (this.subarray (start1, start1 + this.cols));
		const row2 = new Uint8Array (this.subarray (start2, start2 + this.cols));
		super.set (row1, start2);
		super.set (row2, start1);
		return this;
	}
	
	addRows (to, from) {
		if (to < 0) to = (to % this.rows) + this.rows;
		to %= this.rows;
		if (from < 0) from = (from % this.rows) + this.rows;
		from %= this.rows;
		const to_start = to * this.cols;
		const from_start = from * this.cols;
		for (let j = 0; j < this.cols; j++) {
			this[to_start + j] ^= this[from_start + j];
		}
		return this;
	}
	
	// Gaussian elimination
	rowReduction () {
		this.rank = 0;
		for (let row = 0; row < this.rows; row++) {
			for (let j = row; j < this.cols; j++) {
				let i;
				for (i = row; i < this.rows; i++) {
					if (this[i * this.cols + j]) {
						this.rank++;
						break;
					}
				}
				
				if (i == this.rows) {
					continue;
				} else if (i > row) {
					this.swapRows (i, row);
				}
				
				for (i = 0; i < this.rows; i++) {
					if (i == row) continue;
					if (this[i * this.cols + j]) {
						this.addRows (i, row);
					}
				}
				
				break;
			}
		}
		
		return this.rank;
	}
	
	getKernel () {
		this.rowReduction ();
		let column = 0;
		const basis = [];
		const pivots = [];
		
		for (let row = 0; row < this.rows; row++) {
			while (column < this.cols && 0 == this[row * this.cols + column]) {
				const vector = new Uint8Array (this.cols);
				for (let i = 0; i < row; i++) {
					const pivot = pivots[i];
					vector[pivot] = this[i * this.cols + column];
				}
				vector[column] = 1;
				basis.push (vector);
				column++;
			}
				
			if (column < this.cols) {
				pivots[row] = column;
				column++;
				continue;
			} else {
				break;
			}
		}
		
		return basis;
	}
	
	toString () {
		let str = '';
		for (let i = 0; i < this.rows; i++) {
			str += '[' + this.getRow (i) + ']\n';
		}
		return str;
	}
};

Object.freeze (BitMatrix.prototype);

const rand = max => {
	max = bigInt (max);
	const bits = max.bitLength ();
	const r = bits & 7;
	
	let n;
	do {
		const bytes = crypto.getRandomValues (new Uint8Array (bits >> 3));
		bytes[0] >>= 8 - r;
		n = bigInt.fromArray ([... bytes], 256);
	} while (n.greater (max));
	
	return n;
};

// Euler's criterion
const isQuadraticResidue = (n, p) => {
	if (p <= 2) {
		return true;
	}
	
	const e = p >> 1;
	return bigInt (n).modPow (e, p).equals (1);
};

// Tonelli--Shanks algorithm
const modular_sqrt = (n, p, l) => {
	n = bigInt (n);
	if (p <= 2) {
		return n.mod (p);
	}
	
	let q = p - 1;
	let s = 0;
	while (0 == (1 & q)) {
		s++;
		q >>= 1;
	}
	
	let z = 2;
	while (isQuadraticResidue (z, p)) {
		z++;
	}
	
	let m = s;
	let c = bigInt (z).modPow (q, p);
	let t = n.modPow (q, p);
	let q_div_2 = (q + 1) >> 1;
	let r = n.modPow (q_div_2, p);
	
	while (true) {
		if (t.equals (0)) {
			return t;
		} else if (t.equals (1)) {
			return r;
		}
		
		let i = 1;
		let e = bigInt (1);
		while (i < m) {
			e = e.multiply (2);
			if (t.modPow (e, p).equals (1)) {
				break;
			}
			i++;
		}
		if (i == m) {
			throw new TypeError ('no root');
		}
		
		let b = c.modPow (bigInt (2).pow (m - i - 1), p);
		m = i;
		c = b.modPow (2, p);
		t = t.multiply (c).mod (p);
		r = r.multiply (b).mod (p);
	}
};

// binary search using integer arithmetic
const ceil_sqrt = n => {
	n = bigInt (n);
	let hi = bigInt (1);
	while (hi.multiply (hi).lesserOrEquals (n)) {
		hi = hi.multiply (2);
	}
	let lo = hi.divide (2);
	
	let result;
	while (lo.lesserOrEquals (hi)) {
		let mid = lo.add (hi).divide (2);
		let sq = mid.multiply (mid);
		let comparison = sq.compare (n);
		if (0 == comparison) {
			return mid;
		} else if (1 == comparison) {
			result = mid;
			hi = mid.subtract (1);
		} else {
			lo = mid.add (1);
		}
	}
	
	return result;
};

const smallPrimes = [];
for (let i = 2; i < 10000; i++) {
	if (!bigInt (i).isPrime ()) continue;
	smallPrimes.push (i);
}

const factor = async input => {
	const n = bigInt (input);
	
	const timings = [];
	let lastTime;
	const timer = msg => {
		const time = +new Date;
		console.info (timings.length, ':', msg);
		if (timings.length > 0) {
			console.log (
				'duration/ms:', time - timings[timings.length - 1].time
				, 'total/ms:', time - timings[0].time
			);
		}
		timings.push ({msg, time});
		lastTime = time;
	};
	
	const progress = (... args) => {
		const time = +new Date;
		if (5000 > time - lastTime) {
			return;
		}
		
		console.info ('progress:', ... args);
		lastTime = time;
	};
	
	for (let p of smallPrimes) {
		if (n.isDivisibleBy (p)) {
			return [p.toString (), n.divide (p).toString ()];
		}
	}
	
	if (n.lesser (100000000)) {
		return [n.toString ()];
	}
	
	timer ('Staring quadratic sieve...');
	console.log ('n =', input, '(', n.bitLength ().value, 'bits)');
	
	const ceil_sqrt_n = ceil_sqrt (n);
	const block_size = 256;
	const max_offset = Number.MAX_SAFE_INTEGER - block_size;
	
	const factor_basis_size = Math.trunc (2 ** (n.bitLength () / 32) * 96);
	const b_primes = [2];
	
	for (let i = 3; i < Number.MAX_SAFE_INTEGER; i += 2) {
		if (b_primes.length == factor_basis_size) break;
		if (!bigInt (i).isPrime ()) continue;
		if (isQuadraticResidue (n, i)) {
			b_primes.push (i);
		}
	}
	console.log ('factor basis primes:', b_primes);
	const k2 = b_primes.length;
	
	timer ('Initialization done...');
	await Promise.resolve ();
	
	// solve equation for each prime p
	const p_divisibles = [];
	for (let i = 0; i < k2; i++) {
		const p = b_primes[i];
		
		const minus_ceil_sqrt_n = (bigInt[0].subtract (ceil_sqrt_n).mod (p) + p) % p;
		const sqrt_1 = +modular_sqrt (n, p);
		const sqrt_2 = p - sqrt_1;
		
		p_divisibles[i] = [];
		p_divisibles[i][0] = (sqrt_1 + minus_ceil_sqrt_n) % p;
		if (sqrt_2 != sqrt_1) {
			p_divisibles[i][1] = (sqrt_2 + minus_ceil_sqrt_n) % p;
		}
	}
	
	timer ('Solved basic polynominal over the factor basis...');
	await Promise.resolve ();
	
	let smoothCounter = 0;
	//const smoothValues = [];
	const smoothFactors = [];
	const a = [];
	
	// This is the most costly part
	main_loop:
	for (let offset = 0; offset < max_offset; offset += block_size) {
		//const vector = [];
		const tmp_vector = [];
		const tmp_factors = [];
		
		for (let i = 0; i < block_size; i++) {
			tmp_vector[i] = ceil_sqrt_n.add (i).add (offset).pow (2).subtract (n);
			//tmp_vector[i] = vector[i];
			tmp_factors[i] = new Uint32Array (k2);
		}
		
		for (let i = 0; i < k2; i++) {
			const p = b_primes[i];
			const start = p_divisibles[i].map (x => (p - ((p + offset - x) % p)) % p);
			
			for (let js = start; js.some (j => j < block_size); js = js.map (j => j + p)) {
				for (let j of js) {
					if (j < block_size) {
						do {
							tmp_factors[j][i]++;
							tmp_vector[j] = tmp_vector[j].divide (p);
						} while (tmp_vector[j].isDivisibleBy (p));
						
						if (tmp_vector[j].equals (1)) {
							smoothFactors[smoothCounter] = tmp_factors[j];
							a[smoothCounter] = ceil_sqrt_n.add (j).add (offset);
							
							smoothCounter++;
							if (smoothCounter > k2) {
								break main_loop;
							}
							
							progress (smoothCounter, 'roots...');
						}
					}
				}
			}
		}
		
		await Promise.resolve ();
	}
	
	let k3 = smoothFactors.length;
	timer ('Sieving done: ' + k3 + ' B-smooth square roots modulo n');
	await Promise.resolve ();
	
	console.log ('matrix:', k2 + ' * ' + k3, '=', k2 * k3);
	const bits = new BitMatrix (k2, k3);
	for (let i = 0; i < k2; i++) {
		for (let j = 0; j < k3; j++) {
			bits.set (i, j, smoothFactors[j][i]);
		}
	}
	
	const kernel = bits.getKernel ();
	
	timer ('Done calculating linear algebra over finite field...');
	await Promise.resolve ();
	console.log ('reduced matrix:', 'rank =', bits.rank);
	
	console.log ('nontrivial dependencies:', kernel.length);
	for (let basis of kernel) {
		console.log ('basis of the kernel:', ... basis);
		let e = new Uint32Array (k2);
		let x = bigInt[1];
		const roots = [];
		for (let j = 0; j < k3; j++) {
			if (0 == basis[j]) continue;
			
			roots.push (a[j].value);
			x = x.multiply (a[j]).mod (n);
			for (let i = 0; i < k2; i++) {
				e[i] += smoothFactors[j][i];
			}
		}
		
		let y = bigInt[1];
		for (let i = 0; i < k2; i++) {
			y = bigInt (b_primes[i]).modPow (e[i] >> 1, n).multiply (y).mod (n);
		}
		
		const comparison = n.subtract (y).notEquals (x);
		if (comparison && x.notEquals (y)) {
			console.log ('roots:', ... roots);
			console.log ('factors:', ... e);
			console.log ('x:', x.toString (), 'y:', y.toString ());
			
			const p = bigInt.gcd (x.subtract (y), n).toString ();
			const q = bigInt.gcd (x.add (y), n).toString ();
			console.log ('factorization done:', p, q);
			timer ('Finished!');
			await Promise.resolve ();
			return [p, q];
		} else {
			console.log ('skipping trivial factors');
		}
		
		await Promise.resolve ();
	}
	
	console.log ('giving up:', n.value);
	timer ('Failed!');
	await Promise.resolve ();
	return [n.toString ()];
};


