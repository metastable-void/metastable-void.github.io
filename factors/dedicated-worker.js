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
		primeFactors.push (input + '');
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

