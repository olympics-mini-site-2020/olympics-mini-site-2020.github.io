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
			//.clipAngle(90)
			//.rotate([0, 0])
			.precision(.1);
		var frontPath = d3.geoPath().projection(front);
		var globe = d3.select(globeContainer);
		var globeSvg = globe.append('svg')
			.attr('id', 'globeSvg')
			.attr('viewBox', '0 0 ' + fullSize + ' ' + fullSize);
		var ball = globeSvg.append('g')
			.attr('width', ballSize)
			.attr('height', ballSize)
			.attr('class', 'ball')
			.attr('transform', 'translate(' + (fullSize / 2 - ballSize / 2) + ', ' + (fullSize / 2 - ballSize / 2) + ')');
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
		var keyWords = new Array('LGBT', 'Human', 'Liberation', 'Diversity', 'Solidarity', 'Sportsmanship', 'Athlete', 'Minority', 'Equal/equality', 'Discrimination', 'Harmony', 'Warmth', 'Fair/fairness', 'Self', 'Pride', 'Rainbow', 'Colours', 'Voice', 'Love', 'Glory', 'Brave', 'Natural', 'Beauty', 'Tolerance', 'Motion', 'Identity', 'Respect', 'Free/freedom', 'Inclusive', 'Connect');
		var group = globeSvg.append('g')
			.attr('class', 'keywords')
			.attr('transform', 'translate(' + fullSize / 2 + ', ' + fullSize / 2 + ')');

		var r = d3.scaleLinear()
            .domain([0,keyWords.length])
            .range([0,360]);
		var y = d3.scaleLinear()
            .domain([0, 100])
            .range([ballSize / 4, 0]);

		group.selectAll('.keyword')
			.data(keyWords)
			.enter()
			.append('g')
			.attr('transform', function(d, i) { return 'rotate(' + ((360 / keyWords.length) * i) + ')'; })
			// .attr('transform', function(d, i) { return 'rotate(' + r(i) + ')'; })
			.attr('class', 'keyword')
			.append('text')
			.attr('text-anchor', 'start')
			.attr('x', 300)
			.attr('y', function(d) { return y(90); })
			.attr('class', 'head')
			.text(function(d) { return d; });
	}
	setupGlobe();
})(window);
