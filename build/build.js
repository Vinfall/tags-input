require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

module.exports = function (str) {
	if (typeof str !== 'string') {
		throw new TypeError('Expected a string');
	}

	return str.replace(matchOperatorsRe, '\\$&');
};

},{}],"tags-input":[function(require,module,exports){
var escapeStringRegexp = require('escape-string-regexp');

module.exports = tagsInput;

var BACKSPACE = 8,
	TAB = 9,
	ENTER = 13,
	LEFT = 37,
	RIGHT = 39,
	DELETE = 46;

var COPY_PROPS = ['autocomplete', 'disabled', 'readonly', 'type'];
var MOVE_PROPS = ['accept', 'accesskey', 'autocapitalize', 'autofocus', 'dir', 'inputmode', 'lang', 'list', 'max',
	'maxlength', 'min', 'minlength', 'pattern', 'placeholder', 'size', 'spellcheck', 'step', 'tabindex', 'title'];

function checkerForSeparator(separator) {
	function simple(separator) {
		return {
			split: function (s) { return s.split(separator); },
			join: function (arr) { return arr.join(separator); },
			test: function (char) { return char === separator; }
		};
	}

	function multi(separators) {
		var regex = separators
			.split('')
			.map(escapeStringRegexp)
			.join('|');

		regex = new RegExp(regex);

		return {
			split: function (s) { return s.split(regex); },
			join: function (arr) { return arr.join(separators[0]); },
			test: function (char) { return regex.test(char); }
		};
	}

	return separator.length > 1 ? multi(separator) : simple(separator);
}

function createElement(type, name, text, attributes) {
	var el = document.createElement(type);
	if (name) { el.className = name; }
	if (text) { el.textContent = text; }
	for (var key in attributes) {
		el.setAttribute(("data-" + key), attributes[key]);
	}
	return el;
}

function insertAfter(child, el) {
	return child.nextSibling ?
		child.parentNode.insertBefore(el, child.nextSibling) :
		child.parentNode.appendChild(el);
}

function caretAtStart(el) {
	try {
		return el.selectionStart === 0 && el.selectionEnd === 0;
	}
	catch(e) {
		return el.value === '';
	}
}

function charFromKeyboardEvent(e) {
	if ('key' in e) {
		// most modern browsers
		return e.key;
	}
	if ('keyIdentifier' in e) {
		// Safari < 10
		return String.fromCharCode(parseInt(event.keyIdentifier.slice(2), 16));
	}
	// other old/non-conforming browsers
	return e.char;
}

var eachNode = 'forEach' in NodeList.prototype ?
	function (nodeList, fn) { return nodeList.forEach(fn); } :
	function (nodeList, fn) { for(var i = 0; i < nodeList.length; i++) { fn(nodeList[i]); } };

function tagsInput(input) {

	function $(selector) {
		return base.querySelector(selector);
	}

	function $$(selector) {
		return base.querySelectorAll(selector);
	}

	function getValue() {
		var value = [];
		if (base.input.value) { value.push(base.input.value); }
		eachNode($$('.tag'), function (t) { return value.push(t.textContent); });
		return checker.join(value);
	}

	function setValue(value) {
		eachNode($$('.tag'), function (t) { return base.removeChild(t); });
		savePartialInput(value, true);
	}

	function save(init) {
		input.value = getValue();
		if (init) {
		    return;
		}
		input.dispatchEvent(new Event('change'));
	}

	function checkAllowDuplicates() {
		var allow =
			input.getAttribute('data-allow-duplicates') ||
			input.getAttribute('duplicates');
		return allow === 'on' || allow === '1' || allow === 'true';
	}

	// Return false if no need to add a tag
	function addTag(text) {
	    var added = false;
		function addOneTag(text) {
			var tag = text && text.trim();
			// Ignore if text is empty
			if (!tag) { return; }

			// Check input validity (eg, for pattern=)
			// At tags-input init fill the base.input
			base.input.value = text;
			if (!base.input.checkValidity()) {
				base.classList.add('error');
				setTimeout( function () { return base.classList.remove('error'); } , 150);
				return;
			}

			// For duplicates, briefly highlight the existing tag
			if (!allowDuplicates) {
				var exisingTag = $(("[data-tag=\"" + tag + "\"]"));
				if (exisingTag) {
					exisingTag.classList.add('dupe');
					setTimeout( function () { return exisingTag.classList.remove('dupe'); } , 100);
					return;
				}
			}

			base.insertBefore(
				createElement('span', 'tag', tag, { tag: tag }),
				base.input
			);
			added = true;
		}

		// Add multiple tags if the user pastes in data with SEPERATOR already in it
		checker.split(text).forEach(addOneTag);
		return added;
	}

	function select(el) {
		var sel = $('.selected');
		if (sel) { sel.classList.remove('selected'); }
		if (el) { el.classList.add('selected'); }
	}

	function savePartialInput(value, init) {
		if (typeof value!=='string' && !Array.isArray(value)) {
			// If the base input does not contain a value, default to the original element passed
			value = base.input.value;
		}
		if (addTag(value)!==false) {
			base.input.value = '';
			save(init);
		}
	}

	function refocus(e) {
		base.input.focus();
		if (e.target.classList.contains('tag')) { select(e.target); }
		if (e.target===base.input) { return select(); }
		e.preventDefault();
		return false;
	}

	var base = createElement('div', 'tags-input'),
		checker = checkerForSeparator(input.getAttribute('data-separator') || ','),
		allowDuplicates = checkAllowDuplicates();

	insertAfter(input, base);
	base.appendChild(input);
	input.classList.add('visuallyhidden');

	var inputType = input.getAttribute('type');
	if (!inputType || inputType === 'tags') {
		input.setAttribute('type', 'text');
	}
	base.input = createElement('input');
	COPY_PROPS.forEach(function (prop) {
		if (input.hasAttribute(prop)) {
			base.input.setAttribute(prop, input.getAttribute(prop));
		}
	});
	MOVE_PROPS.forEach(function (prop) {
		if (input.hasAttribute(prop)) {
			base.input.setAttribute(prop, input.getAttribute(prop));
			input.removeAttribute(prop);
		}
	});
	base.appendChild(base.input);

	input.setAttribute('type', 'text');
	input.tabIndex = -1;

	input.addEventListener('focus', function () {
		base.input.focus();
	});

	base.input.addEventListener('focus', function () {
		base.classList.add('focus');
		select();
	});

	base.input.addEventListener('blur', function () {
		base.classList.remove('focus');
		select();
		savePartialInput();
	});

	base.input.addEventListener('keydown', function (e) {
		var el = base.input,
			key = e.keyCode || e.which,
			separator = checker.test(charFromKeyboardEvent(e)),
			selectedTag = $('.tag.selected'),
			lastTag = $('.tag:last-of-type');

		if (key===ENTER || key===TAB || separator) {
			if (!el.value && !separator) { return; }
			savePartialInput();
		}
		else if (key===DELETE && selectedTag) {
			if (selectedTag!==lastTag) { select(selectedTag.nextSibling); }
			base.removeChild(selectedTag);
			save();
		}
		else if (key===BACKSPACE) {
			if (selectedTag) {
				select(selectedTag.previousSibling);
				base.removeChild(selectedTag);
				save();
			}
			else if (lastTag && caretAtStart(el)) {
				select(lastTag);
			}
			else {
				return;
			}
		}
		else if (key===LEFT) {
			if (selectedTag) {
				if (selectedTag.previousSibling) {
					select(selectedTag.previousSibling);
				}
			}
			else if (!caretAtStart(el)) {
				return;
			}
			else {
				select(lastTag);
			}
		}
		else if (key===RIGHT) {
			if (!selectedTag) { return; }
			select(selectedTag.nextSibling);
		}
		else {
			return select();
		}

		e.preventDefault();
		return false;
	});

	// Proxy "input" (live change) events , update the first tag live as the user types
	// This means that users who only want one thing don't have to enter commas
	base.input.addEventListener('input', function () {
		input.value = getValue();
		input.dispatchEvent(new Event('input'));
	});

	// One tick after pasting, parse pasted text as CSV:
	base.input.addEventListener('paste', function () { return setTimeout(savePartialInput, 0); });

	if (window.PointerEvent) {
		base.addEventListener('pointerdown', refocus);
	} else {
		base.addEventListener('mousedown', refocus);
		base.addEventListener('touchstart', refocus);
	}

	base.setValue = setValue;
	base.getValue = getValue;

	// Add tags for existing values
	savePartialInput(input.value, true);

	return { setValue: setValue, getValue: getValue };
}

// make life easier:
tagsInput.enhance = tagsInput.tagsInput = tagsInput;

},{"escape-string-regexp":1}]},{},[]);
