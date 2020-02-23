(function(global) {
	var globeContainer = document.getElementById('globe');
	function setupGlobe(option) {
		var fullSize = 840,
			ballSize = 575,
			velocity = 0.0025,
			dragX = 220;

		var front = d3.geoOrthographic()
			.translate([ballSize / 2, ballSize / 2])
			.scale(ballSize / 2)
			.precision(.1);
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
		});
		ball.append('circle').attrs({
			'cx': ballSize / 2,
			'cy': ballSize / 2,
			'r': ballSize / 2,
			'fill': '#f2f2f2'
		});
		ball.append('path').datum(d3.geoGraticule().step([30, 30])).attr('class', 'graticule');
		ball.append('path').datum({ type: 'Sphere' }).attr('class', 'outline');

		var globePath = ball.selectAll('path');

		globeContainer.step = (function(velocity, front, frontPath, globePath) {
			return function(elapsed) {
				//console.log(velocity * elapsed);
				front.rotate([dragX + velocity * elapsed, -35, -25]);
				globePath.attr('d', frontPath);
			};
		})(velocity, front, frontPath, globePath);
		/*if(option != 'static')
			globeContainer.timer = d3.timer(globeContainer.step);
		else */globeContainer.step(0);

		// d3.json('data/data.json', function(error, data) {

		// });
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
						syllable5.push(lines[j].slice(0, find5).trim());
						continue;
					}
					if(find7 > -1) {
						syllable7.push(lines[j].slice(0, find7).trim());
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
				if(!dataLines[keyword] || !dataLines[keyword]['syllable' + syllable]) return;
				var len = dataLines[keyword]['syllable' + syllable].length;
				var num = Math.floor(Math.random() * len);
				return dataLines[keyword]['syllable' + syllable][num];
			};
			var genHaiku = function() {
				if(selectedKeywords.length < 3) return;
				var rndKeywords = selectedKeywords.sort(function(a, b) { return 0.5 - Math.random() });
				var result = new Array(
					genLine(rndKeywords[0], 5),
					genLine(rndKeywords[0], 7),
					genLine(rndKeywords[0], 5)
				);
				globe.append('div').attr('class', 'head result').html(result.join('<br />'));
				// console.log(result);
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
		});
		// var dataKeyWords = new Array('LGBT', 'Sportsmanship', 'Liberation', 'Diversity', 'Solidarity', 'Human', 'Athlete', 'Minority', 'Self', 'Pride', 'Harmony', 'Warmth', 'Fair/fairness', 'Equal/equality', 'Discrimination', 'Rainbow', 'Colours', 'Voice', 'Tolerance', 'Glory', 'Brave', 'Natural', 'Beauty', 'Love', 'Motion', 'Identity', 'Respect', 'Inclusive', 'Connect', 'Free/freedom');
	}
	setupGlobe();
})(window);
