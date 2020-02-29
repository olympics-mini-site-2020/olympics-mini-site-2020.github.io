import '../css/normalize.css';
import classNames from '../css/style.css';
import * as d3 from "d3";
import "d3-selection-multi";

(function(global, doc) {

function roundUp(n, rnd) {
	if(!rnd) rnd = 1000;
	var dec;
	return (dec = n - (n |= 0))? ((dec * rnd + (dec < 0 ? -0.5 : 0.5)) | 0) / rnd + n : n;
}
String.prototype.capitalize = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
};
var globeContainer = doc.getElementById('globe');
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



	var graticule = d3.geoGraticule().step([30, 30]).precision(8);
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



	var ballPath = ball.selectAll('path');
	var updatePaths = function() {
		ballPath.attr('d', frontPath);
		// ball.selectAll('path.graticule').attr('d', frontPath);
		// ball.selectAll('path.outline').attr('d', frontPath);
		// ball.selectAll('path.dot').attr('d', frontPath);
	};



	if(option != 'static') {
		// ball.timer = d3.timer(function() {
		// 	var o0 = front.rotate();
		// 	o0[0] += .25;
		// 	front.rotate(o0);
		// 	updatePaths();
		// });
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
				doRotation = true;
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
		// 		o0[0] += .1;
		// 	}
		// 	front.rotate(o0);
		// 	updatePaths();
		// });
	}
	front.rotate([origin.x, origin.y, origin.z]);
	updatePaths();



	load_haiku(globe, svg);
	load_point(ball, frontPath);
	ballPath = ball.selectAll('path');
}
function load_point(ball, frontPath) {
	var genDot = function() {
		var dots = ball.append('g').attrs({
			'class': 'dots'
		});
		var geoCircle = d3.geoCircle().radius(2.5).precision(28);
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
				geoCircle.center(d);
				var circle = geoCircle();
				if(Math.random() > .6) {
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
				geoCircle.center(d);
				var circle = geoCircle();
				if(Math.random() > .6) {
					circle._hide = true;
				}
				circles.push(circle);
			}
		}
		// console.log(circles.length);
		dots.selectAll('path')
			.data(circles)
			.enter()
			.append('path')
			.attr('class', function(d) { return d._hide? 'dot hide' : 'dot'; })
			.attr('d', frontPath);
	};
	genDot();
}
function load_haiku(globe, svg) {
	import('../data/data.json').then(({default: data}) => {
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
		var keywords = svg.append('g').attrs({
			class: 'keywords',
			transform: 'translate(' + fullSize / 2 + ', ' + fullSize / 2 + ')'
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
				transform: function(d, i) { return 'rotate(' + (r(i) + 90) + ') translate(' + y(-120) + ', 0)'; },
				class: 'keyword'
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
			d: function(d) { return line([0, 8]); },
			transform: function(d, i) { return 'rotate(90)'; },
			stroke: '#525252',
			'stroke-width': .25,
			'stroke-linecap': 'round'
		});
		keyword.append('rect').attrs({
			y: -28,
			x: -20,
			width: 100,
			height: 60,
			fill: 'transparent'
		});
		keyword.append('g').attrs({
			class: 'text'
		}).append('text').attrs({
			dy: '0.31em',
			'text-anchor': function(d, i) {
				var deg = r(i);
				return deg >= 0 && deg <= 180? 'end' : 'start';
			},
			transform: function(d, i) {
				var deg = r(i);
				return deg >= 0 && deg <= 180? 'rotate(180)' : null;
			}
		})
		// .attr('class', 'head')
		.text(function(d) { return d; });

		// genDot();
	});
}
function setupLanding() {
	var landing = d3.select('.landing');
	landing.btnEnter = landing.select('.btn.enter');
	landing.btnEnter.on('click', function() {
		d3.select('html').classed('enter', true);
	});
	// landing.classed('show', true);
	// d3.select('html').classed('enter', true);//temp
}
function setupLinkAmnesty() {
	var logoAmnesty = doc.querySelector('#logoAmnesty');
	var linkAmnesty = d3.selectAll('.link.amnesty svg');
	linkAmnesty.html(function() {
		var g = logoAmnesty.cloneNode(true);
		g.removeAttribute('id');
		return g.outerHTML;
	});
}
function init() {
	setupLinkAmnesty();
	setupGlobe(/*'static'*/);
	// console.log(classNames);
	setupLanding();
	d3.select('#mask').classed('hide', true);
}
init();

})(window, document);
