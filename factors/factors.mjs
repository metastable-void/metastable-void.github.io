/* -*- tab-width: 4; indent-tabs-mode: t -*- */

const CONSOLE_DEBUG = Symbol ('debug');
const CONSOLE_INFO = Symbol ('info');
const CONSOLE_WARN = Symbol ('warn');
const CONSOLE_ERROR = Symbol ('error');

const TypedArray = Reflect.getPrototypeOf (Uint8Array.prototype).constructor;

class ConsoleValue extends HTMLElement {
	constructor (value, parent) {
		super ();
		
		Reflect.defineProperty (this, 'parentValue', {value: parent instanceof ConsoleValue ? parent : null});
		const shadowRoot = this.attachShadow ({mode: 'closed'});
		const stylesheet = document.createElement ('link');
		stylesheet.rel = 'stylesheet';
		stylesheet.href = '/assets/css/console-value.css';
		shadowRoot.appendChild (stylesheet);
		
		const label = shadowRoot.appendChild (document.createElement ('span'));
		label.id = 'label';
		
		const properties = shadowRoot.appendChild (document.createElement ('span'));
		properties.id = 'properties';
		
		let kind = 'empty';
		properties.hidden = true;
		
		if (null === value) {
			label.textContent = 'null';
		} else if ('undefined' == typeof value) {
			label.textContent = 'undefined';
		} else if ('boolean' == typeof value) {
			kind = 'keyword';
			label.textContent = value.toString ();
		} else if ('number' == typeof value) {
			if (value !== value) {
				label.textContent = 'NaN';
			} else if (Infinity === value) {
				kind = 'keyword';
				label.textContent = '+\u2060Infinity';
			} else if (-Infinity === value) {
				kind = 'keyword';
				label.textContent = '-\u2060Infinity';
			} else if (Object.is (-0, value)) {
				kind = 'number';
				label.textContent = '-\u20600';
			} else {
				kind = 'number';
				label.textContent = value.toString ().split ('-').join ('-\u2060');
			}
		} else if ('symbol' == typeof value) {
			kind = 'keyword';
			label.textContent = value.toString ();
		} else if ('bigint' == typeof value) {
			kind = 'number';
			label.textContent = value.toString () + 'n';
		} else if ('string' == typeof value) {
			kind = 'string';
			label.textContent = value;
		} else if ('function' == typeof value) {
			kind = 'function';
			label.textContent = 'function ' + value.name + '(' + value.length + ')';
		} else if (Array.isArray (value) || value instanceof TypedArray) {
			kind = 'array';
			label.textContent = value.constructor.name + '(' + value.length + ')';
			properties.hidden = false;
			if (!this.parentValue) for (let element of value) {
				const child = new ConsoleValue (element, this);
				child.dataset.role = 'element';
				properties.appendChild (child);
			}
		} else if (value instanceof Set) {
			kind = 'object';
			label.textContent = 'Set(' + value.size + ')';
			properties.hidden = false;
			if (!this.parentValue) for (let element of value) {
				const child = new ConsoleValue (element, this);
				child.dataset.role = 'element';
				properties.appendChild (child);
			}
		} else if (value instanceof Map) {
			kind = 'object';
			label.textContent = 'Map(' + value.size + ')';
			properties.hidden = false;
			if (!this.parentValue) for (let [key, element] of value) {
				const child1 = new ConsoleValue (key, this);
				child1.dataset.role = 'key';
				properties.appendChild (child1);
				const child2 = new ConsoleValue (element, this);
				child2.dataset.role = 'element';
				properties.appendChild (child2);
			}
		} else {
			kind = 'object';
			label.textContent = 'Object';
			properties.hidden = false;
			try {
				label.textContent = value + '';
			} catch (e) {}
			if (!this.parentValue) for (let key of Reflect.ownKeys (value)) {
				const child1 = new ConsoleValue (key, this);
				child1.dataset.role = 'key';
				properties.appendChild (child1);
				const child2 = new ConsoleValue (value[key], this);
				child2.dataset.role = 'element';
				properties.appendChild (child2);
			}
		}
		
		this.dataset.kind = kind;
	}
}

customElements.define ('console-value', ConsoleValue);

class ConsoleOutput extends HTMLElement {
	static get DEBUG () {
		return CONSOLE_DEBUG;
	}
	
	static get LOG () {
		return CONSOLE_DEBUG;
	}
	
	static get INFO () {
		return CONSOLE_INFO;
	}
	
	static get WARN () {
		return CONSOLE_WARN;
	}
	
	static get WARNING () {
		return CONSOLE_WARN;
	}
	
	static get ERROR () {
		return CONSOLE_ERROR;
	}
	
	constructor (level) {
		super ();
		const shadowRoot = this.attachShadow ({mode: 'closed'});
		const stylesheet = document.createElement ('link');
		stylesheet.rel = 'stylesheet';
		stylesheet.href = '/assets/css/console-output.css';
		shadowRoot.appendChild (stylesheet);
		
		const values = document.createElement ('div');
		values.id = 'values';
		const slot = document.createElement ('slot');
		shadowRoot.appendChild (values).appendChild (slot);
		
		switch (level) {
			case ConsoleOutput.ERROR:
				this.dataset.level = 'error';
				break;
			
			case ConsoleOutput.WARN:
				this.dataset.level = 'warn';
				break;
			
			case ConsoleOutput.INFO:
				this.dataset.level = 'info';
				break;
			
			case ConsoleOutput.DEBUG:
			default:
				this.dataset.level = 'debug';
				break;
		}
	}
	
	appendValue (value) {
		this.appendChild (new ConsoleValue (value));
	}
}

customElements.define ('console-output', ConsoleOutput);

class PrimeFactor extends HTMLElement {
	constructor (p, e) {
		const validTypes = ['string', 'number', 'bigint'];
		const p_str = validTypes.includes (typeof p) ? p.toString ().trim () : '';
		const e_str = validTypes.includes (typeof e) ? e.toString ().trim () : '';
		const p_type = p_str !== '';
		const e_type = e_str !== '';
		if (p_type !== e_type) {
			throw new TypeError ('Invalid parameters');
		} else if (p_type) {
			if (!p_str.match (/^[0-9]+$/) || !e_str.match (/^[0-9]+$/)) {
				throw new TypeError ('Invalid value');
			}
		}
		
		super ();
		const shadowRoot = this.attachShadow ({mode: 'closed'});
		
		const hidden = document.createElement ('span');
		hidden.hidden = true;
		shadowRoot.appendChild (hidden);
		
		const slotDefault = document.createElement ('slot');
		hidden.appendChild (slotDefault);
		
		const slotBase = document.createElement ('slot');
		slotBase.name = 'base';
		shadowRoot.appendChild (slotBase);
		
		const sup = document.createElement ('sup');
		const slotExponent = document.createElement ('slot');
		slotExponent.name = 'exponent';
		sup.appendChild (slotExponent);
		shadowRoot.appendChild (sup);
		
		Reflect.defineProperty (this, 'expression', {get: function () {
			const defaultStr = slotDefault.assignedElements ()
			.map (element => element.textContent).join ('').trim ();
			
			const baseStr = slotBase.assignedElements ()
			.map (element => element.textContent).join ('').trim ();
			
			const exponentStr = slotExponent.assignedElements ()
			.map (element => element.textContent).join ('').trim ();
			
			return baseStr !== '' && exponentStr !== ''
				? baseStr + '^' + exponentStr : defaultStr;
		}});
		
		if (p_type) {
			const baseElement = this.appendChild (document.createElement ('span'));
			baseElement.slot = 'base';
			baseElement.textContent = p_str;
			
			const exponentElement = this.appendChild (document.createElement ('span'));
			exponentElement.slot = 'exponent';
			exponentElement.textContent = e_str;
		}
	}
	
	get base () {
		const [b, e] = [... this.expression.split ('^'), ''];
		return b ? b : '0';
	}
	
	get exponent () {
		const [b, e] = [... this.expression.split ('^'), ''];
		return e ? e : '0';
	}
}

customElements.define ('prime-factor', PrimeFactor);

const result = document.getElementById ('result');

const printFactors = (factors) => {
	result.textContent = '';
	const keys = [... factors.keys ()].sort ((a, b) => bigInt (a).compare (b));
	for (let p of keys) {
		const e = factors.get (p);
		const element = result.appendChild (new PrimeFactor (p + '', e + ''));
		element.classList.add ('times');
	}
};

const consoleContainer = document.getElementById ('console');
const trueConsole = window.console;
window.console = {
	debug (... args) {
		trueConsole.log (... args);
		const output = new ConsoleOutput (ConsoleOutput.DEBUG);
		for (let value of args) {
			output.appendValue (value);
		}
		consoleContainer.appendChild (output);
	},
	
	log (... args) {
		this.debug (... args);
	},
	
	info (... args) {
		trueConsole.log (... args);
		const output = new ConsoleOutput (ConsoleOutput.INFO);
		for (let value of args) {
			output.appendValue (value);
		}
		consoleContainer.appendChild (output);
	},
	
	warn (... args) {
		trueConsole.log (... args);
		const output = new ConsoleOutput (ConsoleOutput.WARN);
		for (let value of args) {
			output.appendValue (value);
		}
		consoleContainer.appendChild (output);
	},
	
	error (... args) {
		trueConsole.log (... args);
		const output = new ConsoleOutput (ConsoleOutput.ERROR);
		for (let value of args) {
			output.appendValue (value);
		}
		consoleContainer.appendChild (output);
	},
};

const dedicatedWorker = new Worker ('/factors/dedicated-worker.js');
dedicatedWorker.onerror = e => {
	console.error (e);
};

let computing = false;
const input_value = document.getElementById ('input-value');
const input_form = document.getElementById ('input-form');
const button_start = document.getElementById ('button-start');
const workerMessageListener = ev => {
	if (!ev.data) {
		console.log ('Empty message from worker');
		return;
	}
	
	if ('factors' == ev.data.type) {
		computing = false;
		input_form.input.disabled = false;
		button_start.disabled = false;
		console.log ('factors:', ... ev.data.factors, 'computed in:', ev.data.duration, 'ms');
		
		input_value.textContent = ev.data.input;
		const map = new Map;
		for (let p of ev.data.factors) {
			const count = map.has (p) ? map.get (p) : 0;
			map.set (p, count + 1);
		}
		printFactors (map);
	} else if ('console' == ev.data.type) {
		console[ev.data.level] (... ev.data.values);
	} else {
		console.log ('Unknown message from worker:', ev.data);
	}
};
dedicatedWorker.addEventListener ('message', workerMessageListener);

input_form.addEventListener ('submit', ev => {
	ev.preventDefault ();
	if (computing) return;
	input_form.input.disabled = true;
	button_start.disabled = true;
	dedicatedWorker.postMessage ({type: 'pf', input: input_form.input.value.trim ()});
	computing = true;
});

