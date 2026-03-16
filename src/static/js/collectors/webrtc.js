async function collectWebRTC() {
    if (!window.RTCPeerConnection) {
        return { webrtc: { supported: false } };
    }

    function getExtensions(sdp) {
        const extensions = (('' + sdp).match(/extmap:\d+ [^\n|\r]+/g) || [])
            .map(x => x.replace(/extmap:[^\s]+ /, ''));
        return [...new Set(extensions)].sort();
    }

    function getCapabilities(sdp) {
        const rtxCounter = { val: 0 };

        function constructDescriptions(mediaType, sdpDescriptors) {
            if (!sdpDescriptors.join('')) return [];
            return sdpDescriptors.reduce((acc, descriptor) => {
                const matcher = `(rtpmap|fmtp|rtcp-fb):${descriptor} (.+)`;
                const formats = sdp.match(new RegExp(matcher, 'g')) || [];
                if (!formats.length) return acc;

                const isRtxCodec = formats.some(f => f.includes(' rtx/'));
                if (isRtxCodec) {
                    if (rtxCounter.val) return acc;
                    rtxCounter.val++;
                }

                const description = formats.reduce((d, x) => {
                    const rawData = x.replace(/[^\s]+ /, '');
                    const data = rawData.split('/');
                    const codec = data[0];

                    if (x.includes('rtpmap')) {
                        d.mimeType = `${mediaType}/${codec}`;
                        d.clockRates = [...(d.clockRates || []), +data[1]];
                        if (mediaType === 'audio') {
                            d.channels = (+data[2]) || 1;
                        }
                    } else if (x.includes('rtcp-fb')) {
                        d.feedbackSupport = [...(d.feedbackSupport || []), rawData];
                    } else if (!isRtxCodec) {
                        d.sdpFmtpLine = [...rawData.split(';')];
                    }
                    return d;
                }, {});

                // Merge with existing entry of same mimeType
                const existing = acc.find(x => x.mimeType === description.mimeType);
                if (existing) {
                    if (existing.clockRates && description.clockRates) {
                        existing.clockRates = [...new Set([...existing.clockRates, ...description.clockRates])];
                    }
                    if (existing.feedbackSupport && description.feedbackSupport) {
                        existing.feedbackSupport = [...new Set([...existing.feedbackSupport, ...description.feedbackSupport])];
                    }
                    if (existing.sdpFmtpLine && description.sdpFmtpLine) {
                        existing.sdpFmtpLine = [...new Set([...existing.sdpFmtpLine, ...description.sdpFmtpLine])];
                    }
                    return acc;
                }
                return [...acc, description];
            }, []);
        }

        const videoDescriptors = ((/m=video [^\s]+ [^\s]+ ([^\n|\r]+)/.exec(sdp) || [])[1] || '').split(' ');
        const audioDescriptors = ((/m=audio [^\s]+ [^\s]+ ([^\n|\r]+)/.exec(sdp) || [])[1] || '').split(' ');

        return {
            audio: constructDescriptions('audio', audioDescriptors),
            video: constructDescriptions('video', videoDescriptors)
        };
    }

    function getIPAddress(sdp) {
        const blocked = '0.0.0.0';
        const connectionLineEncoding = /(c=IN\s)(.+)\s/ig;
        const candidateEncoding = /((udp|tcp)\s)((\d|\w)+\s)((\d|\w|(\.|\:))+)(?=\s)/ig;

        const connectionLineIp = ((sdp.match(connectionLineEncoding) || [])[0] || '').trim().split(' ')[2];
        if (connectionLineIp && connectionLineIp !== blocked) {
            return connectionLineIp;
        }
        const candidateIp = ((sdp.match(candidateEncoding) || [])[0] || '').split(' ')[2];
        return candidateIp && candidateIp !== blocked ? candidateIp : null;
    }

    try {
        const connection = new RTCPeerConnection({
            iceCandidatePoolSize: 1,
            iceServers: [{
                urls: [
                    'stun:stun4.l.google.com:19302',
                    'stun:stun3.l.google.com:19302'
                ]
            }]
        });

        connection.createDataChannel('');
        const offer = await connection.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
        });
        connection.setLocalDescription(offer);

        const sdp = (offer || {}).sdp || '';
        const extensions = getExtensions(sdp);
        const codecsSdp = getCapabilities(sdp);

        const result = await new Promise(resolve => {
            let iceCandidate = '';
            let foundation = '';

            const timeout = setTimeout(() => {
                connection.removeEventListener('icecandidate', onCandidate);
                connection.close();
                resolve({
                    webrtc: {
                        supported: true,
                        codecsSdp,
                        extensions,
                        foundation,
                        iceCandidate: iceCandidate || null,
                        address: null
                    }
                });
            }, 3000);

            function onCandidate(event) {
                const { candidate } = event.candidate || {};
                if (!candidate) return;

                if (!iceCandidate) {
                    iceCandidate = candidate;
                    foundation = (/^candidate:([\w]+)/.exec(candidate) || [])[1] || '';
                }

                const localSdp = (connection.localDescription || {}).sdp || '';
                const address = getIPAddress(localSdp);
                if (!address) return;

                const knownInterface = {
                    '842163049': 'public interface',
                    '2268587630': 'WireGuard'
                };

                connection.removeEventListener('icecandidate', onCandidate);
                clearTimeout(timeout);
                connection.close();
                resolve({
                    webrtc: {
                        supported: true,
                        codecsSdp,
                        extensions,
                        foundation: knownInterface[foundation] || foundation,
                        iceCandidate,
                        address
                    }
                });
            }

            connection.addEventListener('icecandidate', onCandidate);
        });

        return result;
    } catch (e) {
        return { webrtc: { supported: false, error: e.message } };
    }
}
