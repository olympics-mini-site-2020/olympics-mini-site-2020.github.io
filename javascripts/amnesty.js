$(function () {
(function(global, doc) {
	TweenLite.defaultEase = Power2.easeOut;
	function roundUp(n, rnd) {
		if(!rnd) rnd = 1000;
		var dec;
		return (dec = n - (n |= 0))? ((dec * rnd + (dec < 0 ? -0.5 : 0.5)) | 0) / rnd + n : n;
	}
	String.prototype.capitalize = function() {
		return this.charAt(0).toUpperCase() + this.slice(1);
	};
	var DEBUG = true;
	var PLAYED = false;
	var STEP_HAIKU = 0;
	var STARTED_HAIKU = false;
	var globeContainer = doc.getElementById('globe');
	var fullSize = 840, ballSize = 575;
	var APP_DATA = {
		selectedKeywords: new Array(),
		result: ''
	};
	var API_DATA = {
		keywords: [],
		lines: {},
		color: {},

		ytViews: [],
		tracks: [],
		counts: [],
		news: []
	};
	function setupGlobe(option) {
		var dragX = 220,
			origin = {
				x: -35,
				y: -30,
				z: -25
			},
			easeTime = 0;
		var timer, doRotation = true, doEase = false;



		var front = d3.geoOrthographic()
			.translate([ballSize / 2, ballSize / 2])
			.scale(ballSize / 2)
			.clipAngle(90)
			.rotate([origin.x, origin.y, origin.z]);
		var frontPath = d3.geoPath().projection(front);
		var globe = d3.select(globeContainer);
		var svg = globe.append('svg').attrs({
			id: 'globeSvg',
			viewBox: '0 0 ' + fullSize + ' ' + fullSize
		});



		var ballPos = fullSize / 2 - ballSize / 2;
		var ball = svg.append('g').attrs({
			width: ballSize,
			height: ballSize,
			class: 'ball',
			transform: 'translate(' + ballPos + ', ' + ballPos + ')'
		}).datum({
			x: 0,
			y: 0
		});



		var graticule = d3.geoGraticule().step([30, 30]);
		ball.append('circle').attrs({
			cx: ballSize / 2,
			cy: ballSize / 2,
			r: ballSize / 2,
			fill: '#f2f2f2'
		});
		ball.append('path').datum(graticule).attr('class', 'graticule');
		ball.append('path').datum({ type: 'Sphere' }).attr('class', 'outline');



		// Create the svg:defs element and the main gradient definition.
		var svgDefs = svg.append('svg:defs').call(function(defs) {
			// Appending the gradient
			defs.append('svg:radialGradient')
				.attr('id', 'radialGradient')
				.call(function (gradient) {
					gradient.append('svg:stop')
						.attr('offset', '0%')
						.attr('stop-color', 'white')
						.attr('stop-opacity', '.5');
					gradient.append('svg:stop')
						.attr('offset', '40%')
						.attr('stop-color', 'white')
						.attr('stop-opacity', '0');
				});
			// Appending the mask
			defs.append('svg:mask')
				.attr('id', 'gradientMask')
				.attr('width', ballSize)
				.attr('height', ballSize)
				.attr('x', 0)
				.attr('y', 0)
				.call(function(mask) {
					mask.append('svg:circle')
						.attr('cx', ballSize / 2)
						.attr('cy', ballSize / 2)
						.attr('r', ballSize)
						.attr('fill', 'url(#radialGradient)')
				});
		});



		var globePath = ball.selectAll('path');
		var updatePaths = function() {
			ball.selectAll('path').attr('d', frontPath);
			// ball.selectAll('path.graticule').attr('d', frontPath);
			// ball.selectAll('path.outline').attr('d', frontPath);
			// ball.selectAll('path.dot').attr('d', frontPath);
		};



		if(option != 'static') {
			ball.call(d3.drag()
				.subject(function() {
					var rotate = front.rotate();
					return {
						x: 8 * rotate[0],
						y: -10 * rotate[1]
					};
				}).on('drag', function(d) {
					front.rotate([d3.event.x / 8, Math.max(-30, Math.min(30, -d3.event.y / 10)), origin.z]);
					updatePaths();
				}).on('start', function() {
					easeTime = 1;
					doRotation = false;
					clearTimeout(timer);
				}).on('end', function() {
					doEase = true;
				}));
			// ball.timer = d3.timer(function() {
			// 	var o0 = front.rotate();
			// 	if(!doRotation) {
			// 		if(doEase) {
			// 			var v = d3.easeQuadOut(easeTime);
			// 			var t = v * .1;
			// 			easeTime = easeTime - .01;
			// 			o0[0] += t;
			// 			if(t < .05) {
			// 				doEase = false;
			// 				doRotation = true;
			// 			}
			// 		} else {
			// 			return;
			// 		}
			// 	} else {
			// 		o0[0] += .05;
			// 	}
			// 	front.rotate(o0);
			// 	updatePaths();
			// });
		}
		front.rotate([origin.x, origin.y, origin.z]);
		updatePaths();



		load_haiku(globe, svg);
		load_point(ball, frontPath);
	}
	function load_point(ball, frontPath) {
		var genDot = function() {
			var dots = ball.append('g').attr({
				'class': 'dots'
			});
			var geoCircle = d3.geoCircle().radius(2).precision(28);
			var xNum = 50;
			var yNum = 15;
			var circles = new Array();
			// var rs = d3.scaleLinear()
			// 	.domain([0, 50])
			// 	.range([2, 1]);
			var xs = d3.scaleLinear()
				.domain([0, xNum])
				.range([-180, 180]);
			var ys = d3.scaleLinear()
				.domain([0, yNum])
				.range([0, 90]);
			for(var j = 0; j < xNum; j++) {
				for(var k = 0; k < yNum - 1; k++) {
					var xs = d3.scaleLinear()
						.domain([0, xNum - k * 3])
						.range([-180, 180]);
					var d = [xs(j), ys(k)];
					geoCircle.center(d)/*.radius(rs(k))*/;
					var circle = geoCircle();
					if(Math.random() > .7) {
						circle._hide = true;
					}
					circles.push(circle);
				}
			}
			for(var m = xNum; m > 0; m--) {
				for(var n = yNum - 2; n > 0; n--) {
					var xs = d3.scaleLinear()
						.domain([0, xNum - n * 3])
						.range([-180, 180]);
					var d = [xs(m), ys(n) * -1];
					geoCircle.center(d)/*.radius(rs(k))*/;
					var circle = geoCircle();
					if(Math.random() > .7) {
						circle._hide = true;
					}
					circles.push(circle);
				}
			}
			dots.selectAll('path')
				.data(circles)
				.enter()
				.append('path')
				.attr('class', function(d) { return d._hide? 'dot hide' : 'dot'; })
				.attr('d', frontPath);
		};
		genDot();
	}
	function genLine(keyword, syllable) {
		if(!API_DATA.lines[keyword] 
			|| !API_DATA.lines[keyword]['syllable' + syllable]
			|| API_DATA.lines[keyword]['syllable' + syllable].length < 1) return false;
		var len = API_DATA.lines[keyword]['syllable' + syllable].length;
		var num = Math.floor(Math.random() * len);
		return API_DATA.lines[keyword]['syllable' + syllable][num];
	}
	function genHaiku() {
		if(!APP_DATA.selectedKeywords || APP_DATA.selectedKeywords.filter(selectedKeywordsCheck).length < 3) return;
		var rndKeywordId = APP_DATA.selectedKeywords.sort(function(a, b) { return .5 - Math.random() });
		var rndKeywords = new Array();
		rndKeywordId.forEach(function(v) {
			rndKeywords.push(API_DATA.keywords[v]);
		});
		var result = new Array(
			genLine(rndKeywords[0], 5),
			genLine(rndKeywords[1], 7),
			genLine(rndKeywords[2], 5)
		);
		for(var i = 0; i < result.length; i++) {
			if(result[i] === false) {
				return genHaiku();
			}
		}
		return result;
	}
	function selectedKeywordsCheck(val) {
		return val !== false;
	}
	function setupHaiku(data) {
		var svg = d3.select('#front').append('svg')
			.attr('id', 'frontSvg')
			.attr('viewBox', '0 0 ' + fullSize + ' ' + fullSize);
		for(var i = 0; i < data.length; i++) {
			var lines = data[i].content.split("\n");
			var syllable5 = new Array();
			var syllable7 = new Array();
			for(var j = 0; j < lines.length; j++) {
				lines[j] = lines[j].trim();
				var find5 = lines[j].indexOf('(5)');
				var find7 = lines[j].indexOf('(7)');
				if(find5 > -1) {
					syllable5.push(lines[j].slice(0, find5).trim().capitalize());
					continue;
				}
				if(find7 > -1) {
					syllable7.push(lines[j].slice(0, find7).trim().capitalize());
				}
			}
			API_DATA.lines[data[i].keyword] = {
				syllable5: syllable5,
				syllable7: syllable7
			};
			API_DATA.color[data[i].keyword] = data[i].color;
			API_DATA.color[i] = data[i].color;
			API_DATA.keywords.push(data[i].keyword);
		}
		var keywords = svg.append('g')
			.attr('class', 'keywords disable')
			.attr('transform', 'translate(' + fullSize / 2 + ', ' + fullSize / 2 + ')');

		var r = d3.scaleLinear()
			.domain([0, API_DATA.keywords.length])
			.range([0, 360]);
		var y = d3.scaleLinear()
			.domain([0, 100])
			.range([ballSize / 4, 0]);
		var line = d3.line()
			.x(0)
			.y(function(d) { return y(d) - 122; });

		// var selectedKeywords = new Array();
		var addSelectedKeywords = function(word, j) {
			var selected = d3.select('.selecteds')
				.append('div')
				.attr('class', 'selected')
				.style('--color', API_DATA.color[word])
				.attr('key', j);
			selected.append('div')
				.attr('class', 'close')
				.on('click', function(d) {
					let key = APP_DATA.selectedKeywords.indexOf(j);
					// APP_DATA.selectedKeywords.splice(key, 1);
					APP_DATA.selectedKeywords[key] = false;
					selected.remove();
					$('#front .keyword[key="' + j + '"]').removeClass('on');
					// keyword.nodes()[j].classList.remove('on');
					updatedKeywords();
				});
			selected.append('div')
				.attr('class', 'head text')
				.text(word);
			// d3.select('.selecteds')
			// 	.append('div')
			// 	.attr('class', 'selected')
			// 	.style('--color', API_DATA.color[word])
			// 	.html('<div class="close"></div><div class="head text">' + word + '</div>');
		};
		var updatedKeywords = function() {
			var count = APP_DATA.selectedKeywords.filter(selectedKeywordsCheck).length;
			TweenLite.to('#front .select-word .tips', 1, { autoAlpha: count > 0? 0 : 1 });
			TweenLite.to('#front .selecteds', 1, { autoAlpha: count > 0? 1 : 0 });
			// doc.querySelector('#front .selecteds').classList.toggle('disabled', count < 3);
			doc.querySelector('#front .select-word .btn.next').classList.toggle('disabled', count < 3);
			keywords.classed('disable', count >= 3);

			if(typeof APP_DATA.selectedKeywords[0] !== 'undefined' && APP_DATA.selectedKeywords[0] !== false)
				TweenLite.to('#front .knot .st1', .4, { fill: API_DATA.color[APP_DATA.selectedKeywords[0]] });
			else TweenLite.to('#front .knot .st1', .4, { fill: '#f2f2f2' });
			if(typeof APP_DATA.selectedKeywords[1] !== 'undefined' && APP_DATA.selectedKeywords[1] !== false)
				TweenLite.to('#front .knot .st2', .4, { fill: API_DATA.color[APP_DATA.selectedKeywords[1]] });
			else TweenLite.to('#front .knot .st2', .4, { fill: '#f2f2f2' });
			if(typeof APP_DATA.selectedKeywords[2] !== 'undefined' && APP_DATA.selectedKeywords[2] !== false)
				TweenLite.to('#front .knot .st3', .4, { fill: API_DATA.color[APP_DATA.selectedKeywords[2]] });
			else TweenLite.to('#front .knot .st3', .4, { fill: '#f2f2f2' });
		};
		var keyword = keywords.selectAll('.keyword')
			.data(API_DATA.keywords)
			.enter()
			.append('g')
			.attr('transform', function(d, i) { return 'rotate(' + (r(i) + 90) + ') translate(' + y(-120) + ', 0)'; })
			.attr('class', 'keyword')
			.attr('key', function(d, i) { return i; })
			.attr('data-color', function(d, i) { return API_DATA.color[d]; })
			.on('click', function(d, i) {
				// $('#front .keywords').trigger('keyword', [this, d, i]);
				if(STARTED_HAIKU) {
					if(APP_DATA.selectedKeywords.filter(selectedKeywordsCheck).length >= 3) return;
					var key = APP_DATA.selectedKeywords.indexOf(i);
					if(key > -1) {
						this.classList.remove('on');
						APP_DATA.selectedKeywords[key] = false;
						$('#front .selected[key="' + i + '"]').remove();
						return;
					}
					this.classList.add('on');
					if(typeof APP_DATA.selectedKeywords[0] !== 'undefined' && APP_DATA.selectedKeywords[0] === false)
						APP_DATA.selectedKeywords[0] = i;
					else if(typeof APP_DATA.selectedKeywords[1] !== 'undefined' && APP_DATA.selectedKeywords[1] === false)
						APP_DATA.selectedKeywords[1] = i;
					else if(typeof APP_DATA.selectedKeywords[2] !== 'undefined' && APP_DATA.selectedKeywords[2] === false)
						APP_DATA.selectedKeywords[2] = i;
					else APP_DATA.selectedKeywords.push(i);

					addSelectedKeywords(d, i);
					updatedKeywords();
					if(APP_DATA.selectedKeywords.length >= 3) {
						APP_DATA.result = genHaiku();
					}
				}
			});
		var keywordIn = keyword.append('g')
			.attr('class', 'in');
		keywordIn.append('path')
			.attr('d', function(d) { return line([0, 8]); })
			.attr('transform', function(d, i) { return 'rotate(90)'; })
			.attr('stroke', '#525252')
			.attr('stroke-width', .25)
			.attr('stroke-linecap', 'round');
		keywordIn.append('rect')
			.attr('y', -28)
			.attr('x', -20)
			.attr('width', 100)
			.attr('height', 60)
			.attr('fill', 'transparent');
		keywordIn.append('g')
			.attr('class', 'text')
			.append('text')
			.attr('dy', '0.31em')
			.attr('text-anchor', function(d, i) {
				var deg = r(i);
				return deg >= 0 && deg <= 180? 'end' : 'start';
			})
			.attr('transform', function(d, i) {
				var deg = r(i);
				return deg >= 0 && deg <= 180? 'rotate(180)' : null;
			})
			// .attr('class', 'head')
			.text(function(d) { return d; });
	}
	function loadHaiku(callback) {
		var HAIKU_TSV = 'https://docs.google.com/spreadsheets/d/1894xuZpKGFfCgiDSXLNyqAvo9YxKt0Zb2-xLMXjj6bQ/gviz/tq?tqx=out:csv&sheet={Sheet1}';
		// var globe = d3.select(globeContainer);
		d3.csv(HAIKU_TSV, function(data) {
			if(callback && data)
				callback(data);
		});
	}
	var CURRENT_REGION = 0;
	var REGIONS = [
		{
			id : 0,
			area : 'ALL',
		},
		{
			id : 1,
			area : 'JAPAN'
		},
		{
			id : 2,
			area : 'ASIA'
		},
		{
			id : 3,
			area : 'USA / CANADA / LATIN AMERICA'
		},
		{
			id : 4,
			area : 'EUROPE'
		}
	];
	var TRACK_GROUP = [
		[1, 2],
		[3, 4, 6],
		[5]
	];
	var aID = null;
	var getYTData = function (complete) {
		var data = {"view_counts":[1062367,1452877,2142577,2777963,1103959,279326,14668844]};
		// if(complete) complete(); return;
		// if(aID) aID.abort();
		// aID = $.ajax({
		// 	url: API_BASE + 'api/youtube',
		// 	dataType: 'json',
		// 	type:'GET',
		// 	success : function (data) {
				aID = null;
				//console.log(data)
				var total = 0;
				for(var i = 0; i < data.view_counts.length; i++){
					total += data.view_counts[i];
				}
				API_DATA.ytViews[0] = total;
				API_DATA.ytViews[1] = data.view_counts[0] + data.view_counts[1];
				if(data.view_counts.length >= 7) {
					API_DATA.ytViews[1] += data.view_counts[6];
				}
				API_DATA.ytViews[2] = data.view_counts[2] + data.view_counts[3] + data.view_counts[4];
				API_DATA.ytViews[3] = data.view_counts[5];
				if(complete) complete();
		// 	},
		// 	error : function () {

		// 	}
		// })
	};
	var USE_DUMMY_DATA = true;
	var map = new WorldMap();
	var SPOTIFY_TSV = 'SPOTIFY_TSV.tsv';
	var API_SONG_IDS = [1, 2, 3, 4, 6, 5];
	var API_SONG_CURRENT = 0;
	var getTrackData = function (complete) {
		// if(complete) complete(); return;
		if(aID) aID.abort();
		//var region = "";

		var _url = 'javascripts/vendor/music.json';
		_url = 'https://face-my-fears.jp/api/music/' + API_SONG_IDS[API_SONG_CURRENT];
		aID = $.ajax({
			url: _url,
			type:'GET',
			dataType: 'json',
			success : function (data) {
				aID = null;
				//if(data.jp) { 
				API_DATA.tracks[API_SONG_IDS[API_SONG_CURRENT]] = data;
				//}
				//console.log(data)
				API_SONG_CURRENT++;
				if(API_SONG_IDS.length == API_SONG_CURRENT) {
					if(complete) complete();
				} else {
					getTrackData(complete);
				}
			},
			error : function () {

			}
		})
	};
	var createCounts = function () {
		var total_data = {
			streams : 0,
			rank : null
		}
		var getRank = function (a, b) {
			if(a == null && b == null) {
				return {
					rank : null,
					text : '-'
				}
			} else if(a == null && b != null) {
				return b;
			} else if(a != null && b == null) {
				return a;
			} else {
				if(a.rank == null && b.rank == null) {
					return {
						rank : null,
						text : '-'
					}
				} else if(a.rank == null) {
					return b;
				} else if(b.rank == null) {
					return a;
				}
				return (a.rank < b.rank) ? a : b;
			}
		}

		var getCount = function (a, b) {
			if(b != null) {
				return a.spotify_stream_count + b.spotify_stream_count;
			}
			return a.spotify_stream_count;
		}

		var _trackID = 1;
		var N = 0;
		var all_data = {
			streams : 0,
			rank : null,
			text : '',
			code : ''
		}

		API_DATA.counts[0] = [];
		for(var i = 0; i < API_SONG_IDS.length; i++) {
			var trackID = _trackID;//TRACK_GROUP[_trackID-1][N];
			var data1 = API_DATA.tracks[API_SONG_IDS[i]];
			//var data2 = null;
			//var data2 = (API_SONG_IDS[i+1]) ? API_DATA.tracks[API_SONG_IDS[i+1]] : null;
			
			//console.log(data1)
			if(!API_DATA.counts[trackID]) {
				API_DATA.counts[trackID] = [];
			}
			for (var j = 1; j < REGIONS.length; j++) {
				if(!data1.jp) break;
				
				//console.log(REGIONS[j].area)
				var codes = map.getCodes(REGIONS[j].area);
				//console.log(REGIONS[j].area, codes)
				//console.log(codes)
				for(var t = 0; t < codes.length; t++) {
					var code = codes[t];
					if(USE_DUMMY_DATA) {
						var ar1 = {
							rank : Math.floor(1 + Math.random() * 100),
							text : 'Apple Music / TOP 100',
							code : code
						};
						var ar2 = {
							rank : Math.floor(1 + Math.random() * 100),
							text : 'Apple Music / ' + ((code == 'jp') ? 'J-POP' : 'World'),
							code : code
						};
						var ar3 = {
							rank : Math.floor(1 + Math.random() * 100),
							text : 'Apple Music / Electro',
							code : code
						};
						var ar4 = {
							rank : Math.floor(1 + Math.random() * 100),
							text : 'Apple Music / Dance',
							code : code
						};

						var sr1 = {
							rank : Math.floor(1 + Math.random() * 100),
							text : 'Spotify / TOP 200',
							code : code
						};
						var sr2 = {
							rank : Math.floor(1 + Math.random() * 50),
							text : 'Spotify / VIRAL 50',
							code : code
						};

						var ar = getRank(ar1, ar2);
						ar = getRank(ar, ar3);
						ar = getRank(ar, ar4);

						var sr = getRank(sr1, sr2);
						var r = getRank(ar1, sr1);
						r = getRank(sr2, r);
						r = getRank(ar3, r);
						r = getRank(ar4, r);
						r = getRank(ar2, r);
					} else {
						
								var ar1 = {
									rank : data1[code].apple_rank,
									text : 'Apple Music / TOP 100',
									code : code
								};
								var ar2 = {
									rank : data1[code].apple_jpop_world_rank,
									text : 'Apple Music / ' + ((code == 'jp') ? 'J-POP' : 'World'),
									code : code
								};
								var ar3 = {
									rank : data1[code].apple_electro_rank,
									text : 'Apple Music / Electro',
									code : code
								};
								var ar4 = {
									rank : data1[code].apple_dance_rank,
									text : 'Apple Music / Dance',
									code : code
								};

								var sr1 = {
									rank : data1[code].spotify_rank,
									text : 'Spotify / TOP 200',
									code : code
								};
								var sr2 = {
									rank : data1[code].spotify_viral_rank,
									text : 'Spotify / VIRAL 50',
									code : code
								};

								var ar = getRank(ar1, ar2);
								ar = getRank(ar, ar3);
								ar = getRank(ar, ar4);

								var sr = getRank(sr1, sr2);
								var r = getRank(ar1, sr1);
								r = getRank(sr2, r);
								r = getRank(ar3, r);
								r = getRank(ar4, r);
								r = getRank(ar2, r);
					}

					if(USE_DUMMY_DATA) {
						var c = 0;//Math.floor(Math.random() * 6000000);
					} else {
						var c = 0;//getCount(data1[code], null);
					}
					//console.log(getCount(data1, data2))
					if(!API_DATA.counts[trackID][code]) {
						API_DATA.counts[trackID][code] = {
							streams : c,
							rank : r,
							apple_rank : ar,
							spotify_rank : sr,
							text : '',
							code : ''
						}
					} else {
						//API_DATA.counts[trackID][code].streams += c;
						API_DATA.counts[trackID][code].rank = getRank(r, API_DATA.counts[trackID][code].rank)
						API_DATA.counts[trackID][code].apple_rank = getRank(ar, API_DATA.counts[trackID][code].apple_rank)
						API_DATA.counts[trackID][code].spotify_rank = getRank(sr, API_DATA.counts[trackID][code].spotify_rank)
					}

					if(!API_DATA.counts[trackID][REGIONS[j].area]) {
						API_DATA.counts[trackID][REGIONS[j].area] = {
							streams : 0,
							rank : null,
							apple_rank : null,
							spotify_rank : null,
							text : '',
							code : ''
						}
					}
					//API_DATA.counts[trackID][REGIONS[j].area].streams += API_DATA.counts[trackID][code].streams;
					API_DATA.counts[trackID][REGIONS[j].area].rank = getRank(API_DATA.counts[trackID][REGIONS[j].area].rank, API_DATA.counts[trackID][code].rank);
					API_DATA.counts[trackID][REGIONS[j].area].apple_rank = getRank(API_DATA.counts[trackID][REGIONS[j].area].apple_rank, API_DATA.counts[trackID][code].apple_rank);
					API_DATA.counts[trackID][REGIONS[j].area].spotify_rank = getRank(API_DATA.counts[trackID][REGIONS[j].area].spotify_rank, API_DATA.counts[trackID][code].spotify_rank);
					API_DATA.counts[trackID][REGIONS[j].area].code = code;


					//all_data.streams += c;
				
				}
				
				all_data.rank = getRank(all_data.rank, API_DATA.counts[trackID][REGIONS[j].area].rank);
			}
			
			N++;
			if(TRACK_GROUP[_trackID - 1].length == N) {
				API_DATA.counts[trackID]['ALL'] = all_data;
				console.log(trackID)
				all_data = {
					streams : 0,
					rank : null,
					text : '',
					code : ''
				}
				_trackID++;
				N=0;
			}
		}
		//API_DATA.tracks[API_SONG_IDS[API_SONG_CURRENT]]
	};
	var addTSVData = function (complete) {
		d3.tsv(SPOTIFY_TSV, function(error, data) {
			//console.log(data)
			$(data).each(function (i, d) {
				var code = d['国id'];
				var region = d['リージョン'];
	
	
				var P1 = '1: Face My Fears (Japanese Version)';
				var P2 = '2: Face My Fears (English Version)';
				var P3 = '3: Don’t Think Twice';
				var P4 = '4: 誓い（Face My Fears収録）';
				var P5 = '5: Too Proud featuring XZT, Suboi, EK (L1 Remix)';
				var P6 = '6: Chikai（初恋収録）';
				
				if(d[P1] == '' || isNaN(d[P1])) d[P1] = 0;
				if(d[P2] == '' || isNaN(d[P2])) d[P2] = 0;
				if(d[P3] == '' || isNaN(d[P3])) d[P3] = 0;
				if(d[P4] == '' || isNaN(d[P4])) d[P4] = 0;
				if(d[P5] == '' || isNaN(d[P5])) d[P5] = 0;
				if(d[P6] == '' || isNaN(d[P6])) d[P6] = 0;
	
				var count1 = parseInt(d[P1]) + parseInt(d[P2]);
				var count2 = parseInt(d[P3]) + parseInt(d[P4]) + parseInt(d[P6]);
				var count3 = parseInt(d[P5]);
				//console.log(code, count1, count2, count3)

				if(API_DATA.counts[1][code]) API_DATA.counts[1][code].streams += count1;
				if(API_DATA.counts[2][code]) API_DATA.counts[2][code].streams += count2;
				if(API_DATA.counts[3][code]) API_DATA.counts[3][code].streams += count3;

				if(API_DATA.counts[1][region]) API_DATA.counts[1][region].streams += count1;
				if(API_DATA.counts[2][region]) API_DATA.counts[2][region].streams += count2;
				if(API_DATA.counts[3][region]) API_DATA.counts[3][region].streams += count3;

				if(API_DATA.counts[1]['ALL']) API_DATA.counts[1]['ALL'].streams += count1;
				if(API_DATA.counts[2]['ALL']) API_DATA.counts[2]['ALL'].streams += count2;
				if(API_DATA.counts[3]['ALL']) API_DATA.counts[3]['ALL'].streams += count3;
			})


			if(complete) complete();
		});
	};
	function setupGlobe2(option) {
		var getAPIData = function(complete) {
			getYTData(function() {
				getTrackData(function() {
					if(complete) complete();
				});
			});
		};
		// $(map).on(WorldMap.Events.INIT, function () {
		// 	addTSVData();
		// 	createCounts();
		// 	setTimeout(function () {
		// 		map.start();
		// 		$('#loading').hide();
		// 	}, 1000)
		// })
		// getAPIData(function () {
		// 	setTimeout(function () {
		// 		map.create();
		// 		// map.clearData();
		// 		setTimeout(function () {
		// 			try {//console.log(API_DATA.counts[1]);
		// 				map.setTrackData(API_DATA.counts[1]);
		// 			} catch (e) {

		// 			}
		// 		}, 800)
		// 	}, 1000)
		// });
	}
	function setupInlineSvg() {
		var logoAmnesty = doc.querySelector('#logoAmnesty');
		var linkAmnesty = d3.selectAll('.link.amnesty svg');
		linkAmnesty.html(function() {
			var g = logoAmnesty.cloneNode(true);
			g.removeAttribute('id');
			return g.outerHTML;
		});

		var knot = doc.querySelector('#knot');
		var svgknot = d3.selectAll('svg.knot');
		svgknot.html(function() {
			var g = knot.cloneNode(true);
			g.removeAttribute('id');
			return g.outerHTML;
		});
	}
	function setupFront() {
		// TweenLite.set('#frontSvg .keyword .in', { transformOrigin: '50% 50%' });
		autosizeInput(doc.querySelector('#front .step[step="0"] .txtbox'));
		autosizeInput(doc.querySelector('#front .step[step="1"] .txtbox'), { minWidth: true });
		$('#front .step input.txtbox').on('input', function() {
			$(this).parent().toggleClass('entered', this.value != '');
		}).on('keypress', function(e) {
			if(e.keyCode == 13) {
				steps()
			}
		});
		$('#front .textarea textarea').on('keypress', function(e) {
			if(e.keyCode == 13) {
				$('#front .select-word .btn.create').trigger('click');
			}
		});
		$('#front .select-word .btn.next').on('click', function() {
			if(this.classList.contains('disabled')) return;
			var tl = new TimelineLite();
			tl.staggerTo([
				'#front .select-word .btn.next',
				'#front .selecteds'
			], 1, { autoAlpha: 0, clearProps: 'all' }, .1);
			tl.set([
				'#front .prayers',
				'#front .textarea'
			], { display: 'block', autoAlpha: 0, y: 20 });
			tl.set([
				'#front .select-word .btn.create'
			], { display: 'inline-block', autoAlpha: 0 });
			tl.staggerTo([
				'#front .prayers',
				'#front .textarea',
				'#front .select-word .btn.create'
			], 1, { autoAlpha: 1, y: 0, onStart: function() {
				setTimeout(function() {
					$('#front .textarea textarea').focus();
				}, 10);
			} }, .1);
			tl.staggerTo('#frontSvg .keyword .in', 5, { autoAlpha: 0 }, .02, 0);
		});
		var randomColorGen = function() {
			var num = Math.floor((Math.random() * API_DATA.keywords.length - 1));
			if(APP_DATA.selectedKeywords.indexOf(num) > -1)
				return randomColorGen();
			return API_DATA.color[num];
		};
		$('#front .select-word .btn.create').on('click', function() {
			if(!APP_DATA.result) return;
			$('#front .result').html(APP_DATA.result.join('<br />'));
			var tl = new TimelineLite();
			var randomColor = randomColorGen();
			tl.staggerTo([
				'#front .prayers',
				'#front .textarea',
				'#front .select-word .btn.create'
			], 1, { autoAlpha: 0, clearProps: 'all' }, .1);
			// tl.addLabel('s');
			tl.set([
				'#front .result',
				'#front .share'
			], { display: 'block', autoAlpha: 0, y: 20 });
			tl.set([
				'#front .result'
			], { y: '55%' });
			tl.set([
				'#front .select-word .btn.sign',
				'#front .select-word .create-another'
			], { display: 'inline-block', autoAlpha: 0 });
			tl.to(this, .7, { autoAlpha: 0 }, 0);
			tl.to('#front .knot', 1.4, { top: '46%' });
			tl.to('#front .knot .st4', .4, { fill: randomColor });
			tl.add('r', '+=2');
			tl.to('#front .knot', 1, { top: '30%' }, 'r');
			tl.to('#front .result', 1, { autoAlpha: 1 }, 'r+=.4');
			tl.add('f', '+=2');
			tl.staggerTo([
				'#front .share',
				'#front .select-word .btn.sign',
				'#front .select-word .create-another'
			], 1, { autoAlpha: 1, y: 0 }, .1, 'f');
			tl.to('#front .result', 1, { y: '0%' }, 'f');
			tl.to('#front .knot', 1, { top: '22%' }, 'f');
			if(global.addthis_share) {
				global.addthis_share.title = APP_DATA.result.join('\n') + '\n\n' + document.title;
				global.addthis_share.url = window.location.href;
			}
			PLAYED = true;
			STEP_HAIKU = 0;
			APP_DATA.selectedKeywords = new Array();
			APP_DATA.result = '';
			// STARTED_HAIKU = false;
		});
		$('#front .select-word .btn.sign').on('click', function() {
			var tl = new TimelineLite();
			tl.set('section.petition iframe', { autoAlpha: 0 });
			tl.to('section.main', 1, { autoAlpha: 0 });
			tl.set('html', { className: '+=dark-mode' }, .5);
			tl.to([
				'section.petition'
			], 1, { autoAlpha: 1 });
			tl.to([
				'#parts .btn:not(.goback)',
				'#parts .part-site .temp'
			], 1, { autoAlpha: 0 }, 0);
			tl.staggerTo('#parts .at-resp-share-element .at-share-btn', .7, { autoAlpha: 0, x: -20 }, .05, 0);
			tl.to('#parts .btn.goback', 1, { autoAlpha: 1 });
			tl.to([
				'section.petition iframe'
			], 1, { autoAlpha: 1 }, '-=.5');
		});
		$('#front .select-word .create-another').on('click', function() {
			APP_DATA.selectedKeywords = new Array();
			APP_DATA.result = '';
			var temp = $('<div />');
			temp.append($('#front .addthis_inline_share_toolbox'));
			$('#front .selecteds').html('');
			$('#frontSvg .keyword.on').removeClass('on');
			TweenLite.set([
				'#front .knot .st1',
				'#front .knot .st2',
				'#front .knot .st3',
				'#front .knot .st4'
			], { fill: '#f2f2f2' });
			var tl = new TimelineLite();
			tl.set([
				// '#tempBg',
				'#front .knot',
				'#front .steps *'
			], { clearProps: 'all' });
			tl.set('#front .btn.next', { className: '+=disabled' });
			setTimeout(function() {
				// console.log(temp);
				$('#front .share').append(temp.children());
				addthis.layers.refresh();
			}, 250);
			STARTED_HAIKU = true;
			steps();
		});
	}
	function steps() {
		var tl = new TimelineLite();
		if(PLAYED) {
			tl.to([
				'#parts .btn.create',
				'#parts .temp',
				'#front .step[step="0"] .question',
				'#front .step[step="0"] .answer',
				'#front .step[step="1"] .question',
				'#front .step[step="1"] .answer'
			], 1, { autoAlpha: 0 }, 0);
			tl.to([
				'#parts .btn.tohome'
			], 1, { autoAlpha: 1 }, 0);
			tl.to('#tempBg', 1, { autoAlpha: .5 }, 0);
			STEP_HAIKU = 2;
		}
		if(STEP_HAIKU == 0) {
			tl.staggerTo('#frontSvg .keyword .in', 1, { autoAlpha: 0 }, .015, 0);
			tl.to('#tempBg', 1, { autoAlpha: .5 }, 0);
			tl.to([
				'#parts .btn.create',
				'#parts .temp'
			], 1, { autoAlpha: 0 }, 0);
			tl.to([
				'#parts .btn.tohome'
			], 1, { autoAlpha: 1 }, 0);
			tl.set('#front .step[step="0"]', { autoAlpha: 1 });
			tl.staggerFrom([
				'#front .step[step="0"] .question',
				'#front .step[step="0"] .answer'
			], 2, { autoAlpha: 0, y: 15, onStart: function() {
				setTimeout(function() {
					$('#front .step[step="0"] input.txtbox').focus();
				}, 10);
			} }, .2);
			STEP_HAIKU++;
		} else if(STEP_HAIKU == 1) {
			tl.staggerTo([
				'#front .step[step="0"] .question',
				'#front .step[step="0"] .answer'
			], 1, { autoAlpha: 0 }, .2, 0);
			tl.addLabel('s');
			tl.staggerTo([
				'#front .step[step="0"] .question',
				'#front .step[step="0"] .answer'
			], 2, { y: -30, ease: Power1.easeOut, clearProps: 'all', onComplete: function() {
				TweenLite.set('#front .step[step="0"]', { autoAlpha: 0 });
			} }, .2, 0);
			tl.set('#front .step[step="1"]', { autoAlpha: 1 }, 's-=1');
			tl.staggerFrom([
				'#front .step[step="1"] .question',
				'#front .step[step="1"] .answer'
			], 2, { autoAlpha: 0, y: 15, onStart: function() {
				setTimeout(function() {
					$('#front .step[step="1"] input.txtbox').focus();
				}, 10);
			} }, .2, 's');
			STEP_HAIKU++;
		} else if(STEP_HAIKU == 2) {
			tl.staggerTo([
				'#front .step[step="1"] .question',
				'#front .step[step="1"] .answer'
			], 1, { autoAlpha: 0 }, .2, 0);
			tl.staggerTo([
				'#front .step[step="1"] .question',
				'#front .step[step="1"] .answer'
			], 2, { y: -30, ease: Power1.easeOut, clearProps: 'all', onComplete: function() {
				TweenLite.set('#front .step[step="1"]', { autoAlpha: 0 });
			} }, .2, 0);
			tl.add('s');
			tl.to('#front .step[step="2"]', 1, { autoAlpha: 1 }, 's-=1');
			tl.add('r', 's+=3');
			tl.to('#front .step[step="2"]', .4, { autoAlpha: 0 }, 'r');
			tl.set('#front .select-word .btn.next', { 'display': 'inline-block' });
			tl.to([
				'#front .knot',
				'#front .step[step="3"]'
			], 1, { autoAlpha: 1 });
			tl.set('#frontSvg .keywords', { className: '-=disable' });
			tl.staggerTo('#frontSvg .keyword .in', 5, { autoAlpha: 1 }, .02);
			STEP_HAIKU++;
		}
	}
	function setupParts() {
		$('#parts .part-about .link.about').on('click', function() {
			var tl = new TimelineLite();
			tl.to('section.main', 1, { autoAlpha: 0 });
			tl.set('html', { className: '+=dark-mode' }, .5);
			tl.to([
				'section.about',
				'#parts .by'
			], 1, { autoAlpha: 1 });
			tl.to([
				'#parts .btn:not(.goback)',
				'#parts .part-site .temp'
			], 1, { autoAlpha: 0 }, 0);
			tl.staggerTo('#parts .at-resp-share-element .at-share-btn', .7, { autoAlpha: 0, x: -20 }, .05, 0);
			tl.to('#parts .btn.goback', 1, { autoAlpha: 1 });
		});
		$('#parts .btn.goback').on('click', function() {
			var tl = new TimelineLite();
			tl.to([
				'#parts .btn',
				'section.about',
				'section.petition',
				'#parts .by'
			], 1, { autoAlpha: 0 });
			tl.set('html', { className: '-=dark-mode' }, 0);
			tl.to('section.main', 1, { autoAlpha: 1 });
			tl.to([
				'#parts .part-site .temp'
			], 1, { autoAlpha: 1 }, 1);
			tl.staggerTo('#parts .at-resp-share-element .at-share-btn', 1, { autoAlpha: 1, x: 0 }, .05, 1);
			if(STARTED_HAIKU) {
				tl.to([
					'#parts .btn.tohome'
				], 1, { autoAlpha: 1 });
			} else {
				tl.to([
					'#parts .btn.create'
				], 1, { autoAlpha: 1 });
			}
		});
		$('#parts .btn.create').on('click', function() {
			STARTED_HAIKU = true;
			steps();
		});
		$('#parts .btn.tohome').on('click', function() {
			APP_DATA.selectedKeywords = new Array();
			APP_DATA.result = '';
			var temp = $('<div />');
			temp.append($('#front .addthis_inline_share_toolbox'));
			$('#front .selecteds').html('');
			$('#frontSvg .keyword.on').removeClass('on');
			TweenLite.set([
				'#front .knot .st1',
				'#front .knot .st2',
				'#front .knot .st3',
				'#front .knot .st4'
			], { fill: '#f2f2f2' });
			var tl = new TimelineLite();
			tl.set([
				'#tempBg',
				'#front .knot',
				'#front .steps *'
			], { clearProps: 'all' });
			// tl.set('#frontSvg .keyword', { className: '-=on' });
			tl.set('#front .btn.next', { className: '+=disabled' });
			tl.to('#parts .btn.tohome', .4, { autoAlpha: 0 }, 0);
			tl.to([
				'#parts .part-site .temp',
				'#parts .btn.create'
			], .4, { autoAlpha: 1 }, 0);
			tl.staggerTo('#frontSvg .keyword .in', 5, { autoAlpha: 1 }, .02);
			// $('#front .addthis_inline_share_toolbox').html('');
			setTimeout(function() {
				// console.log(temp);
				$('#front .share').append(temp.children());
				addthis.layers.refresh();
			}, 250);
			STEP_HAIKU = 0;
			STARTED_HAIKU = false;
		});
	}
	function setupLanding() {
		$('section.landing .btn.enter').on('click', function() {
			var tl = new TimelineLite();
			tl.to('section.landing', 1, { autoAlpha: 0 });
			tl.to('#parts .btn.create', 1, { autoAlpha: 1 });
		});
		var tl = new TimelineLite();
		tl.to('#mask', 2, { autoAlpha: 0 }, 0);
		tl.staggerFrom([
			'section.landing h1.head',
			// 'section.landing .desc',
			'section.landing .link',
			// 'section.landing .btn.enter'
		], 3, { autoAlpha: 0 }, .06, .7);
		tl.from([
			'section.landing .desc'
		], 3, { autoAlpha: 0, y: 10 }, 1.2);
		tl.set('section.landing .musubi', { className: '+=colorful' }, 1.5);
		tl.from([
			'section.landing .btn.enter'
		], 3, { autoAlpha: 0, y: 10 }, '-=2');
	}
	function init() {
		loadHaiku(setupHaiku);
		setupInlineSvg();
		setupParts();
		setupFront();
		// setupGlobe('static');
		setupGlobe2();
		/*
		TweenLite.set(['#parts .btn.create'], { autoAlpha: 1 });
		TweenLite.set(['#mask', 'section.landing'], { autoAlpha: 0 });/*/
		setTimeout(function() {
			setupLanding();
		}, 0);//*/
	}
	init();
})(window, document);
});