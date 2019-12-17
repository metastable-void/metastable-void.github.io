/* -*- tab-width: 4; indent-tabs-mode: t -*- */

// Define globalThis.bigInt
import './BigInteger.min.js';

const WORKER_URI = 'https://www.exec.su/factors/factorization-worker.js';

async function findFactors (n, smoothSquaresFactors, smoothRoots, primeBase) {
	const worker = new Worker (WORKER_URI);
	worker.addEventListener ('error', ev => {
		console.error ('Error in worker:', ev);
	});
	
	console.info ('Calculating linear algebra over finite field...');
	worker.postMessage ({command: 'linear_algebra'
		, input: n.toString (), smoothSquaresFactors, smoothRoots, primeBase});
	
	return await new Promise ((resolve, reject) => {
		const callback = function callback (ev) {
			const {data, target} = ev;
			target.removeEventListener ('message', callback);
			
			console.log ('Matrix:', data.rows, '*', data.cols, '=', data.rows * data.cols);
			console.log ('Reduced: rank =', data.rank);
			console.log ('Nontrivial dependencies:', data.dependencies);
			console.log ('Skipped trivial factors:', data.skippedTrivialFactors);
			if ('factors_found' !== data.command) {
				reject (data);
			}
			
			resolve (data.factors);
		};
		
		worker.addEventListener ('message', callback);
	});
}

export async function* factorize (n) {
	const primeFactors = [];
	n = bigInt (n);
	if (n.isNegative ()) {
		n = n.multiply (bigInt[-1]);
		yield '-1';
		console.log ('extracting', -1, 'as a factor');
	}
	if (n.lesser (4) || n.isProbablePrime ()) {
		const str = n.toString ();
		console.log ('is prime:', str);
		yield str;
		return;
	}
	
	const worker1 = new Worker (WORKER_URI);
	worker1.addEventListener ('error', ev => {
		console.error ('Error in worker:', ev);
	});
	
	worker1.postMessage ({command: 'init', input: n.toString ()});
	const {factors, primeBase, multiples, sqrt} = await new Promise ((resolve, reject) => {
		const callback = function callback (ev) {
			const {data, target} = ev;
			if ('init_done' !== data.command) return;
			target.removeEventListener ('message', callback);
			resolve (data);
		};
		worker1.addEventListener ('message', callback);
	});
	
	let factor1, factor2;
	if (factors) {
		if (factors.length != 2) {
			throw new TypeError ('Not factored');
		}
		[factor1, factor2] = factors;
		console.log ('factors found by trial division');
	} else {
		console.log ('initialization done');
		const primeBaseSize = primeBase.length;
		const smoothMinNumber = Math.trunc (primeBaseSize * 19 / 20);
		const smoothTargetNumber = primeBaseSize + 1;
		
		const worker2 = new Worker (WORKER_URI);
		worker2.addEventListener ('error', ev => {
			console.error ('Error in worker:', ev);
		});
		
		console.info ('starting sieving: n =', n.toString (), '(' + n.bitLength ().toString () + ' bits)...');
		console.log ('Prime base size:', primeBaseSize);
		const time_sieving_start = +new Date;
		let last_tick = time_sieving_start;
		
		worker1.postMessage ({command: 'sieving'
			, input: n.toString (), primeBase, multiples, sqrt, offset: 0, step: 1});
		/*worker2.postMessage ({command: 'sieving'
			, input: n.toString (), primeBase, multiples, sqrt, offset: -1, step: -1});*/
		
		const factors = await new Promise ((resolve, reject) => {
			// Factorization of squares over the factor base
			const smoothSquaresFactors = [];
			
			// numbers whose square is B-smooth
			const smoothRoots = [];
			
			let worker1Count = 0, worker2Count = 0;
			let terminated = false;
			const smoothFoundCallback = function callback (ev) {
				const {data, target} = ev;
				if (terminated) return;
				if ('smooth_found' !== data.command) return;
				
				/*
				if (target === worker1) {
					worker1Count++;
				} else if (target === worker2) {
					worker2Count++;
				}
				*/
				
				smoothSquaresFactors.push (data.factors);
				smoothRoots.push (data.root);
				
				const smoothCount = smoothRoots.length;
				
				const current_time = +new Date;
				if (smoothCount == smoothTargetNumber || current_time - last_tick >= 5000) {
					console.info ('Sieving progress:', smoothCount, 'roots found...');
					last_tick = current_time;
					if (smoothMinNumber > smoothCount) {
						return;
					}
					
					findFactors (n, smoothSquaresFactors, smoothRoots, primeBase)
					.then (factors => {
						terminated = true;
						worker1.removeEventListener ('message', smoothFoundCallback);
						worker2.removeEventListener ('message', smoothFoundCallback);
						worker1.terminate ();
						worker2.terminate ();
						console.log ('Terminating sieving workers.', smoothRoots.length, 'B-smooth square roots modulo n');
						//console.log ('Worker 1:', worker1Count, 'Worker 2:', worker2Count);
						resolve (factors);
					})
					.catch (e => {
						console.info ('Factors not found yet:', e);
					});
				}
			};
			worker1.addEventListener ('message', smoothFoundCallback);
			//worker2.addEventListener ('message', smoothFoundCallback);
		});
		
		console.info ('Factors found with quadratic sieve');
		[factor1, factor2] = factors;
	}
	
	console.info (n.toString (), '=', factor1, '*', factor2);
	for await (let factor of factorize (factor1)) {
		yield factor;
	}
	for await (let factor of factorize (factor2)) {
		yield factor;
	}
}

export async function getPrimeDecomposition (n) {
	const factorsMap = new Map;
	for await (let factor of factorize (n)) {
		const count = factorsMap.has (factor) ? factorsMap.get (factor) : 0;
		factorsMap.set (factor, count + 1);
	}
	const primeFactors = [... factorsMap.keys ()].sort ((a, b) => bigInt (a).compare (b));
	const sortedFactors = new Map;
	for (let p of primeFactors) {
		sortedFactors.set (p, factorsMap.get (p));
	}
	return sortedFactors;
}


