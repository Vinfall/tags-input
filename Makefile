PROJECT=tags-input
SRC=src/tags-input.js

all: check compile

compile: build/build.js

build:
	mkdir -p $@

build/build.js: demo/index.js $(SRC) | build node_modules
	node_modules/.bin/esbuild \
		--bundle \
		--define:DEBUG="true" \
		--sourcemap \
		--outfile=$@ \
		$<

node_modules: package.json
	yarn
	touch $@

clean:
	rm -fr build

distclean: clean
	rm -rf node_modules

check: test lint

lint:
	./node_modules/.bin/jshint $(SRC)

test:
	echo "No tests yet"
	# node --require should --require jsdom-global/register --test

.PHONY: check lint test check compile
