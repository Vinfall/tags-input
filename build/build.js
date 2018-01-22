(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // node_modules/escape-string-regexp/index.js
  var require_escape_string_regexp = __commonJS({
    "node_modules/escape-string-regexp/index.js"(exports, module) {
      "use strict";
      var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
      module.exports = function(str) {
        if (typeof str !== "string") {
          throw new TypeError("Expected a string");
        }
        return str.replace(matchOperatorsRe, "\\$&");
      };
    }
  });

  // src/tags-input.js
  var require_tags_input = __commonJS({
    "src/tags-input.js"(exports, module) {
      var escapeStringRegexp = require_escape_string_regexp();
      module.exports = tagsInput2;
      var BACKSPACE = 8;
      var TAB = 9;
      var ENTER = 13;
      var ESC = 27;
      var LEFT = 37;
      var RIGHT = 39;
      var DELETE = 46;
      var COPY_PROPS = ["autocomplete", "disabled", "readonly", "type", "list"];
      var MOVE_PROPS = [
        "accept",
        "accesskey",
        "autocapitalize",
        "autofocus",
        "dir",
        "inputmode",
        "lang",
        "max",
        "maxlength",
        "min",
        "minlength",
        "pattern",
        "placeholder",
        "size",
        "spellcheck",
        "step",
        "tabindex",
        "title"
      ];
      function checkerForSeparator(separator) {
        function simple(separator2) {
          return {
            split: (s) => s.split(separator2),
            join: (arr) => arr.join(separator2),
            test: (char) => char === separator2
          };
        }
        function multi(separators) {
          let regex = separators.split("").map(escapeStringRegexp).join("|");
          regex = new RegExp(regex);
          return {
            split: (s) => s.split(regex),
            join: (arr) => arr.join(separators[0]),
            test: (char) => regex.test(char)
          };
        }
        return separator.length > 1 ? multi(separator) : simple(separator);
      }
      function createElement(type, name, text, attributes) {
        let el = document.createElement(type);
        if (name)
          el.className = name;
        if (text)
          el.textContent = text;
        for (let key in attributes) {
          el.setAttribute(`data-${key}`, attributes[key]);
        }
        return el;
      }
      function insertAfter({ nextSibling, parentNode }, el) {
        return nextSibling ? parentNode.insertBefore(el, nextSibling) : parentNode.appendChild(el);
      }
      function caretAtStart({ selectionStart, selectionEnd, value }) {
        try {
          return selectionStart === 0 && selectionEnd === 0;
        } catch {
          return value === "";
        }
      }
      function tagsInput2(input) {
        const base = createElement("div", "tags-input");
        const checker = checkerForSeparator(input.getAttribute("data-separator") || ",");
        const allowDuplicates = checkAllowDuplicates();
        insertAfter(input, base);
        input.classList.add("visuallyhidden");
        let inputType = input.getAttribute("type");
        if (!inputType || inputType === "tags") {
          input.setAttribute("type", "text");
        }
        base.input = createElement("input");
        COPY_PROPS.forEach((prop) => {
          if (input.hasAttribute(prop)) {
            base.input.setAttribute(prop, input.getAttribute(prop));
          }
        });
        MOVE_PROPS.forEach((prop) => {
          if (input.hasAttribute(prop)) {
            base.input.setAttribute(prop, input.getAttribute(prop));
            input.removeAttribute(prop);
          }
        });
        base.appendChild(base.input);
        const datalistShadow = makeDatalistShadow();
        input.setAttribute("type", "text");
        input.tabIndex = -1;
        input.addEventListener("focus", () => {
          base.input.focus();
        });
        base.input.addEventListener("focus", () => {
          base.classList.add("focus");
          select();
        });
        base.input.addEventListener("blur", () => {
          base.classList.remove("focus");
          select();
          savePartialInput();
          dispatchEvent("complete");
        });
        base.input.addEventListener("keydown", (e) => {
          let el = base.input;
          let key = e.keyCode || e.which;
          let separator = checker.test(e.key);
          let selectedTag = $(".tag.selected");
          let lastTag = $(".tag:last-of-type");
          if (key === ESC) {
            base.input.value = "";
            base.input.blur();
            return;
          } else if (key === ENTER || key === TAB || separator) {
            if (!el.value && !separator) {
              if (key === ENTER)
                base.input.blur();
              return;
            }
            savePartialInput();
          } else if (key === DELETE && selectedTag) {
            if (selectedTag !== lastTag)
              select(selectedTag.nextSibling);
            base.removeChild(selectedTag);
            save();
          } else if (key === BACKSPACE) {
            if (selectedTag) {
              select(selectedTag.previousSibling);
              base.removeChild(selectedTag);
              save();
            } else if (lastTag && caretAtStart(el)) {
              select(lastTag);
            } else {
              return;
            }
          } else if (key === LEFT) {
            if (selectedTag) {
              if (selectedTag.previousSibling) {
                select(selectedTag.previousSibling);
              }
            } else if (!caretAtStart(el)) {
              return;
            } else {
              select(lastTag);
            }
          } else if (key === RIGHT) {
            if (!selectedTag)
              return;
            select(selectedTag.nextSibling);
          } else {
            return select();
          }
          e.preventDefault();
          return false;
        });
        base.input.addEventListener("input", () => {
          input.value = getValue();
          input.dispatchEvent(new Event("input"));
        });
        base.input.addEventListener("change", () => setTimeout(savePartialInput, 0));
        base.input.addEventListener("paste", () => setTimeout(savePartialInput, 0));
        if (window.PointerEvent) {
          base.addEventListener("pointerdown", refocus);
        } else {
          base.addEventListener("mousedown", refocus);
          base.addEventListener("touchstart", refocus);
        }
        base.setValue = setValue;
        base.getValue = getValue;
        savePartialInput(input.value, true);
        datalistShadow?.update(getValues());
        let self = { setValue, getValue };
        Object.defineProperty(self, "disabled", {
          get: () => base.input.disabled,
          set(v) {
            if (v) {
              base.setAttribute("disabled", "");
            } else {
              base.removeAttribute("disabled");
            }
            base.input.disabled = v;
          }
        });
        return self;
        function $(selector) {
          return base.querySelector(selector);
        }
        function $$(selector) {
          return base.querySelectorAll(selector);
        }
        function getValue(vv = getValues()) {
          return checker.join(vv);
        }
        function getValues() {
          let values = [];
          $$(".tag").forEach(({ textContent }) => values.push(textContent));
          if (base.input.value)
            values.unshift(base.input.value);
          return values;
        }
        function setValue(value) {
          $$(".tag").forEach((t) => base.removeChild(t));
          savePartialInput(value, true);
        }
        function save(init) {
          const values = getValues();
          input.value = getValue(values);
          datalistShadow?.update(values);
          if (init) {
            return;
          }
          input.dispatchEvent(new Event("change"));
        }
        function checkAllowDuplicates() {
          const allow = input.getAttribute("data-allow-duplicates") || input.getAttribute("duplicates");
          return allow === "on" || allow === "1" || allow === "true";
        }
        function addTag(text) {
          let added = false;
          function addOneTag(text2) {
            let tag = text2 && text2.trim();
            if (!tag)
              return;
            base.input.value = text2;
            if (!base.input.checkValidity()) {
              base.classList.add("error");
              setTimeout(() => base.classList.remove("error"), 150);
              return;
            }
            if (!allowDuplicates) {
              let exisingTag = $(`[data-tag="${tag}"]`);
              if (exisingTag) {
                exisingTag.classList.add("dupe");
                setTimeout(() => exisingTag.classList.remove("dupe"), 100);
                return;
              }
            }
            base.insertBefore(
              createElement("span", "tag", tag, { tag }),
              base.input
            );
            added = true;
          }
          checker.split(text).forEach(addOneTag);
          return added;
        }
        function select(el) {
          let sel = $(".selected");
          if (sel)
            sel.classList.remove("selected");
          if (el)
            el.classList.add("selected");
        }
        function savePartialInput(value, init) {
          if (typeof value !== "string" && !Array.isArray(value)) {
            value = base.input.value;
          }
          if (addTag(value) !== false) {
            base.input.value = "";
            save(init);
          }
        }
        function refocus(e) {
          base.input.focus();
          if (e.target.classList.contains("tag"))
            select(e.target);
          if (e.target === base.input)
            return select();
          e.preventDefault();
          return false;
        }
        function dispatchEvent(name) {
          const ce = new CustomEvent(`tags-input-${name}`, { bubbles: true });
          input.dispatchEvent(ce);
        }
        function makeDatalistShadow() {
          if (!input.list || allowDuplicates)
            return;
          const origList = document.getElementById(input.getAttribute("list"));
          const datalist = origList.cloneNode();
          datalist.id = `${origList.id}-tags-input`;
          base.input.setAttribute("list", datalist.id);
          insertAfter(origList, datalist);
          return {
            update
          };
          function update(values) {
            datalist.innerHTML = "";
            Array.from(origList.childNodes).filter((option) => !values.includes(option.value)).forEach((option) => datalist.appendChild(option.cloneNode(true)));
          }
        }
      }
      tagsInput2.enhance = tagsInput2.tagsInput = tagsInput2;
    }
  });

  // demo/index.js
  var tagsInput = require_tags_input();
  var tis = [];
  for (const input of document.querySelectorAll("form input")) {
    const ti = tagsInput(input);
    input.addEventListener("change", onchange);
    tis.push(ti);
  }
  document.querySelector('input[type="checkbox"]').addEventListener("change", (ev) => {
    const enabled = ev.target.checked;
    tis.forEach((ti) => ti.disabled = !enabled);
  });
  document.querySelector(".forms").addEventListener("tags-input-complete", oncomplete);
  function onchange({ target }) {
    const span = target.parentElement.querySelector(".value");
    span.textContent = target.value;
  }
  function oncomplete(ev) {
    console.log("complete", ev.details, ev.target.value);
  }
})();
//# sourceMappingURL=build.js.map
