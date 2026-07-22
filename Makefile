edit = sed \
	-e "s|@version\@|"`cat conf-version`"|g" \
	-e "s|@release\@|"`cat conf-release`"|g" \
	-e 's|@email\@|'"`cat conf-email`"'|g' \
	-e 's}@VERSION\@}$(VERSION)}g' \
	-e 's}@prefix\@}$(prefix)}g'

ALL: audio-selector.spec audio-selector.dsc debian.changelog

clean:
	rm -f audio-selector.spec audio-selector.dsc debian.changelog

distclean:
	rm -rf audio-selector.spec audio-selector.dsc debian.changelog node_modules

audio-selector.spec: audio-selector.spec.in catChangeLog doc/ChangeLog conf-version \
conf-release conf-email
	(cat $@.in;./catChangeLog) | $(edit) > $@

audio-selector.dsc: audio-selector.dsc.in catChangeLog doc/ChangeLog conf-version \
conf-release conf-email
	$(edit) $@.in > $@

debian.changelog: doc/ChangeLog Makefile conf-version conf-release \
conf-email catChangeLog
	./catChangeLog --debian --name=audio-selector --state=unstable \
		--urgency=low doc/ChangeLog > $@
