test:
	./node_modules/.bin/mocha --reporter spec --bail --check-leaks

.PHONY: test