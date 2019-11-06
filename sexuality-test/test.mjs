/* -*- tab-width: 4; indent-tabs-mode: t -*- */

const LANGUAGE_DEFAULT = 'ja';


const OPTION_NONE = Symbol ('NONE');
const OPTION_OTHER = Symbol ('OTHER');

const OPTION_FEMALE = Symbol ('FEMALE');
const OPTION_MALE = Symbol ('MALE');

const OPTION_AGENDER = Symbol ('AGENDER');
const OPTION_FEMININE_AGENDER = Symbol ('FEMININE_AGENDER');
const OPTION_MASCULINE_AGENDER = Symbol ('MASCULINE_AGENDER');

const OPTION_NEUTRAL = Symbol ('NEUTRAL');
const OPTION_FEMININE_NEUTRAL = Symbol ('FEMININE_NEUTRAL');
const OPTION_MASCULINE_NEUTRAL = Symbol ('MASCULINE_NEUTRAL');

const OPTION_FLUID = Symbol ('FLUID');
const OPTION_QUESTIONING = Symbol ('QUESTIONING');

const OPTION_ASEXUAL = Symbol ('ASEXUAL');
const OPTION_DEMISEXUAL = Symbol ('DEMISEXUAL');
const OPTION_QUOISEXUAL = Symbol ('QUOISEXUAL');
const OPTION_SEXUAL = Symbol ('SEXUAL');

const OPTION_HOMOSEXUAL = Symbol ('HOMOSEXUAL');
const OPTION_HETEROSEXUAL = Symbol ('HETEROSEXUAL');
const OPTION_AUTOSEXUAL = Symbol ('AUTOSEXUAL');
const OPTION_BISEXUAL = Symbol ('BISEXUAL');
const OPTION_PANSEXUAL = Symbol ('PANSEXUAL');

const OPTION_AROMANTIC = Symbol ('AROMANTIC');
const OPTION_DEMIROMANTIC = Symbol ('DEMIROMANTIC');
const OPTION_QUOIROMANTIC = Symbol ('QUOIROMANTIC');
const OPTION_ROMANTIC = Symbol ('ROMANTIC');

const OPTION_HOMOROMANTIC = Symbol ('HOMOROMANTIC');
const OPTION_HETEROROMANTIC = Symbol ('HETEROROMANTIC');
const OPTION_AUTOROMANTIC = Symbol ('AUTOROMANTIC');
const OPTION_BIROMANTIC = Symbol ('BIROMANTIC');
const OPTION_PANROMANTIC = Symbol ('PANROMANTIC');

const OPTION_POLYAMORY = Symbol ('POLYAMORY');
const OPTION_MONOAMORY = Symbol ('MONOAMORY');
const OPTION_NONAMORY = Symbol ('NONAMORY');

const QUESTION_SEX = Symbol ('QUESTION_SEX');
const QUESTION_GENDER_IDENTITY = Symbol ('QUESTION_GENDER_IDENTITY');
const QUESTION_GENDER_EXPRESSION = Symbol ('QUESTION_GENDER_EXPRESSION');
const QUESTION_SEXUALITY = Symbol ('QUESTION_SEXUALITY');
const QUESTION_SEXUAL_ORIENTATION = Symbol ('QUESTION_SEXUAL_ORIENTATION');
const QUESTION_ROMANTICITY = Symbol ('QUESTION_ROMANTICITY');
const QUESTION_ROMANTIC_ORIENTATION = Symbol ('QUESTION_ROMANTIC_ORIENTATION');
const QUESTION_RELATIONSHIPS = Symbol ('QUESTION_RELATIONSHIPS');


class OptionLabels {
	constructor (pOptions, pLabels) {
		this.options = pOptions;
		this.labels = pLabels;
	}
	
	get (pIdentifier) {
		if ('symbol' == typeof pIdentifier) {
			const option = pIdentifier;
			return this.labels.get (option);
		} else {
			const index = pIdentifier;
			const option = this.options[index];
			return this.labels.get (option);
		}
	}
	
	get [Symbol.iterator] () {
		return function* () {
			for (let [option, label] of this.labels) {
				yield [this.options.indexOf (option), label, option];
			}
		}.bind (this);
	}
	
	get size () {
		return this.labels.size;
	}
}

class Question {
	constructor (...options) {
		this.options = options.filter (option => 'symbol' == typeof option);
		this.questionTextByLanguage = new Map;
		this.labelsByLanguage = new Map;
		this.selected = options[0];
		this.onOptionChangeListeners = new Set;
	}
	
	addLanguage (pLanguage, pQuestion, pLabelsObj) {
		if (pLabelsObj !== Object (pLabelsObj)) {
			throw new TypeError ('Invalid labels object');
		}
		
		const labels = new Map (
			Reflect.ownKeys (pLabelsObj)
				.filter (option => this.options.includes (option))
				.map (option => this.options.indexOf (option))
//				.sort ()
				.map (index => this.options[index])
				.map (option => [option, pLabelsObj[option]])
		);
		
		const language = '' + (pLanguage || LANGUAGE_DEFAULT || '');
		const question = '' + (pQuestion || '');
		
		this.questionTextByLanguage.set (language, question);
		this.labelsByLanguage.set (language, new OptionLabels (this.options, labels));
	}
	
	getQuestionTextForLanguage (pLanguage) {
		const language = '' + (pLanguage || LANGUAGE_DEFAULT || '');
		return this.questionTextByLanguage.get (language);
	}
	
	getLabelsForLanguage (pLanguage) {
		const language = '' + (pLanguage || LANGUAGE_DEFAULT || '');
		return this.labelsByLanguage.get (language);
	}
	
	getOption (pIndex) {
		return this.options[pIndex];
	}
	
	get length () {
		return this.options.length;
	}
	
	setSelectedOption (pIdentifier) {
		if ('symbol' == typeof pIdentifier) {
			const option = pIdentifier;
			this.selected = option;
		} else {
			const index = pIdentifier;
			this.selected = this.options[index];
		}
		
		this.onOptionChangeListeners.forEach (listener => listener (this.getSelectedOptionIndex (), this, this.selected));
	}
	
	getSelectedOption () {
		return this.selected;
	}
	
	getSelectedOptionIndex () {
		return this.options.indexOf (this.selected);
	}
	
	addOnOptionChangeListener (listener) {
		if ('function' != typeof listener) {
			throw new TypeError ('Not a function');
		}
		
		this.onOptionChangeListeners.add (listener);
	}
}

class Questionnaire {
	constructor () {
		this.questions = new Map;
		this.questionToIdentidier = new WeakMap;
	}
	
	addQuestion (pIdentifier, pQuestion) {
		if ('symbol' != typeof pIdentifier) {
			throw new TypeError ('Invalid question identifier');
		}
		
		if (!(pQuestion instanceof Question)) {
			throw new TypeError ('Not a Question');
		}
		
		this.questions.set (pIdentifier, pQuestion);
		this.questionToIdentidier.set (pQuestion, pIdentifier);
	}
	
	get [Symbol.iterator] () {
		return function* () {
			let index = 0;
			for (let [identifier, question] of this.questions) {
				yield [index, question, identifier];
				index++;
			}
		}.bind (this);
	}
	
	get size () {
		return this.questions.size;
	}
	
	getQuestion (pIdentifier) {
		if ('symbol' == typeof pIdentifier) {
			return this.questions.get (pIdentifier);
		} else {
			const identifiers = [... this.questions.keys ()];
			return this.questions.get (identifiers[pIdentifier]);
		}
	}
	
	getQuestionIdentifier (pQuestion) {
		return this.questionToIdentidier.get (pQuestion);
	}
	
	getQuestionIndex (pQuestionIdentifier) {
		return [... this.questions.keys ()].indexOf (pQuestionIdentifier);
	}
	
	set (pQuestionIdentifier, pOptionIdentifier) {
		console.log ('set:', pQuestionIdentifier, pOptionIdentifier);
		this.getQuestion (pQuestionIdentifier).setSelectedOption (pOptionIdentifier);
	}
	
	get (pQuestionIdentifier) {
		return this.getQuestion (pQuestionIdentifier).getSelectedOption ();
	}
}

const form = document.getElementById ('form');
const result = document.getElementById ('result');
const shareText = document.getElementById ('share-text');
const test = new Questionnaire ();
const languages = new Set;

const getFormValue = pQuestionIndex => Math.trunc (form['q' + pQuestionIndex].value);
const setFormValue = (pQuestionIndex, pOptionIndex) =>
	void (form['q' + pQuestionIndex].value = pOptionIndex);

const globalListener = function (pOptionIndex, pQuestion, pOption) {
	const questionIdentifier = test.getQuestionIdentifier (pQuestion);
	const questionIndex = test.getQuestionIndex (questionIdentifier);
	switch (questionIdentifier) {
		case QUESTION_SEXUALITY: {
			if (
				pOption == OPTION_ASEXUAL
					&& test.get (QUESTION_SEXUAL_ORIENTATION) != OPTION_ASEXUAL
			) {
				test.set (QUESTION_SEXUAL_ORIENTATION, OPTION_ASEXUAL);
			} else if (
				pOption != OPTION_ASEXUAL
					&& test.get (QUESTION_SEXUAL_ORIENTATION) == OPTION_ASEXUAL
			) {
				test.set (QUESTION_SEXUAL_ORIENTATION, OPTION_NONE);
			}
			break;
		}
		
		case QUESTION_SEXUAL_ORIENTATION: {
			if (
				pOption == OPTION_ASEXUAL
					&& test.get (QUESTION_SEXUALITY) != OPTION_ASEXUAL
			) {
				test.set (QUESTION_SEXUALITY, OPTION_ASEXUAL);
			} else if (
				pOption != OPTION_ASEXUAL
					&& test.get (QUESTION_SEXUALITY) == OPTION_ASEXUAL
			) {
				test.set (QUESTION_SEXUALITY, OPTION_NONE);
			}
			break;
		}
		
		case QUESTION_ROMANTICITY: {
			if (
				pOption == OPTION_AROMANTIC
					&& test.get (QUESTION_ROMANTIC_ORIENTATION) != OPTION_AROMANTIC
			) {
				test.set (QUESTION_ROMANTIC_ORIENTATION, OPTION_AROMANTIC);
			} else if (
				pOption != OPTION_AROMANTIC
					&& test.get (QUESTION_ROMANTIC_ORIENTATION) == OPTION_AROMANTIC
			) {
				test.set (QUESTION_ROMANTIC_ORIENTATION, OPTION_NONE);
			}
			break;
		}
		
		case QUESTION_ROMANTIC_ORIENTATION: {
			if (
				pOption == OPTION_AROMANTIC
					&& test.get (QUESTION_ROMANTICITY) != OPTION_AROMANTIC
			) {
				test.set (QUESTION_ROMANTICITY, OPTION_AROMANTIC);
			} else if (
				pOption != OPTION_AROMANTIC
					&& test.get (QUESTION_ROMANTICITY) == OPTION_AROMANTIC
			) {
				test.set (QUESTION_ROMANTICITY, OPTION_NONE);
			}
			break;
		}
	}
	
	const results = [];
	switch (test.get (QUESTION_SEX)) {
		case OPTION_NONE: {
			switch (test.get (QUESTION_GENDER_IDENTITY)) {
				case OPTION_AGENDER: {
					results.push ('無性');
					break;
				}
				
				case OPTION_FEMININE_AGENDER: {
					results.push ('無性よりの女性');
					break;
				}
				
				case OPTION_FEMALE: {
					results.push ('女性');
					break;
				}
				
				case OPTION_FEMININE_NEUTRAL: {
					results.push ('中性よりの女性');
					break;
				}
				
				case OPTION_NEUTRAL: {
					results.push ('中性');
					break;
				}
				
				case OPTION_MASCULINE_NEUTRAL: {
					results.push ('中性よりの男性');
					break;
				}
				
				case OPTION_MALE: {
					results.push ('男性');
					break;
				}
				
				case OPTION_MASCULINE_AGENDER: {
					results.push ('無性よりの男性');
					break;
				}
				
				case OPTION_FLUID: {
					results.push ('Gender fluid');
					break;
				}
				
				case OPTION_QUESTIONING: {
					results.push ('Gender questioning');
					break;
				}
				
				case OPTION_OTHER: {
					results.push ('Gender nonbinary');
					break;
				}
			}
			break;
		}
		
		case OPTION_FEMALE: {
			switch (test.get (QUESTION_GENDER_IDENTITY)) {
				case OPTION_AGENDER: {
					results.push ('FtX, 無性');
					break;
				}
				
				case OPTION_FEMININE_AGENDER: {
					results.push ('FtX, 無性よりの女性');
					break;
				}
				
				case OPTION_FEMALE: {
					results.push ('シス女性');
					break;
				}
				
				case OPTION_FEMININE_NEUTRAL: {
					results.push ('FtX, 中性よりの女性');
					break;
				}
				
				case OPTION_NEUTRAL: {
					results.push ('FtX, 中性');
					break;
				}
				
				case OPTION_MASCULINE_NEUTRAL: {
					results.push ('FtM, 中性よりの男性');
					break;
				}
				
				case OPTION_MALE: {
					results.push ('FtM, トランス男性');
					break;
				}
				
				case OPTION_MASCULINE_AGENDER: {
					results.push ('FtM, 無性よりの男性');
					break;
				}
				
				case OPTION_FLUID: {
					results.push ('Gender fluid');
					break;
				}
				
				case OPTION_QUESTIONING: {
					results.push ('Gender questioning');
					break;
				}
				
				case OPTION_OTHER: {
					results.push ('FtX, Gender nonbinary');
					break;
				}
			}
			break;
		}
		
		case OPTION_MALE: {
			switch (test.get (QUESTION_GENDER_IDENTITY)) {
				case OPTION_AGENDER: {
					results.push ('MtX, 無性');
					break;
				}
				
				case OPTION_FEMININE_AGENDER: {
					results.push ('MtF, 無性よりの女性');
					break;
				}
				
				case OPTION_FEMALE: {
					results.push ('MtF, トランス女性');
					break;
				}
				
				case OPTION_FEMININE_NEUTRAL: {
					results.push ('MtF, 中性よりの女性');
					break;
				}
				
				case OPTION_NEUTRAL: {
					results.push ('MtX, 中性');
					break;
				}
				
				case OPTION_MASCULINE_NEUTRAL: {
					results.push ('MtX, 中性よりの男性');
					break;
				}
				
				case OPTION_MALE: {
					results.push ('シス男性');
					break;
				}
				
				case OPTION_MASCULINE_AGENDER: {
					results.push ('MtX, 無性よりの男性');
					break;
				}
				
				case OPTION_FLUID: {
					results.push ('Gender fluid');
					break;
				}
				
				case OPTION_QUESTIONING: {
					results.push ('Gender questioning');
					break;
				}
				
				case OPTION_OTHER: {
					results.push ('MtX, Gender nonbinary');
					break;
				}
			}
			break;
		}
	}
	
	if (test.get (QUESTION_GENDER_IDENTITY) != test.get (QUESTION_GENDER_EXPRESSION)) {
		switch (test.get (QUESTION_GENDER_EXPRESSION)) {
			case OPTION_AGENDER: {
				results.push ('無性装者');
				break;
			}
			
			case OPTION_FEMININE_AGENDER: {
				results.push ('無性よりの女性装者');
				break;
			}
			
			case OPTION_FEMALE: {
				if (
					test.get (QUESTION_GENDER_IDENTITY) != OPTION_FEMININE_AGENDER
					&& test.get (QUESTION_GENDER_IDENTITY) != OPTION_FEMININE_NEUTRAL
				) {
					results.push ('女性装者');
				}
				break;
			}
			
			case OPTION_FEMININE_NEUTRAL: {
				results.push ('中性よりの女性装者');
				break;
			}
			
			case OPTION_NEUTRAL: {
				results.push ('中性装者');
				break;
			}
			
			case OPTION_MASCULINE_NEUTRAL: {
				results.push ('中性よりの男性装者');
				break;
			}
			
			case OPTION_MALE: {
				if (
					test.get (QUESTION_GENDER_IDENTITY) != OPTION_MASCULINE_AGENDER
					&& test.get (QUESTION_GENDER_IDENTITY) != OPTION_MASCULINE_NEUTRAL
				) {
					results.push ('男性装者');
				}
				break;
			}
			
			case OPTION_MASCULINE_AGENDER: {
				results.push ('無性よりの男性装者');
				break;
			}
			
			case OPTION_FLUID: {
				results.push ('Gender expression fluid');
				break;
			}
			
			case OPTION_QUESTIONING: {
				results.push ('Gender expression questioning');
				break;
			}
			
			case OPTION_OTHER: {
				results.push ('Gender expression nonbinary');
				break;
			}
		}
	}
	
	if (
		[OPTION_FEMALE, OPTION_FEMININE_AGENDER, OPTION_FEMININE_NEUTRAL]
		.includes (test.get (QUESTION_GENDER_IDENTITY))
		&&
		[OPTION_MALE, OPTION_MASCULINE_AGENDER, OPTION_MASCULINE_NEUTRAL]
		.includes (test.get (QUESTION_GENDER_EXPRESSION))
		||
		[OPTION_FEMALE, OPTION_FEMININE_AGENDER, OPTION_FEMININE_NEUTRAL]
		.includes (test.get (QUESTION_GENDER_EXPRESSION))
		&&
		[OPTION_MALE, OPTION_MASCULINE_AGENDER, OPTION_MASCULINE_NEUTRAL]
		.includes (test.get (QUESTION_GENDER_IDENTITY))
	) {
		results.push ('クロスドレッサー（異性装者）');
	}
	
	switch (test.get (QUESTION_SEXUALITY)) {
		case OPTION_ASEXUAL: {
			results.push ('アセクシャル（エイセクシャル）');
			break;
		}
		
		case OPTION_DEMISEXUAL: {
			results.push ('デミセクシャル');
			break;
		}
		
		case OPTION_QUOISEXUAL: {
			results.push ('クヮセクシャル');
			break;
		}
		
		case OPTION_SEXUAL: {
			results.push ('（アロ）セクシャル, 性愛者');
			break;
		}
		
		case OPTION_FLUID: {
			results.push ('Sexuality fluid');
			break;
		}
		
		case OPTION_QUESTIONING: {
			results.push ('Sexuality questioning');
			break;
		}
		
		case OPTION_OTHER: {
			results.push ('その他のセクシャリティ');
			break;
		}
	}
	
	switch (test.get (QUESTION_SEXUAL_ORIENTATION)) {
		case OPTION_HOMOSEXUAL: {
			results.push ('同性（性）愛者');
			if (
				[OPTION_FEMALE, OPTION_FEMININE_AGENDER, OPTION_FEMININE_NEUTRAL]
				.includes (test.get (QUESTION_GENDER_IDENTITY))
			) {
				results.push ('（性的指向がレズビアン）');
			} else if (
				[OPTION_MALE, OPTION_MASCULINE_AGENDER, OPTION_MASCULINE_NEUTRAL]
				.includes (test.get (QUESTION_GENDER_IDENTITY))
			) {
				results.push ('（性的指向がゲイ）');
			}
			break;
		}
		
		case OPTION_HETEROSEXUAL: {
			results.push ('異性（性）愛者（ヘテロセクシャル）');
			break;
		}
		
		case OPTION_AUTOSEXUAL: {
			results.push ('自己（性）愛者（オートセクシャル）');
			break;
		}
		
		case OPTION_BISEXUAL: {
			results.push ('バイセクシャル');
			break;
		}
		
		case OPTION_PANSEXUAL: {
			results.push ('パンセクシャル');
			break;
		}
		
		case OPTION_FLUID: {
			results.push ('Sexual orientation fluid');
			break;
		}
		
		case OPTION_QUESTIONING: {
			results.push ('Sexual orientation questioning');
			break;
		}
		
		case OPTION_OTHER: {
			results.push ('その他の性的指向');
			break;
		}
	}
	
	switch (test.get (QUESTION_ROMANTICITY)) {
		case OPTION_AROMANTIC: {
			results.push ('アロマンティック（エイロマンティック）');
			break;
		}
		
		case OPTION_DEMIROMANTIC: {
			results.push ('デミロマンティック');
			break;
		}
		
		case OPTION_QUOIROMANTIC: {
			results.push ('クヮロマンティック');
			break;
		}
		
		case OPTION_ROMANTIC: {
			results.push ('（アロ）ロマンティック, 恋愛者');
			break;
		}
		
		case OPTION_FLUID: {
			results.push ('Romanticity fluid');
			break;
		}
		
		case OPTION_QUESTIONING: {
			results.push ('Romanticity questioning');
			break;
		}
		
		case OPTION_OTHER: {
			results.push ('その他の恋愛性（ロマンティシティ）');
			break;
		}
	}
	
	switch (test.get (QUESTION_ROMANTIC_ORIENTATION)) {
		case OPTION_HOMOROMANTIC: {
			results.push ('同性恋愛者');
			if (
				[OPTION_FEMALE, OPTION_FEMININE_AGENDER, OPTION_FEMININE_NEUTRAL]
				.includes (test.get (QUESTION_GENDER_IDENTITY))
			) {
				results.push ('（恋愛指向がレズビアン）');
			} else if (
				[OPTION_MALE, OPTION_MASCULINE_AGENDER, OPTION_MASCULINE_NEUTRAL]
				.includes (test.get (QUESTION_GENDER_IDENTITY))
			) {
				results.push ('（恋愛指向がゲイ）');
			}
			break;
		}
		
		case OPTION_HETEROROMANTIC: {
			results.push ('異性恋愛者（ヘテロロマンティック）');
			break;
		}
		
		case OPTION_AUTOROMANTIC: {
			results.push ('自己恋愛者（オートロマンティック）');
			break;
		}
		
		case OPTION_BIROMANTIC: {
			results.push ('バイロマンティック');
			break;
		}
		
		case OPTION_PANROMANTIC: {
			results.push ('パンロマンティック');
			break;
		}
		
		case OPTION_FLUID: {
			results.push ('Romantic orientation fluid');
			break;
		}
		
		case OPTION_QUESTIONING: {
			results.push ('Romantic orientation questioning');
			break;
		}
		
		case OPTION_OTHER: {
			results.push ('その他の恋愛指向');
			break;
		}
	}
	
	switch (test.get (QUESTION_RELATIONSHIPS)) {
		case OPTION_NONAMORY: {
			results.push ('ノナモリー');
			break;
		}
		
		case OPTION_POLYAMORY: {
			results.push ('ポリアモリー');
			break;
		}
		
		case OPTION_MONOAMORY: {
			results.push ('モノアモリー');
			break;
		}
		
		case OPTION_FLUID: {
			results.push ('Relationships fluid');
			break;
		}
		
		case OPTION_QUESTIONING: {
			results.push ('Relationships questioning');
			break;
		}
		
		case OPTION_OTHER: {
			results.push ('その他の関係性');
			break;
		}
	}
	
	const resultText = results.join (', ');
	result.textContent = resultText;
	shareText.value = '私は\n' + resultText + '\nと診断されました';
	
	if (getFormValue (questionIndex) != pOptionIndex) {
		setFormValue (questionIndex, pOptionIndex);
	}
};

test.addQuestion (QUESTION_SEX, new Question (
	OPTION_NONE,
	OPTION_FEMALE,
	OPTION_MALE
));
test.getQuestion (QUESTION_SEX).addLanguage ('ja', 'あなたの生まれつきの身体の性別は？', {
	[OPTION_NONE]: "答えない",
	[OPTION_FEMALE]: "女性",
	[OPTION_MALE]: "男性",
});
test.getQuestion (QUESTION_SEX).addOnOptionChangeListener (globalListener);

test.addQuestion (QUESTION_GENDER_IDENTITY, new Question (
	OPTION_NONE,
	OPTION_AGENDER,
	OPTION_FEMININE_AGENDER,
	OPTION_FEMALE,
	OPTION_FEMININE_NEUTRAL,
	OPTION_NEUTRAL,
	OPTION_MASCULINE_NEUTRAL,
	OPTION_MALE,
	OPTION_MASCULINE_AGENDER,
	OPTION_FLUID,
	OPTION_QUESTIONING,
	OPTION_OTHER
));
test.getQuestion (QUESTION_GENDER_IDENTITY).addLanguage ('ja', 'あなたが自認する性別は？', {
	[OPTION_NONE]: "答えない・ない",
	[OPTION_AGENDER]: "無性",
	[OPTION_FEMININE_AGENDER]: "無性よりの女性",
	[OPTION_FEMALE]: "女性",
	[OPTION_FEMININE_NEUTRAL]: "中性よりの女性",
	[OPTION_NEUTRAL]: "中性",
	[OPTION_MASCULINE_NEUTRAL]: "中性よりの男性",
	[OPTION_MALE]: "男性",
	[OPTION_MASCULINE_AGENDER]: "無性よりの男性",
	[OPTION_FLUID]: "変化する",
	[OPTION_QUESTIONING]: "わからない・悩み中",
	[OPTION_OTHER]: "その他",
});
test.getQuestion (QUESTION_GENDER_IDENTITY).addOnOptionChangeListener (globalListener);

test.addQuestion (QUESTION_GENDER_EXPRESSION, new Question (
	OPTION_NONE,
	OPTION_AGENDER,
	OPTION_FEMININE_AGENDER,
	OPTION_FEMALE,
	OPTION_FEMININE_NEUTRAL,
	OPTION_NEUTRAL,
	OPTION_MASCULINE_NEUTRAL,
	OPTION_MALE,
	OPTION_MASCULINE_AGENDER,
	OPTION_FLUID,
	OPTION_QUESTIONING,
	OPTION_OTHER
));
test.getQuestion (QUESTION_GENDER_EXPRESSION).addLanguage ('ja', 'あなたはどんな見た目を希望しますか？', {
	[OPTION_NONE]: "答えない・ない",
	[OPTION_AGENDER]: "無性",
	[OPTION_FEMININE_AGENDER]: "無性よりの女性",
	[OPTION_FEMALE]: "女性",
	[OPTION_FEMININE_NEUTRAL]: "中性よりの女性",
	[OPTION_NEUTRAL]: "中性",
	[OPTION_MASCULINE_NEUTRAL]: "中性よりの男性",
	[OPTION_MALE]: "男性",
	[OPTION_MASCULINE_AGENDER]: "無性よりの男性",
	[OPTION_FLUID]: "変化する",
	[OPTION_QUESTIONING]: "わからない・悩み中",
	[OPTION_OTHER]: "その他",
});
test.getQuestion (QUESTION_GENDER_EXPRESSION).addOnOptionChangeListener (globalListener);

test.addQuestion (QUESTION_SEXUALITY, new Question (
	OPTION_NONE,
	OPTION_ASEXUAL,
	OPTION_DEMISEXUAL,
	OPTION_QUOISEXUAL,
	OPTION_SEXUAL,
	OPTION_FLUID,
	OPTION_QUESTIONING,
	OPTION_OTHER
));
test.getQuestion (QUESTION_SEXUALITY).addLanguage ('ja', 'あなたはどのような性的感情を持つことがありますか？', {
	[OPTION_NONE]: "答えない",
	[OPTION_ASEXUAL]: "もたない",
	[OPTION_DEMISEXUAL]: "強い絆がある親しい人にだけ感じる",
	[OPTION_QUOISEXUAL]: "友情や恋愛感情など他の感情と区別がつかない",
	[OPTION_SEXUAL]: "自分のタイプなら一般に感じる",
	[OPTION_FLUID]: "変化する",
	[OPTION_QUESTIONING]: "わからない・悩み中",
	[OPTION_OTHER]: "その他",
});
test.getQuestion (QUESTION_SEXUALITY).addOnOptionChangeListener (globalListener);

test.addQuestion (QUESTION_SEXUAL_ORIENTATION, new Question (
	OPTION_NONE,
	OPTION_ASEXUAL,
	OPTION_HOMOSEXUAL,
	OPTION_HETEROSEXUAL,
	OPTION_AUTOSEXUAL,
	OPTION_BISEXUAL,
	OPTION_PANSEXUAL,
	OPTION_FLUID,
	OPTION_QUESTIONING,
	OPTION_OTHER
));
test.getQuestion (QUESTION_SEXUAL_ORIENTATION).addLanguage ('ja', 'あなたは誰に対して性的感情を持つことがありますか？', {
	[OPTION_NONE]: "答えない",
	[OPTION_ASEXUAL]: "もたない",
	[OPTION_HOMOSEXUAL]: "同性",
	[OPTION_HETEROSEXUAL]: "異性・他の性",
	[OPTION_AUTOSEXUAL]: "自分自身",
	[OPTION_BISEXUAL]: "女性のことも男性のこともある",
	[OPTION_PANSEXUAL]: "自分のタイプなら性別はとわない",
	[OPTION_FLUID]: "変化する",
	[OPTION_QUESTIONING]: "わからない・悩み中",
	[OPTION_OTHER]: "その他",
});
test.getQuestion (QUESTION_SEXUAL_ORIENTATION).addOnOptionChangeListener (globalListener);

test.addQuestion (QUESTION_ROMANTICITY, new Question (
	OPTION_NONE,
	OPTION_AROMANTIC,
	OPTION_DEMIROMANTIC,
	OPTION_QUOIROMANTIC,
	OPTION_ROMANTIC,
	OPTION_FLUID,
	OPTION_QUESTIONING,
	OPTION_OTHER
));
test.getQuestion (QUESTION_ROMANTICITY).addLanguage ('ja', 'あなたはどのような恋愛感情を持つことがありますか？', {
	[OPTION_NONE]: "答えない",
	[OPTION_AROMANTIC]: "もたない",
	[OPTION_DEMIROMANTIC]: "強い絆がある親しい人にだけ感じる",
	[OPTION_QUOIROMANTIC]: "友情や性的感情など他の感情と区別がつかない",
	[OPTION_ROMANTIC]: "自分のタイプなら一般に感じる",
	[OPTION_FLUID]: "変化する",
	[OPTION_QUESTIONING]: "わからない・悩み中",
	[OPTION_OTHER]: "その他",
});
test.getQuestion (QUESTION_ROMANTICITY).addOnOptionChangeListener (globalListener);

test.addQuestion (QUESTION_ROMANTIC_ORIENTATION, new Question (
	OPTION_NONE,
	OPTION_AROMANTIC,
	OPTION_HOMOROMANTIC,
	OPTION_HETEROROMANTIC,
	OPTION_AUTOROMANTIC,
	OPTION_BIROMANTIC,
	OPTION_PANROMANTIC,
	OPTION_FLUID,
	OPTION_QUESTIONING,
	OPTION_OTHER
));
test.getQuestion (QUESTION_ROMANTIC_ORIENTATION).addLanguage ('ja', 'あなたは誰に対して恋愛感情を持つことがありますか？', {
	[OPTION_NONE]: "答えない",
	[OPTION_AROMANTIC]: "もたない",
	[OPTION_HOMOROMANTIC]: "同性",
	[OPTION_HETEROROMANTIC]: "異性・他の性",
	[OPTION_AUTOROMANTIC]: "自分自身",
	[OPTION_BIROMANTIC]: "女性のことも男性のこともある",
	[OPTION_PANROMANTIC]: "自分のタイプなら性別はとわない",
	[OPTION_FLUID]: "変化する",
	[OPTION_QUESTIONING]: "わからない・悩み中",
	[OPTION_OTHER]: "その他",
});
test.getQuestion (QUESTION_ROMANTIC_ORIENTATION).addOnOptionChangeListener (globalListener);

test.addQuestion (QUESTION_RELATIONSHIPS, new Question (
	OPTION_NONE,
	OPTION_NONAMORY,
	OPTION_POLYAMORY,
	OPTION_MONOAMORY,
	OPTION_FLUID,
	OPTION_QUESTIONING,
	OPTION_OTHER
));
test.getQuestion (QUESTION_RELATIONSHIPS).addLanguage ('ja', 'あなたはどういう関係を望みますか？', {
	[OPTION_NONE]: "答えない",
	[OPTION_NONAMORY]: "恋愛関係をもたない",
	[OPTION_POLYAMORY]: "同意の上で複数の関係をもってもいい",
	[OPTION_MONOAMORY]: "恋愛関係は単一でなければならない",
	[OPTION_FLUID]: "変化する",
	[OPTION_QUESTIONING]: "わからない・悩み中",
	[OPTION_OTHER]: "その他",
});
test.getQuestion (QUESTION_RELATIONSHIPS).addOnOptionChangeListener (globalListener);

languages.add ('ja');

const uaLanguage = navigator.language.split ('-')[0].toLowerCase ();
const language = languages.has (uaLanguage) ? uaLanguage : LANGUAGE_DEFAULT;
for (let [questionIndex, question, questionIdentifier] of test) {
	const section = form.appendChild (document.createElement ('section'));
	const heading = section.appendChild (document.createElement ('h2'));
	heading.textContent = question.getQuestionTextForLanguage (language);
	for (
		let [optionIndex, labelText, optionIdentifier]
			of question.getLabelsForLanguage (language)
	) {
		const p = section.appendChild (document.createElement ('p'));
		const label = p.appendChild (document.createElement ('label'));
		const input = label.appendChild (document.createElement ('input'));
		input.type = 'radio';
		input.name = 'q' + questionIndex;
		input.value = optionIndex;
		if (optionIdentifier === OPTION_NONE) {
			input.checked = true;
		}
		label.appendChild (document.createTextNode (' ' + labelText));
	}
}

form.addEventListener ('change', ev => {
	const input = ev.target;
	const questionIndex = Math.trunc (input.name.substr (1));
	const optionIndex = Math.trunc (input.value);
	test.set (questionIndex, optionIndex);
});

