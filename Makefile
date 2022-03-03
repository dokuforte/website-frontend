dist:
	npm run build


serve:
	npm run dev


clean:
	rm -R _compiled-assets
	rm -R _dist


distclean: clean
	rm -R node_modules


all: dist
