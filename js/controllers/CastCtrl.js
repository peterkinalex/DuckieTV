angular.module('DuckieTV.controllers.chromecast', ['DuckieTV.providers.chromecast'])


/**
 * ChromeCast controller. Can fire off ChromeCast initializer
 */
.controller('ChromeCastCtrl', function($scope, DuckieTVCast, $q, $rootScope) {

    $scope.addrs = {};
    $scope.localIpAddress = $rootScope.getSetting('ChromeCast.localIpAddress');

    discoverLocalIP = function() {
        console.log("Discovering local IP Address via RTC Peer Connnection");
        var p = $q.defer();

        var RTCPeerConnection = window.webkitRTCPeerConnection;

        var rtc = new RTCPeerConnection({
            iceServers: []
        });
        if (window.mozRTCPeerConnection) rtc.createDataChannel('', {
            reliable: false
        });

        function grepSDP(sdp) {
            sdp.split('\r\n').map(function(line) {
                if (~line.indexOf('a=candidate')) {
                    var parts = line.split(' '),
                        addr = parts[4],
                        type = parts[7];
                    if (type === 'host') $scope.addrs[addr] = true;
                }
            });
        }

        rtc.onicecandidate = function(evt) {
            if (evt.candidate) {
                grepSDP(evt.candidate.candidate);
            }
        }

        rtc.createOffer(function(desc) {
            rtc.setLocalDescription(desc)
        }, function(e) {});

        setTimeout(function() {
            p.resolve(Object.keys($scope.addrs));
        }, 1500);

        return p.promise;

    }

    $scope.getLocalIP = function() {
        discoverLocalIP().then(function(result) {
            console.debug("Local IP Address: ", result);
            $scope.localIpAddresses = result;
        });
    };

    $scope.setStreamingSource = function(address) {
        $rootScope.setSetting('ChromeCast.localIpAddress', address);
        $scope.localIpAddress = address;
    }

    $scope.Cast = function() {
        console.log('connecting!');
        DuckieTVCast.initialize();
    }

    $scope.getLocalIP();
});