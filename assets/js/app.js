/* TODO
- check for other libraries (localforage, ...) 
*/

var PterodactylWebStats = {
	isConnected: false,
	charts: {
		cpu: null,
		memory: null
	},
	data: {
		cpu: [],
		memory: [],
		labels: [],
		started_at: null
	},
	_socket: null,
	init: function() {
		$('.pws-errored').hide();

		if (typeof $.notify.defaults !== 'function') {
            this._error('Notify does not appear to be loaded.');
            return;
        }

		if (typeof io !== 'function') {
            this._error('Socket.io is required to use this panel.');
            return;
        }

        $.notify.defaults({
        	'globalPosition': 'bottom right'
        });

		$('#pws-connect-button').click(function() {
			PterodactylWebStats.connect();
			$('.pws-disconnected').hide();
			$('.pws-connected').hide();
			$('.pws-connecting').show();
		});

		$('#pws-disconnect-button').click(function() {
			PterodactylWebStats.disconnect();
		});

		var ctx = document.getElementById('pws-cpu-chart');
		PterodactylWebStats.charts.cpu = new Chart(ctx, {
			type: 'line',
			data: {
				labels: PterodactylWebStats.data.labels,
				datasets: [{
                    label: 'Percent Use',
                    fill: false,
                    lineTension: 0.03,
                    backgroundColor: '#3c8dbc',
                    borderColor: '#3c8dbc',
                    borderCapStyle: 'butt',
                    borderDash: [],
                    borderDashOffset: 0.0,
                    borderJoinStyle: 'miter',
                    pointBorderColor: '#3c8dbc',
                    pointBackgroundColor: '#fff',
                    pointBorderWidth: 1,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#3c8dbc',
                    pointHoverBorderColor: 'rgba(220,220,220,1)',
                    pointHoverBorderWidth: 2,
                    pointRadius: 1,
                    pointHitRadius: 10,
                    data: PterodactylWebStats.data.cpu,
                    spanGaps: false
				}]
			},
            options: {
                title: {
                    display: true,
                    text: 'CPU utilization (total percentage)'
                },
                legend: {
                    display: false,
                },
                animation: {
                    duration: 1,
                },
                maintainAspectRatio: false
        	}
		});

		var ctx = document.getElementById('pws-memory-chart');
		PterodactylWebStats.charts.memory = new Chart(ctx, {
			type: 'line',
			data: {
				labels: PterodactylWebStats.data.labels,
				datasets: [{
                    label: 'Memory Use',
                    fill: false,
                    lineTension: 0.03,
                    backgroundColor: '#3c8dbc',
                    borderColor: '#3c8dbc',
                    borderCapStyle: 'butt',
                    borderDash: [],
                    borderDashOffset: 0.0,
                    borderJoinStyle: 'miter',
                    pointBorderColor: '#3c8dbc',
                    pointBackgroundColor: '#fff',
                    pointBorderWidth: 1,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#3c8dbc',
                    pointHoverBorderColor: 'rgba(220,220,220,1)',
                    pointHoverBorderWidth: 2,
                    pointRadius: 1,
                    pointHitRadius: 10,
                    data: PterodactylWebStats.data.memory,
                    spanGaps: false
				}]
			},
            options: {
                title: {
                    display: true,
                    text: 'Memory usage (MByte)'
                },
                legend: {
                    display: false,
                },
                animation: {
                    duration: 1,
                },
                maintainAspectRatio: false
        	}
		});

		this.loadDataFromStorage();
	},
	connect: function() {
		var url = $('#pws-url').val();
		var token = $('#pws-token').val();
		
		this._socket = io(url, {
			'query': 'token=' + token
		});

		this._socket.on('error', function(err) {
			$.notify(err, 'error');
			$('.pws-disconnected').show();
			$('.pws-connecting').hide();
			// this.disconnect();
		});

		this._socket.on('connect_error', function(err) {
			$.notify(err, 'error');
			$('.pws-disconnected').show();
			$('.pws-connecting').hide();
			// this.disconnect();
		});

		this._socket.on('connect', function() {
			$.notify('Connection successful!', 'success');

			$('.pws-disconnected').hide();
			$('.pws-connected').show();
			$('.pws-connecting').hide();

			PterodactylWebStats.data.started_at = moment();
			PterodactylWebStats.isConnected = true;
		});

		this._socket.on('proc', function(proc) {
			if (PterodactylWebStats.isConnected) {
				var cpuUse = proc.data.cpu.total;
				var memoryUse = parseInt(proc.data.memory.total / (1024 * 1024));
				var time = moment().format('HH:mm:ss');

				// in-memory for charts
				PterodactylWebStats.data.cpu.push(cpuUse);
				PterodactylWebStats.data.memory.push(memoryUse);
				PterodactylWebStats.data.labels.push(time);

				// local storage
				localforage.length().then(function(length) {
					localforage.setItem(length.toString(), {
						'cpu': cpuUse,
						'memory': memoryUse,
						'label': time
					}).catch(function(err) {
					    console.log(err);
					    $.notify(err, 'error');
					});
				}).catch(function(err) {
				    console.log(err);
				    $.notify(err, 'error');
				});

				PterodactylWebStats.charts.cpu.update();
				PterodactylWebStats.charts.memory.update();
			}
		});

		this._socket.on('initial status', function(data) {
			console.log(data);
		});

		this._socket.on('status', function(data) {
			console.log(data);
		});
	},
	disconnect: function() {
		$('.pws-connected').hide();
		$('.pws-disconnected').show();

		this._socket.close();
		this.isConnected = false;
	},
	loadDataFromStorage: function() {
		localforage.iterate(function(value, key, iterationNumber) {
			PterodactylWebStats.data.cpu.push(value.cpu);
			PterodactylWebStats.data.memory.push(value.memory);
			PterodactylWebStats.data.labels.push(value.label);
		}).then(function() {
			PterodactylWebStats.charts.cpu.update();
			PterodactylWebStats.charts.memory.update();

		    console.log('Loaded data from local storage successfully!');
		}).catch(function(err) {
		    console.log(err);
		    $.notify(err, 'error');
		});
	},
	_error: function(msg) {
		console.error(msg);
		$('.pws-connected').hide();
		$('.pws-disconnected').hide();
		$('.pws-errored').show();
	}
};

$(document).ready(function() {
	$('.pws-connecting').hide();
	$('.pws-connected').hide();
	PterodactylWebStats.init();
});