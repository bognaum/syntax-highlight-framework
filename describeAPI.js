export  default {
	token,
	nToken,
	spToken,
	rule,
	domain,
	seq,
	alter,
	q,
	not,
	spWrap,
	error,
	deb,
};

const Analyzer_proto = {
	q : function (quanto, sepCallb=undefined) {
		if (quanto == "*/" || quanto == "+/")
			chekToAnalyzer("analyzer.q", 2, sepCallb);
		return q(this, quanto, sepCallb);
	},
	in : function (name) {
		return domain(name, this);
	},
	and : function (callb) {
		chekToAnalyzer("q", 1, callb);
		return seq(this, callb);
	},
	or : function (callb) {
		chekToAnalyzer("q", 1, callb);
		return alter(this, callb);
	},
	eTest : function (...args) {
		for (let [k, callb] of args.entries())
		chekToAnalyzer("seq", k + 1, callb);
		const _error_test_ = (pc) => {
			if(this(pc)) {
				seq(...args)(pc);
				return true;
			} else {
				return false;
			}
		}
		insertProto(Analyzer_proto, _error_test_);
		return _error_test_;
	},
	wrong : function (msg) {
		const _wrong_ = (pc) => {
			return alter(
				this,
				error(msg)
			)(pc);
		}
		insertProto(Analyzer_proto, _wrong_);
		return _wrong_;
	},
	deb : function (i0=0, i1=0) {
		return deb(this, i0, i1);
	},
};

function seq(...callbs) {
	for (let [k, callb] of callbs.entries())
		chekToAnalyzer("seq", k + 1, callb);
	function _seq_(pc) {
		const hpc = pc.createHypo();
		for (let [k, callb] of callbs.entries()) {
			const res = callb(hpc);
			if (res) 
				continue;
			else 
				return false;
		}
		pc.acceptHypo(hpc);
		return true;
	}
	insertProto(Analyzer_proto, _seq_);
	return _seq_;
}

function alter(...callbs) {
	for (let [k, callb] of callbs.entries())
		chekToAnalyzer("alter", k + 1, callb);
	function _alter_(pc) {
		let res;
		for (let [k, callb] of callbs.entries()) {
			const res = callb(pc);
			if (res)
				return true;
		}
		return false;
	}
	insertProto(Analyzer_proto, _alter_);
	return _alter_;
}

function q(callb, quanto, callb2=undefined) {
	chekToAnalyzer("q", 1, callb);
	let _q_;
	if (quanto == "*") {
		_q_ = function _q_zero_or_many_(pc) {
			while (pc.text[pc.i]) {
				let i0 = pc.i, status;
				status = callb(pc);
				if (status) {
					if (i0 != pc.i) {
						continue;
					} else {
						/**
						 * Not strict variant. Mismatches allowed throw error message in console.
						 */
						console.error(`(!)`, `i0 == pc.i`, 
							"\n\tpc.i :", pc.i, "\n\tpc.monitor :", pc.monitor); 
						pc.i ++;
						return true;

						/**
						 * Strict variant. Mismatches forbidden. Script will stoped.
						 */
						// console.error(`(!)`, `i0 == pc.i`, pc); debugger; throw new Error();
					}
				} else 
					return true;
			}
			return true;
		}
	} else if (quanto == "+") {
		_q_ = function _q_one_or_many_(pc) {
			return callb(pc) && q(callb(pc), "*");
		}
	} else if (quanto == "?") {
		_q_ = function _q_zero_or_one_(pc) {
			return callb(pc) || true;
		}
	} else if (quanto == "*/") {
		chekToAnalyzer("q", 3, callb2);
		_q_ = function _q_zero_or_many_sep_(pc) {
			seq(
				callb,
				seq(callb2, callb).q("*")
			)(pc);
			return true;
		}
	} else if (quanto == "+/") {
		chekToAnalyzer("q", 3, callb2);
		_q_ = function _q_one_or_many_sep_(pc) {
			return seq(
					callb,
					seq(callb2, callb).q("*")
				)(pc);
		}
	} else {
		console.error(`(!)`, `Invalid quantifier`, `'${quanto}'`); debugger; throw new Error();
	}

	insertProto(Analyzer_proto, _q_);
	return _q_;
}

function not(callb) {
	chekToAnalyzer("not", 1, callb);
	const _not_ = function _not_(pc) {
		const hpc = pc.createHypo();
		const res = callb(hpc);
		if (! res) {
			pc.match(pc.text[pc.i]);
			return true;
		} else 
			return false;
	}
	insertProto(Analyzer_proto, _not_);
	return _not_;
}

function domain(name, callb, msg=null) {
	const _domain_ = function _domain_(pc) {
		const
			chpc = pc.createChildHypo(name),
			status = callb(chpc)
		if (msg) 
			chpc.msg = msg;
		if (status) 
			pc.acceptChildHypo(chpc);
		return !! status;
	}
	_domain_.msg = function (text) {
		return domain(name, callb, text);
	}
	_domain_.as = function(otherName, msg=null) {
		return domain(otherName, callb);
	}
	insertProto(Analyzer_proto, _domain_);
	return _domain_;
}

function rule(callb) {
	const _rule_ = function _rule_(pc) {
		const 
			hpc    = pc.createHypo(),
			status = callb(hpc);
		if (status) 
			pc.acceptHypo(hpc);
		return !! status;
	}
	insertProto(Analyzer_proto, _rule_);
	return _rule_;
}

function token(templ) {
	const _token_ = function _token_(pc) {
		return pc.match(templ);
	}
	insertProto(Analyzer_proto, _token_);
	return _token_;
}

function nToken(templ) {
	const _notToken_ = function _notToken_(pc) {
		return pc.notMatch(templ);
	}
	insertProto(Analyzer_proto, _notToken_);
	return _notToken_;
}

function spToken(templ) {
	const _space_wrapped_token_ = function(pc) {
		return seq(token(/\s+/y).q("*"), token(templ), token(/\s+/y).q("*"),)(pc);
	}
	insertProto(Analyzer_proto, _space_wrapped_token_);
	return _space_wrapped_token_;
}

function spWrap(callb) {
	chekToAnalyzer("spWrap", 1, callb);
	const _space_wrapped_ = function(pc) {
		return seq(token(/\s+/y).q("*"), callb, token(/\s+/y).q("*"),)(pc);
	}
	insertProto(Analyzer_proto, _space_wrapped_);
	return _space_wrapped_;
}

function error(msg) {
	return domain("error", token(/\s*.*/y), msg);
}

function deb(callb, a=0, b=0) {
	chekToAnalyzer("deb", 1, callb);
	function _deb_(pc) {
		b = b || pc.text.length;
		if (a <= pc.i && pc.i <= b) {
			debugger;
			const res = callb(pc);
			console.log(`res`, res);
			debugger;
			return res;
		}
	}
	insertProto(Analyzer_proto, _deb_);
	return _deb_;
}

function insertProto(proto, ob) {
	return Object.setPrototypeOf(ob, Object.setPrototypeOf(proto, Object.getPrototypeOf(ob)));
}

function chekToAnalyzer(fName, argN, callb) {
	if (! callb || callb instanceof Analyzer_proto) {
		console.error(`Argument`, argN, `(from 1) of function '${fName}()' is not Analiser. There is: \n`, callb?.toString ? callb.toString() : callb);
		throw new Error(`Invalid callback. \n\tArgument ${argN} of function '${fName}()' is not Analiser. \n`);
	} else
		return true;
}