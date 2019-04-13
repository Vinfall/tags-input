PROJECT=tags-input
SRC=src/tags-input.js
NODE_BIN=./node_modules/.bin

all: check compile

check: lint

lint: | node_modules
	$(NODE_BIN)/jshint $(SRC)

compile: build/build.js

build/build.js: $(SRC) | node_modules
	mkdir -p $(@D)
	$(NODE_BIN)/browserify --require ./$(SRC):$(PROJECT) --outfile $@

.DELETE_ON_ERROR: build/build.js

node_modules: package.json
	npm install && touch $@

clean:
	rm -fr build

distclean: clean
	rm -fr node_modules

.PHONY: clean lint compile all
