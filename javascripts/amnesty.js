(function (global) {
	var defaultLang= "en";
	var supportedLanguages = ['en', 'es', 'fr', 'zh_Hans', 'zh_Hant', 'zh_TW'];
	var lang = getLangFromQueryString();
	var dir;
	setLangAndDir(lang);
	var dictionary;

	function Dictionary(dictionaryJson) {
		this.dictionary = dictionaryJson;
	}

	Dictionary.prototype.getTranslation = function (key, language) {
		var translation = '';

		if (language == undefined) {
			language = lang;
		}

		if ( this.dictionary.hasOwnProperty(key) && this.dictionary[key].hasOwnProperty(language) ) {
			translation = this.dictionary[key][language];
		}

		else {
			translation = key;
		}

		return translation;
	};

	function getLangFromQueryString(){
		// Mostly shamelessly cribbed from here: http://stackoverflow.com/a/901144/20578
		var lang = defaultLang;
		var regex = new RegExp("[?&]" + "lang" + "(=([^&#]*)|&|#|$)");
		var results = regex.exec(window.location.href);

		if (results && results[2]) {
			lang = decodeURIComponent(results[2].replace(/\+/g, " "));
		}

		return lang;
	}

	function setLangAndDir(lang) {
		var htmlEl = document.getElementsByTagName("html")[0];

		if (supportedLanguages.indexOf(lang) > -1) {
			htmlEl.lang = lang;
		}

		if (lang === "ar") {
			htmlEl.dir = "rtl";
			dir = "rtl";
		}
		else {
			dir = "ltr";
		}
	}

	function translateHTML() {
		var el,
				translateTextEls = document.querySelectorAll('[data-translate]'),
				translateTitleEls = document.querySelectorAll('[data-translate-title]'),
				i;

		for (i=0; i<translateTextEls.length; i++) {
			el = translateTextEls[i];
			el.innerHTML = dictionary.getTranslation( el.getAttribute('data-translate') );
		}

		for (i=0; i<translateTitleEls.length; i++) {
			el = translateTitleEls[i];
			el.title = dictionary.getTranslation( el.getAttribute('data-translate-title') );
		}
	}

	function removeLoadingScreen() {
		var loadingScreenEl = document.getElementById('loading');

		if (!loadingScreenEl) {
			return;
		}

		if(typeof loadingScreenEl.style['transition'] !== 'undefined') {
			loadingScreenEl && loadingScreenEl.addEventListener('transitionend', function () {
				loadingScreenEl.parentNode.removeChild(loadingScreenEl);
			});

			loadingScreenEl.style.opacity = '0';
		}

		else {
			loadingScreenEl.parentNode.removeChild(loadingScreenEl);
		}
	}

	//Loads in the world data, the active countries, and the translation dictionary
	// queue()
	// 		.defer(d3.json, "data/world-topo-1-3.json?cachebust="+(+new Date()))
	// 		.defer(d3.json, "data/data.json?cachebust="+(+new Date()))
	// 		.defer(d3.json, "lang/dictionary.json?cachebust="+(+new Date()))
	// 		.await(ready);

	function ready(error, world, active, dict) {
		dictionary = new Dictionary(dict);
		translateHTML();

		if ('parentIFrame' in window) {
				parentIFrame.size();
		}
		removeLoadingScreen();
	}

	var throttleTimer;
	function throttle() {
		window.clearTimeout(throttleTimer);
			throttleTimer = window.setTimeout(function() {
				if ('parentIFrame' in window) {
						parentIFrame.size();
				}
			}, 200);
	}

})(window);
