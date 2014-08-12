/*
Copyright (c) 2014 Amin Ullah Khan
*/

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $ */

define(function (require, exports, module) {
	"use strict";

	// enums of tokens
	var _tTAG	= 1,
		_tATTR	= 2,
		_tVALUE	= 3;

	function getXMLTagInfo(editor, initialPos, currentPos) {
		var context = {
			tokenType: 0,
			tagName: '',
			attrName: '',
			query: '',
			exclusionList: []
		};
		currentPos = currentPos || initialPos;
		var textBefore, textAfter, buffer, offset = [], inAttr, initialCur, finalCur;
		initialCur = {
			line: initialPos.line,
			ch: 0
		},
		finalCur = {
			line: currentPos.line,
			ch: editor._codeMirror.lineInfo(currentPos.line).text.length
		};

		textBefore	= editor.document.getRange(initialCur, currentPos).replace(/\s+/g, ' ').trimLeft();
		textAfter	= editor.document.getRange(currentPos, finalCur).replace(/\s+/g, ' ').trim();
		offset[0]	= textBefore.lastIndexOf('<');
		offset[1]	= textBefore.lastIndexOf(' ');

		// Return Tags.
		if (offset[0] >= 0 && (offset[1] < offset[0] || offset[1] === -1)) {
			context.tokenType = _tTAG;
			if (offset[1] === -1) {
				offset[1] = textBefore.length;
			}
			context.query = textBefore.substr(offset[0] + 1, offset[1]).trim();
			if (/^[a-z][a-z0-9-]*$/i.test(context.query) || context.query.length === 0)
				return context;
			return false;
		}

		// find opening-tag.
		while (offset[0] === -1 && initialCur.line !== -1) {
			initialCur.line--;
			textBefore = editor.document.getRange(initialCur, currentPos).replace(/\s+/g, ' ').trimLeft();
			offset[0] = textBefore.lastIndexOf("<");
		}
		if (offset[0] === -1 || !/^[a-z]$/i.test(textBefore.substr(offset[0]+1, 1))) return false;

		// first space after the tag.
		offset[1] = textBefore.indexOf(' ', offset[0]);

		// find closing-tag.
		offset[2] = -1;
		while (offset[2] === -1 && finalCur.line <= editor.lineCount() - 1) {
			finalCur.ch = editor._codeMirror.lineInfo(finalCur.line).text.length;
			textAfter = editor.document.getRange(currentPos, finalCur).replace(/\s+/g, ' ').trim();
			if (textAfter.indexOf('/>') !== -1 && textAfter.indexOf('/>') > textAfter.indexOf('<')) {
				offset[2] = textAfter.indexOf('/>');
				break;
			}
			if (textAfter.indexOf('>') !== -1 && textAfter.indexOf('>') < textAfter.indexOf('<')) {
				offset[2] = textAfter.indexOf('>');
				break;
			}
			if (textAfter.indexOf('<') !== -1 && textBefore.substr(offset[0]).lastIndexOf('>') === -1 && textAfter.indexOf('>') > textAfter.indexOf('<')) {
				offset[2] = textAfter.indexOf('<');
				break;
			}
			finalCur.line++;
		}
		if (textBefore.substr(offset[0], 1) === '<' && textAfter.length === 0) {
			offset[2] = 0;
		}

		offset[3] = textBefore.lastIndexOf(' ');
		offset[4] = textBefore.lastIndexOf('="');
		offset[5] = textBefore.lastIndexOf('"');

		if (offset[2] === -1 && !(offset[4] !== -1 && offset[5] !== -1 && offset[4] > offset[3]))
			return false;

		// Return attributes.
		if (offset[1] === offset[3] && offset[3] > offset[4] || offset[5]-offset[4] !== 1) {
			context.tokenType = _tATTR;
			buffer = [textBefore.substr(offset[0]), textAfter.substr(0, offset[2] + 1)].join(' ');
			buffer.split(' ').slice(1).forEach(function (arg) {
				if (!arg || arg.length === 1) return;
				context.exclusionList.push(arg.split('=')[0]);
			});
			context.tagName = textBefore.substr(offset[0]+1, offset[1]).trim().split(' ')[0];
			context.query = textBefore.substr(offset[3]).trim();
			if (context.query === context.exclusionList.slice(-1)[0]) {
				context.exclusionList.pop();
			}
			if (/^[a-z][a-z0-9-]*$/i.test(context.query) || context.query.length === 0) {
				return context;
			}
			return false;
		}

		if (offset[3] > offset[4]) {
			offset[3] = textBefore.lastIndexOf(' ', offset[4]);
		}
		offset[6] = textAfter.indexOf('"');

		// Return attribute-values hints.
		if (offset[3] !== -1 && offset[4] > offset[3]) {
			context.tokenType = _tVALUE;
			buffer = [textBefore.substr(offset[4]+2), textAfter.substr(0, offset[6])].join(' ');
			buffer.split(' ').forEach(function(arg) {
				context.exclusionList.push(arg);
			});
			context.tagName = textBefore.substr(offset[0]+1, offset[1]).trim().split(' ')[0];
			context.attrName = textBefore.substr(offset[3]).slice(1, -2).split('=')[0];
			context.query = textBefore.substr(offset[4]+2).split(' ').reverse()[0];
			if (context.query === context.exclusionList.slice(-1)[0]) {
				context.exclusionList.pop();
			}
			return context;
		}
		return false;
	}

	// Public API
	exports.getXMLTagInfo	= getXMLTagInfo;
	exports._tTAG			= _tTAG;
	exports._tATTR			= _tATTR;
	exports._tVALUE			= _tVALUE;
});