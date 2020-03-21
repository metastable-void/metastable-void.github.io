/* -*- tab-width: 4; indent-tabs-mode: t -*- */

'use strict'; // for non-module scripts

this.console = {
	debug (... args) {
		postMessage ({type: 'console', level: 'log', values: args});
	},
	
	log (... args) {
		postMessage ({type: 'console', level: 'log', values: args});
	},
	
	info (... args) {
		postMessage ({type: 'console', level: 'info', values: args});
	},
	
	warn (... args) {
		postMessage ({type: 'console', level: 'warn', values: args});
	},
	
	error (... args) {
		postMessage ({type: 'console', level: 'error', values: args});
	},
};

importScripts ('/factors/BigInteger.min.js');
importScripts ('/factors/factorization.js');

const recursiveFactor = async input => {
	const primeFactors = [];
	input = bigInt (input);
	if (input.lesser (4) || input.isProbablePrime ()) {
		primeFactors.push (input.toString ());
	} else {
		const [a, b] = await factor (input);
		const factors1 = await recursiveFactor (a);
		const factors2 = await recursiveFactor (b);
		for (let p of factors1) {
			primeFactors.push (p);
		}
		for (let p of factors2) {
			primeFactors.push (p);
		}
	}
	return primeFactors;
};

const compute = async (port, data) => {
	const {input} = data;
	
	const start = +new Date;
	
	const factors = await recursiveFactor (input);
	const end = +new Date;
	
	// run the event loop
	await Promise.resolve ();
	
	port.postMessage ({type: 'factors', factors, duration: end - start, input});
};

onmessage = ev => {
	if (ev.data && ev.data.type) {
		switch (ev.data.type) {
			case 'pf':
				compute (self, ev.data)
				.then (() => {
					console.log ('Computation completed');
				})
				.catch (e => {
					console.error (e);
				});
				break;
		}
	}
};

