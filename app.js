// Global variables
let currentPosition = null;
let watchId = null;
let liveAudioStream = null;
let mediaRecorder = null;
let audioChunks = [];
let isEmergencyActive = false;

const locationStatus = document.createElement('div');
locationStatus.className = 'location-status';
document.querySelector('.sos-section').appendChild(locationStatus);

// Create audio status element
const audioStatus = document.createElement('div');
audioStatus.className = 'audio-status';
document.querySelector('.sos-section').appendChild(audioStatus);

const sosButton = document.getElementById('sosButton');
const complaintBtn = document.getElementById('complaintBtn');
const complaintModal = document.getElementById('complaintModal');
const closeBtn = document.querySelector('.close');
const complaintForm = document.getElementById('complaintForm');
const incidentTypeSelect = document.getElementById('incidentType');
const vehicleDetailsDiv = document.querySelector('.vehicle-details');
const justHappenedCheckbox = document.getElementById('justHappened');
const timeRangeGroup = document.getElementById('timeRangeGroup');
const textReportBtn = document.getElementById('textReportBtn');
const audioReportBtn = document.getElementById('audioReportBtn');
const recordButton = document.getElementById('recordButton');
const audioPreview = document.getElementById('audioPreview');
const audioPlayer = document.getElementById('audioPlayer');

// Initialize location tracking
function initializeLocation() {
    if ('geolocation' in navigator) {
        navigator.geolocation.watchPosition(
            position => {
                currentPosition = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                document.getElementById('location').value = `${currentPosition.latitude}, ${currentPosition.longitude}`;
            },
            error => {
                console.error('Error getting location:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    } else {
        console.log('Geolocation is not supported by your browser');
    }
}

// Audio recording functions
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            audioPlayer.src = audioUrl;
            audioPreview.style.display = 'block';
            recordButton.textContent = '🎤 Start Recording';
            recordButton.classList.remove('recording');
        };

        mediaRecorder.start();
        recordButton.textContent = '⏹️ Stop Recording';
        recordButton.classList.add('recording');
    } catch (err) {
        console.error('Error accessing microphone:', err);
        alert('Could not access microphone. Please check permissions.');
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
}

// Live audio sharing functionality
async function startLiveAudio() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        liveAudioStream = stream;
        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
                // Here you would typically send this chunk to your server
                // For now, we'll just update the status
                audioStatus.innerHTML = `
                    Live Audio Active<br>
                    <small>Recording in progress...</small>
                `;
            }
        };

        mediaRecorder.start(1000); // Collect data every second
        audioStatus.innerHTML = 'Live Audio Started';
    } catch (err) {
        console.error('Error accessing microphone:', err);
        audioStatus.innerHTML = 'Unable to access microphone';
    }
}

function stopLiveAudio() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    if (liveAudioStream) {
        liveAudioStream.getTracks().forEach(track => track.stop());
    }
    audioStatus.innerHTML = 'Audio sharing stopped';
    audioChunks = [];
}

// Location sharing functionality
function startLocationSharing() {
    if (!watchId) {
        if ("geolocation" in navigator) {
            locationStatus.textContent = "Getting your location...";
            watchId = navigator.geolocation.watchPosition(
                position => {
                    currentPosition = position;
                    const { latitude, longitude } = position.coords;
                    locationStatus.innerHTML = `
                        Location active<br>
                        <small>Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}</small>
                    `;
                    const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
                    
                    if (navigator.share) {
                        navigator.share({
                            title: 'Emergency Location',
                            text: 'I need help! Here is my location:',
                            url: mapsUrl
                        }).catch(err => {
                            console.log('Share failed:', err);
                            navigator.clipboard.writeText(mapsUrl).then(() => {
                                locationStatus.innerHTML += '<br><small>Location link copied to clipboard</small>';
                            });
                        });
                    } else {
                        navigator.clipboard.writeText(mapsUrl).then(() => {
                            locationStatus.innerHTML += '<br><small>Location link copied to clipboard</small>';
                        });
                    }
                },
                error => {
                    locationStatus.textContent = "Unable to access location. Please enable location services.";
                    console.error("Location error:", error);
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: 5000
                }
            );
        } else {
            locationStatus.textContent = "Location sharing is not supported on this device.";
        }
    }
}

function stopLocationSharing() {
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
        locationStatus.textContent = "Location sharing stopped";
    }
}

// Handle emergency state
function startEmergency() {
    isEmergencyActive = true;
    startLocationSharing();
    startLiveAudio();
    document.querySelector('.sos-button').classList.add('active');
}

function stopEmergency() {
    isEmergencyActive = false;
    stopLocationSharing();
    stopLiveAudio();
    document.querySelector('.sos-button').classList.remove('active');
}

// Handle complaint form submission
async function handleComplaint(event) {
    event.preventDefault();
    
    const formData = new FormData();
    formData.append('name', document.getElementById('name').value);
    formData.append('contact', document.getElementById('contact').value);
    formData.append('incidentType', incidentTypeSelect.value);
    formData.append('vehicleNumber', document.getElementById('vehicleNumber').value);
    formData.append('justHappened', justHappenedCheckbox.checked);
    formData.append('timeRange', document.getElementById('timeRange').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('location', JSON.stringify(currentPosition));
    formData.append('timestamp', new Date().toISOString());

    if (audioBlob) {
        formData.append('audio', audioBlob, 'complaint.wav');
    }

    try {
        // In a real application, you would send this to your backend
        console.log('Complaint data:', Object.fromEntries(formData));
        alert('Complaint submitted successfully!');
        
        // Reset form
        complaintForm.reset();
        complaintModal.style.display = 'none';
        audioBlob = null;
        audioPreview.style.display = 'none';
        document.querySelector('.text-report').style.display = 'block';
        document.querySelector('.audio-report').style.display = 'none';
        textReportBtn.classList.add('active');
        audioReportBtn.classList.remove('active');
    } catch (error) {
        console.error('Error submitting complaint:', error);
        alert('Error submitting complaint. Please try again.');
    }
}

// SOS Button Event Listener
sosButton.addEventListener('click', async function(e) {
    e.preventDefault();
    
    if (!isEmergencyActive) {
        startEmergency();
        try {
            await navigator.serviceWorker.ready;
            window.location.href = 'tel:1090';
        } catch (err) {
            console.error('Error making emergency call:', err);
        }
    } else {
        stopEmergency();
    }
});

textReportBtn.addEventListener('click', () => {
    textReportBtn.classList.add('active');
    audioReportBtn.classList.remove('active');
    document.querySelector('.text-report').style.display = 'block';
    document.querySelector('.audio-report').style.display = 'none';
});

audioReportBtn.addEventListener('click', () => {
    audioReportBtn.classList.add('active');
    textReportBtn.classList.remove('active');
    document.querySelector('.text-report').style.display = 'none';
    document.querySelector('.audio-report').style.display = 'block';
});

recordButton.addEventListener('click', () => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        startRecording();
    } else {
        stopRecording();
    }
});

incidentTypeSelect.addEventListener('change', (e) => {
    if (e.target.value === 'vehicle') {
        vehicleDetailsDiv.style.display = 'block';
    } else {
        vehicleDetailsDiv.style.display = 'none';
    }
});

justHappenedCheckbox.addEventListener('change', (e) => {
    timeRangeGroup.style.display = e.target.checked ? 'none' : 'block';
});

complaintBtn.addEventListener('click', () => {
    complaintModal.style.display = 'block';
});

closeBtn.addEventListener('click', () => {
    complaintModal.style.display = 'none';
});

complaintForm.addEventListener('submit', handleComplaint);

window.addEventListener('click', (event) => {
    if (event.target === complaintModal) {
        complaintModal.style.display = 'none';
    }
});

// Complaint Form Location Handling
const locationInput = document.getElementById('location');
const useCurrentLocationBtn = document.createElement('button');
useCurrentLocationBtn.type = 'button';
useCurrentLocationBtn.className = 'use-location-btn';
useCurrentLocationBtn.textContent = 'Use Current Location';
locationInput.parentNode.insertBefore(useCurrentLocationBtn, locationInput.nextSibling);

useCurrentLocationBtn.addEventListener('click', () => {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                locationInput.value = `${latitude}, ${longitude}`;
            },
            error => {
                console.error("Location error:", error);
                alert("Unable to get location. Please enter manually.");
            }
        );
    } else {
        alert("Location services not available. Please enter location manually.");
    }
});

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initializeLocation();
});
