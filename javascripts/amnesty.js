(function(global) {
	String.prototype.capitalize = function() {
		return this.charAt(0).toUpperCase() + this.slice(1);
	};
	var globeContainer = document.getElementById('globe');
	var fullSize = 840, ballSize = 575;
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
			.rotate([origin.x, origin.y, origin.z]);
		var frontPath = d3.geoPath().projection(front);
		var globe = d3.select(globeContainer);
		var globeSvg = globe.append('svg').attrs({
			'id': 'globeSvg',
			'viewBox': '0 0 ' + fullSize + ' ' + fullSize
		});



		var ballPos = fullSize / 2 - ballSize / 2;
		var ball = globeSvg.append('g').attrs({
			'width': ballSize,
			'height': ballSize,
			'class': 'ball',
			'transform': 'translate(' + ballPos + ', ' + ballPos + ')'
		}).datum({
			x: 0,
			y: 0
		});



		var graticule = d3.geoGraticule().step([30, 30]);
		ball.append('circle').attrs({
			'cx': ballSize / 2,
			'cy': ballSize / 2,
			'r': ballSize / 2,
			'fill': '#f2f2f2'
		});
		ball.append('path').datum(graticule).attr('class', 'graticule');
		ball.append('path').datum({ type: 'Sphere' }).attr('class', 'outline');



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
			ball.timer = d3.timer(function() {
				var o0 = front.rotate();
				if(!doRotation) {
					if(doEase) {
						var v = d3.easeQuadOut(easeTime);
						var t = v * .1;
						easeTime = easeTime - .01;
						o0[0] += t;
						if(t < .05) {
							doEase = false;
							doRotation = true;
						}
					} else {
						return;
					}
				} else {
					o0[0] += .05;
				}
				front.rotate(o0);
				updatePaths();
			});
		}
		front.rotate([origin.x, origin.y, origin.z]);
		updatePaths();



		load_haiku(globe, globeSvg);
		load_point(ball, frontPath);
	}
	function load_point(ball, frontPath) {
		var genDot = function() {
			var dots = ball.append('g').attrs({
				'class': 'dots'
			});
			var v = d3.scaleLinear()
				.domain([-360, 360])
				.range([-180, 180]);
			var xNum = 50;
			var yNum = 15;
			var circles = new Array();
			var rs = d3.scaleLinear()
				.domain([0, 50])
				.range([2, 1]);
			var xs = d3.scaleLinear()
				.domain([0, xNum])
				.range([-180, 180]);
			var ys = d3.scaleLinear()
				.domain([0, yNum])
				.range([0, 90]);
			for(var j = 0; j < xNum; j++) {
				for(var k = 0; k < yNum - 2; k++) {
					circles.push([xs(j), ys(k)]);
				}
			}
			// console.log(circles);
			// var circles = [
			// 	[-135, 0], [-90, 0], [-45, 0], [0, 0], [45, 0], [90, 0], [135, 0], [180, 0],
			// 	[0, -70], [0, -35], [0, 35], [0, 70],
			// 	[180, -70], [180, -35], [180, 35], [180, 70],
			// ];
			// console.log(circles);
			var geoCircle = d3.geoCircle().radius(2);
			var u = dots.selectAll('path')
				.data(circles.map(function(d) {
					geoCircle.center(d).radius(rs(d[1]));
					return geoCircle();
				}))
				.enter()
				.append('path')
				// .attr('class', 'dot')
				.attr('d', frontPath);
		};
		genDot();
	}
	function load_haiku(globe, globeSvg) {
		d3.csv('data/data.csv', function(data) {
			var dataKeyWords = new Array();
			var dataLines = {};
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
				dataLines[data[i].keyword] = {
					syllable5: syllable5,
					syllable7: syllable7
				};
				dataKeyWords.push(data[i].keyword);
			}
			// console.log(dataLines);
			var genLine = function(keyword, syllable) {
				if(!dataLines[keyword] 
					|| !dataLines[keyword]['syllable' + syllable]
					|| dataLines[keyword]['syllable' + syllable].length < 1) return false;
				var len = dataLines[keyword]['syllable' + syllable].length;
				var num = Math.floor(Math.random() * len);
				return dataLines[keyword]['syllable' + syllable][num];
			};
			var genHaiku = function() {
				if(selectedKeywords.length < 3) return;
				var rndKeywords = selectedKeywords.sort(function(a, b) { return 0.5 - Math.random() });
				var result = new Array(
					genLine(rndKeywords[0], 5),
					genLine(rndKeywords[1], 7),
					genLine(rndKeywords[2], 5)
				);
				for(var i = 0; i < result.length; i++) {
					if(result[i] === false) {
						genHaiku();
						return;
					}
				}
				globe.append('div').attr('class', 'head result').html(result.join('<br />'));
			};
			var keywords = globeSvg.append('g').attrs({
				'class': 'keywords',
				'transform': 'translate(' + fullSize / 2 + ', ' + fullSize / 2 + ')'
			});

			var r = d3.scaleLinear()
				.domain([0, dataKeyWords.length])
				.range([0, 360]);
			var y = d3.scaleLinear()
				.domain([0, 100])
				.range([ballSize / 4, 0]);
			var line = d3.line()
				.x(0)
				.y(function(d) { return y(d) - 122; });

			var selectedKeywords = new Array();
			var addSelectedKeywords = function(word) {
				d3.select('.selecteds')
					.append('div')
					.attr('class', 'selected')
					.html('<div class="close"></div><div class="head text">' + word + '</div>');
			};
			var keyword = keywords.selectAll('.keyword')
				.data(dataKeyWords)
				.enter()
				.append('g')
				.attrs({
					'transform': function(d, i) { return 'rotate(' + (r(i) + 90) + ') translate(' + y(-120) + ', 0)'; },
					'class': 'keyword'
				}).on('click', function(d, i) {
					if(selectedKeywords.length >= 3) return;
					this.classList.toggle('on');
					selectedKeywords.push(d);
					keywords.classed('disable', selectedKeywords.length >= 3);
					addSelectedKeywords(d);
					if(selectedKeywords.length >= 3)
						genHaiku();
				});
			keyword.append('path').attrs({
				'd': function(d) { return line([0, 8]); },
				'transform': function(d, i) { return 'rotate(90)'; },
				'stroke': '#525252',
				'stroke-width': .25,
				'stroke-linecap': 'round'
			});
			keyword.append('rect').attrs({
				'y': -28,
				'x': -20,
				'width': 100,
				'height': 60,
				'fill': 'transparent'
			});
			keyword.append('g').attrs({
				'class': 'text'
			}).append('text').attrs({
				'dy': '0.31em',
				'text-anchor': function(d, i) {
					var deg = r(i);
					return deg >= 0 && deg <= 180? 'end' : 'start';
				},
				'transform': function(d, i) {
					var deg = r(i);
					return deg >= 0 && deg <= 180? 'rotate(180)' : null;
				}
			})
			// .attr('class', 'head')
			.text(function(d) { return d; });

			// genDot();
		});
	}
	setupGlobe('static');
})(window);
